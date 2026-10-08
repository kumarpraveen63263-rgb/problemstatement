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

    const db = getDb();

    // 1. Team stats
    const totalTeams = (db.prepare('SELECT COUNT(*) as count FROM teams').get() as any).count;
    const allocatedTeams = (db.prepare('SELECT COUNT(*) as count FROM teams WHERE has_allocated = 1').get() as any).count;
    const pendingTeams = totalTeams - allocatedTeams;

    // 2. Download stats
    const totalDownloads = (db.prepare('SELECT COUNT(*) as count FROM downloads').get() as any).count;
    const distinctTeamsDownloaded = (db.prepare('SELECT COUNT(DISTINCT team_id) as count FROM downloads').get() as any).count;

    // 3. Teams Active in last 30 minutes
    const teamsActive = (db.prepare(`
      SELECT COUNT(DISTINCT team_id) as count 
      FROM login_events 
      WHERE login_time >= datetime('now', '-30 minutes')
    `).get() as any).count;

    // 4. Problem Statement Capacities
    const problemStatements = db.prepare(`
      SELECT id, code, title, capacity, allocated_count, is_active
      FROM problem_statements
      ORDER BY code ASC
    `).all() as any[];

    const totalCapacity = problemStatements.reduce((sum, ps) => sum + ps.capacity, 0);

    // 5. System settings
    const statusSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'allocation_status'").get() as { value: string } | undefined;
    const testModeSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'test_mode'").get() as { value: string } | undefined;
    const ribbonSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'ribbon_enabled'").get() as { value: string } | undefined;

    return NextResponse.json({
      success: true,
      stats: {
        totalTeams,
        allocatedTeams,
        pendingTeams,
        problemStatementsCount: problemStatements.length,
        totalCapacity,
        totalDownloads,
        distinctTeamsDownloaded,
        teamsActive: Math.max(teamsActive, allocatedTeams > 0 ? 1 : 0),
        allocationStatus: statusSetting?.value || 'OPEN',
        testMode: testModeSetting?.value === 'true',
        ribbonEnabled: ribbonSetting ? ribbonSetting.value === 'true' : true,
      },
      capacities: problemStatements.map((ps) => ({
        id: ps.id,
        code: ps.code,
        title: ps.title,
        capacity: ps.capacity,
        allocatedCount: ps.allocated_count,
        remaining: Math.max(0, ps.capacity - ps.allocated_count),
        isFull: ps.allocated_count >= ps.capacity,
        isActive: ps.is_active === 1,
        fillPercentage: Math.round((ps.allocated_count / ps.capacity) * 100),
      })),
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Failed to retrieve admin stats' }, { status: 500 });
  }
}
