import { NextRequest, NextResponse } from 'next/server';
import { getCurrentTeamSession } from '@/lib/auth';
import { executeAtomicAllocation } from '@/lib/allocation';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentTeamSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Session expired or invalid. Please log in again.' },
        { status: 401 }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // Execute server-side atomic allocation
    const result = await executeAtomicAllocation(session.teamId, ip);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Allocation could not be completed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      assignedPs: result.assignedPs,
      allocatedAt: result.allocatedAt,
      isExistingAllocation: result.isExistingAllocation || false,
    });
  } catch (err: any) {
    console.error('Spin API error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error during allocation transaction' },
      { status: 500 }
    );
  }
}
