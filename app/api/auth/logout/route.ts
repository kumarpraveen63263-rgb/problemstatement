import { NextRequest, NextResponse } from 'next/server';
import { TEAM_COOKIE_NAME, getCurrentTeamSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentTeamSession();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    if (session) {
      logAudit({
        actorType: 'TEAM',
        actorId: session.teamId,
        action: 'TEAM_LOGOUT',
        metadata: { teamName: session.teamName },
        ipAddress: ip,
      });
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.delete(TEAM_COOKIE_NAME);
    return response;
  } catch (err) {
    const response = NextResponse.json({ success: true });
    response.cookies.delete(TEAM_COOKIE_NAME);
    return response;
  }
}
