import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentAdminSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin authorization required.' }, { status: 403 });
    }

    const body = await req.json();
    const { teamId, newPsId, reason, adminPasswordConfirmation } = body;

    const envAdminPass = process.env.ADMIN_PASSWORD || 'Admin@KernelPrime2026';
    if (!adminPasswordConfirmation || adminPasswordConfirmation !== envAdminPass) {
      return NextResponse.json({ error: 'Invalid admin password confirmation. Action aborted.' }, { status: 401 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({ error: 'A detailed reason for emergency reallocation is mandatory.' }, { status: 400 });
    }

    const db = getDb();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // Verify team
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId) as any;
    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    // Verify target Problem Statement
    const targetPs = db.prepare('SELECT * FROM problem_statements WHERE id = ?').get(newPsId) as any;
    if (!targetPs) {
      return NextResponse.json({ error: 'Target Problem Statement not found.' }, { status: 404 });
    }

    const previousPsId = team.allocated_ps_id;

    // Execute atomic reallocation
    const performReallocation = db.transaction(() => {
      // 1. Decrement old PS allocation count if previously allocated
      if (previousPsId) {
        db.prepare('UPDATE problem_statements SET allocated_count = MAX(0, allocated_count - 1) WHERE id = ?').run(previousPsId);
      }

      // 2. Increment new PS allocation count
      db.prepare('UPDATE problem_statements SET allocated_count = allocated_count + 1 WHERE id = ?').run(newPsId);

      // 3. Update team record
      const nowIso = new Date().toISOString();
      db.prepare(`
        UPDATE teams 
        SET has_allocated = 1, allocated_ps_id = ?, allocation_time = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newPsId, nowIso, teamId);

      // 4. Update or replace allocation record
      db.prepare(`
        INSERT OR REPLACE INTO allocations (id, team_id, problem_statement_id, allocated_at, allocation_seed, status)
        VALUES (?, ?, ?, ?, ?, 'REALLOCATED')
      `).run(`ALC-RE-${Date.now()}`, teamId, newPsId, nowIso, 'ADMIN_MANUAL_REALLOCATION');
    });

    performReallocation();

    // 5. Immutable Audit Log
    logAudit({
      actorType: 'ADMIN',
      actorId: session.username,
      action: 'ADMIN_EMERGENCY_REALLOCATION',
      metadata: {
        teamId,
        teamName: team.team_name,
        previousPsId,
        newPsId,
        reason: reason.trim(),
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: `Team ${team.team_name} successfully reallocated to ${newPsId}`,
    });
  } catch (err: any) {
    console.error('Reallocation error:', err);
    return NextResponse.json({ error: 'Failed to perform reallocation' }, { status: 500 });
  }
}
