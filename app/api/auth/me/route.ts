import { NextRequest, NextResponse } from 'next/server';
import { getCurrentTeamSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentTeamSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const db = getDb();
    const team = db.prepare(`
      SELECT id, team_name, college_name, leader_name, leader_email, 
             leader_mobile, members_count, track, registration_status, 
             payment_status, has_allocated, allocated_ps_id, allocation_time, 
             last_login_at
      FROM teams WHERE id = ?
    `).get(session.teamId) as any;

    if (!team) {
      return NextResponse.json({ authenticated: false, error: 'Team record not found' }, { status: 404 });
    }

    let allocatedPs = null;
    let downloadInfo = null;

    if (team.has_allocated === 1 && team.allocated_ps_id) {
      allocatedPs = db.prepare(`
        SELECT id, code, title, description, pdf_path
        FROM problem_statements WHERE id = ?
      `).get(team.allocated_ps_id) as any;

      const downloads = db.prepare(`
        SELECT COUNT(*) as count, MIN(downloaded_at) as first_download, MAX(downloaded_at) as last_download
        FROM downloads WHERE team_id = ?
      `).get(team.id) as any;

      downloadInfo = {
        count: downloads?.count || 0,
        firstDownload: downloads?.first_download || null,
        lastDownload: downloads?.last_download || null,
      };
    }

    // Get system allocation status
    const statusSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'allocation_status'").get() as { value: string } | undefined;
    const testModeSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'test_mode'").get() as { value: string } | undefined;

    return NextResponse.json({
      authenticated: true,
      team: {
        id: team.id,
        teamName: team.team_name,
        collegeName: team.college_name,
        leaderName: team.leader_name,
        leaderEmail: team.leader_email,
        leaderMobile: team.leader_mobile,
        membersCount: team.members_count,
        track: team.track,
        registrationStatus: team.registration_status,
        paymentStatus: team.payment_status,
        hasAllocated: team.has_allocated === 1,
        allocatedPsId: team.allocated_ps_id,
        allocationTime: team.allocation_time,
        lastLoginAt: team.last_login_at,
      },
      allocatedPs,
      downloadInfo,
      systemStatus: {
        allocationStatus: statusSetting?.value || 'OPEN',
        testMode: testModeSetting?.value === 'true',
      },
    });
  } catch (err: any) {
    console.error('Session fetch error:', err);
    return NextResponse.json({ authenticated: false, error: 'Internal server error' }, { status: 500 });
  }
}
