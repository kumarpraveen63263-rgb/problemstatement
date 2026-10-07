import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const db = getDb();

    const team = db.prepare(`
      SELECT t.*, ps.title as ps_title, ps.description as ps_desc
      FROM teams t
      LEFT JOIN problem_statements ps ON t.allocated_ps_id = ps.id
      WHERE t.id = ?
    `).get(id) as any;

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Login events
    const loginHistory = db.prepare(`
      SELECT id, login_time, logout_time, ip_address, status
      FROM login_events
      WHERE team_id = ?
      ORDER BY login_time DESC
      LIMIT 20
    `).all(id);

    // Downloads
    const downloadHistory = db.prepare(`
      SELECT id, downloaded_at, ip_address
      FROM downloads
      WHERE team_id = ?
      ORDER BY downloaded_at DESC
    `).all(id);

    // Audit entries
    const auditHistory = db.prepare(`
      SELECT id, action, metadata, ip_address, created_at
      FROM audit_log
      WHERE actor_id = ? OR metadata LIKE ?
      ORDER BY created_at DESC
      LIMIT 25
    `).all(id, `%"teamName":"${team.team_name}"%`);

    // Allocation detail if any
    const allocation = db.prepare(`
      SELECT * FROM allocations WHERE team_id = ?
    `).get(id);

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        teamName: team.team_name,
        collegeName: team.college_name,
        leaderName: team.leader_name,
        leaderMobile: team.leader_mobile,
        leaderEmail: team.leader_email,
        membersCount: team.members_count,
        track: team.track,
        registrationStatus: team.registration_status,
        paymentStatus: team.payment_status,
        hasAllocated: team.has_allocated === 1,
        allocatedPsId: team.allocated_ps_id,
        psTitle: team.ps_title,
        psDesc: team.ps_desc,
        allocationTime: team.allocation_time,
        lastLoginAt: team.last_login_at,
        createdAt: team.created_at,
      },
      allocation,
      loginHistory,
      downloadHistory,
      auditHistory,
    });
  } catch (err: any) {
    console.error('Team detail fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
