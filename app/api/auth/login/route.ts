import { NextRequest, NextResponse } from 'next/server';
import { authenticateTeam, TEAM_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamName, mobile } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    const result = await authenticateTeam(teamName || '', mobile || '', ip);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      team: {
        id: result.team.id,
        teamName: result.team.team_name,
        leaderName: result.team.leader_name,
        collegeName: result.team.college_name,
        track: result.team.track,
        hasAllocated: result.team.has_allocated === 1,
        allocatedPsId: result.team.allocated_ps_id,
      },
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: TEAM_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
