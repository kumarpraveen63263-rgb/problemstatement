import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    const result = await authenticateAdmin(username || '', password || '', ip);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || 'Admin authentication failed' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      admin: {
        username,
        role: result.role,
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60, // 12 hours
    });

    return response;
  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
