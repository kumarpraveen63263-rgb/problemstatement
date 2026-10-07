import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentAdminSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Administrative authorization required.' }, { status: 403 });
    }

    const body = await req.json();
    const { adminPassword, reason } = body;

    const envAdminPass = process.env.ADMIN_PASSWORD || 'Admin@KernelPrime2026';
    if (!adminPassword || adminPassword.trim() !== envAdminPass) {
      return NextResponse.json({ error: 'Invalid admin password confirmation. Master reset aborted.' }, { status: 401 });
    }

    const db = getDb();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // Execute atomic master reset
    const performMasterReset = db.transaction(() => {
      // 1. Wipe all allocations
      db.prepare('DELETE FROM allocations').run();

      // 2. Wipe all download telemetry
      db.prepare('DELETE FROM downloads').run();

      // 3. Reset all teams back to unallocated state
      db.prepare(`
        UPDATE teams 
        SET has_allocated = 0, allocated_ps_id = NULL, allocation_time = NULL, updated_at = datetime('now')
      `).run();

      // 4. Reset all problem statement allocation counts to zero
      db.prepare('UPDATE problem_statements SET allocated_count = 0').run();
    });

    performMasterReset();

    // 5. Immutable Security Audit Log
    logAudit({
      actorType: 'ADMIN',
      actorId: session.username,
      action: 'ADMIN_MASTER_SYSTEM_RESET',
      metadata: {
        reason: reason?.trim() || 'Master collision resolution / live re-allocation reset',
        timestamp: new Date().toISOString(),
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Master reset successful. All allocations have been cleared and all teams reset to initial unallocated state.',
    });
  } catch (err: any) {
    console.error('Master reset error:', err);
    return NextResponse.json({ error: err.message || 'Failed to execute master reset' }, { status: 500 });
  }
}
