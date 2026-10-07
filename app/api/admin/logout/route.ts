import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, getCurrentAdminSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const session = await getCurrentAdminSession();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  if (session) {
    logAudit({
      actorType: 'ADMIN',
      actorId: session.username,
      action: 'ADMIN_LOGOUT',
      ipAddress: ip,
    });
  }

  const response = NextResponse.json({ success: true, message: 'Admin logged out' });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
