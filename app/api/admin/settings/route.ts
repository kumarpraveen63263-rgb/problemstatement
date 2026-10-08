import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const settings = db.prepare('SELECT key, value FROM system_settings').all() as { key: string; value: string }[];
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const problemStatements = db.prepare('SELECT * FROM problem_statements ORDER BY code ASC').all();

    return NextResponse.json({
      success: true,
      settings: {
        allocationStatus: settingsMap['allocation_status'] || 'OPEN',
        testMode: settingsMap['test_mode'] === 'true',
        ribbonEnabled: settingsMap['ribbon_enabled'] !== 'false',
        emergencyMessage: settingsMap['emergency_message'] || '',
      },
      problemStatements,
    });
  } catch (err: any) {
    console.error('Settings fetch error:', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const db = getDb();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // 1. Allocation Status update (OPEN, CLOSED, PAUSED)
    if (body.allocationStatus) {
      const validStatuses = ['OPEN', 'CLOSED', 'PAUSED'];
      if (validStatuses.includes(body.allocationStatus)) {
        db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('allocation_status', ?, datetime('now'))").run(body.allocationStatus);
        logAudit({
          actorType: 'ADMIN',
          actorId: session.username,
          action: 'ALLOCATION_STATUS_CHANGED',
          metadata: { newStatus: body.allocationStatus },
          ipAddress: ip,
        });
      }
    }

    // 2. Test mode update
    if (typeof body.testMode === 'boolean') {
      const testVal = body.testMode ? 'true' : 'false';
      db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('test_mode', ?, datetime('now'))").run(testVal);
      logAudit({
        actorType: 'ADMIN',
        actorId: session.username,
        action: 'TEST_MODE_TOGGLED',
        metadata: { testMode: body.testMode },
        ipAddress: ip,
      });
    }

    // 3. Ribbon Inauguration toggle
    if (typeof body.ribbonEnabled === 'boolean') {
      const ribbonVal = body.ribbonEnabled ? 'true' : 'false';
      db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('ribbon_enabled', ?, datetime('now'))").run(ribbonVal);
      logAudit({
        actorType: 'ADMIN',
        actorId: session.username,
        action: 'RIBBON_INAUGURATION_TOGGLED',
        metadata: { ribbonEnabled: body.ribbonEnabled },
        ipAddress: ip,
      });
    }

    // 3. Problem Statement capacity / active update
    if (body.updatePs && Array.isArray(body.updatePs)) {
      const updateStmt = db.prepare(`
        UPDATE problem_statements 
        SET capacity = ?, is_active = ?, title = ?
        WHERE id = ?
      `);

      const tx = db.transaction((items) => {
        for (const item of items) {
          updateStmt.run(item.capacity, item.isActive ? 1 : 0, item.title, item.id);
        }
      });

      tx(body.updatePs);

      logAudit({
        actorType: 'ADMIN',
        actorId: session.username,
        action: 'CAPACITY_UPDATED',
        metadata: { updatedCount: body.updatePs.length },
        ipAddress: ip,
      });
    }

    return NextResponse.json({ success: true, message: 'Settings successfully updated' });
  } catch (err: any) {
    console.error('Settings update error:', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
