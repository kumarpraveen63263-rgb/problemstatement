import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    const statements = db.prepare(`
      SELECT id, code, title, description, capacity, allocated_count, is_active
      FROM problem_statements
      ORDER BY code ASC
    `).all() as any[];

    const statusSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'allocation_status'").get() as { value: string } | undefined;
    const testModeSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'test_mode'").get() as { value: string } | undefined;

    const formatted = statements.map((ps) => {
      const isFull = ps.allocated_count >= ps.capacity;
      const remaining = Math.max(0, ps.capacity - ps.allocated_count);
      return {
        id: ps.id,
        code: ps.code,
        title: ps.title,
        description: ps.description,
        capacity: ps.capacity,
        allocatedCount: ps.allocated_count,
        remaining,
        isFull,
        isActive: ps.is_active === 1,
      };
    });

    return NextResponse.json({
      success: true,
      allocationStatus: statusSetting?.value || 'OPEN',
      testMode: testModeSetting?.value === 'true',
      problemStatements: formatted,
    });
  } catch (err: any) {
    console.error('Status fetch error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch status' }, { status: 500 });
  }
}
