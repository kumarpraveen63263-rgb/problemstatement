import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const filter = searchParams.get('filter') || 'ALL'; // ALL, ALLOCATED, PENDING, DOWNLOADED, NOT_DOWNLOADED, or PS-XX
    const sortBy = searchParams.get('sortBy') || 'name'; // name, college, allocationTime
    const order = searchParams.get('order') || 'asc';

    const db = getDb();

    let query = `
      SELECT t.*,
             ps.title as ps_title,
             (SELECT COUNT(*) FROM downloads d WHERE d.team_id = t.id) as download_count,
             (SELECT MAX(downloaded_at) FROM downloads d WHERE d.team_id = t.id) as last_download_time,
             (SELECT COUNT(*) FROM login_events le WHERE le.team_id = t.id) as login_count
      FROM teams t
      LEFT JOIN problem_statements ps ON t.allocated_ps_id = ps.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Search filter
    if (search) {
      query += ` AND (LOWER(t.team_name) LIKE ? OR LOWER(t.college_name) LIKE ? OR LOWER(t.leader_name) LIKE ? OR t.leader_mobile LIKE ?)`;
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild);
    }

    // Status filter
    if (filter === 'ALLOCATED') {
      query += ` AND t.has_allocated = 1`;
    } else if (filter === 'PENDING') {
      query += ` AND t.has_allocated = 0`;
    } else if (filter === 'DOWNLOADED') {
      query += ` AND (SELECT COUNT(*) FROM downloads d WHERE d.team_id = t.id) > 0`;
    } else if (filter === 'NOT_DOWNLOADED') {
      query += ` AND (SELECT COUNT(*) FROM downloads d WHERE d.team_id = t.id) = 0`;
    } else if (filter.startsWith('PS-')) {
      query += ` AND t.allocated_ps_id = ?`;
      params.push(filter);
    }

    // Sorting
    if (sortBy === 'college') {
      query += ` ORDER BY t.college_name ${order === 'desc' ? 'DESC' : 'ASC'}`;
    } else if (sortBy === 'allocationTime') {
      query += ` ORDER BY t.allocation_time ${order === 'desc' ? 'DESC' : 'ASC'}`;
    } else {
      query += ` ORDER BY t.team_name ${order === 'desc' ? 'DESC' : 'ASC'}`;
    }

    const teams = db.prepare(query).all(...params) as any[];

    const formattedTeams = teams.map((team) => {
      const isAllocated = team.has_allocated === 1;
      const downloadCount = Number(team.download_count) || 0;

      return {
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
        hasAllocated: isAllocated,
        allocatedPsId: team.allocated_ps_id,
        psTitle: team.ps_title,
        allocationTime: team.allocation_time,
        lastLoginAt: team.last_login_at,
        loginCount: Number(team.login_count) || 0,
        downloadCount,
        hasDownloaded: downloadCount > 0,
        lastDownloadTime: team.last_download_time,
        createdAt: team.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      count: formattedTeams.length,
      teams: formattedTeams,
    });
  } catch (err: any) {
    console.error('Admin teams fetch error:', err);
    return NextResponse.json({ error: 'Failed to retrieve teams' }, { status: 500 });
  }
}
