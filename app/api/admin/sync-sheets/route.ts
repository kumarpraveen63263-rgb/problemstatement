import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminSession } from '@/lib/auth';
import { syncToGoogleSheets } from '@/lib/sheets';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    const result = await syncToGoogleSheets();

    logAudit({
      actorType: 'ADMIN',
      actorId: session.username,
      action: 'ADMIN_TRIGGERED_SHEETS_SYNC',
      metadata: { result },
      ipAddress: ip,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Manual sheet sync error:', err);
    return NextResponse.json({ success: false, message: 'Sync failed: ' + err.message }, { status: 500 });
  }
}
