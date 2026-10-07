import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminSession } from '@/lib/auth';
import { getStructuredTeamsForExport } from '@/lib/sheets';
import { logAudit } from '@/lib/audit';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv'; // csv or xlsx
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    const data = getStructuredTeamsForExport();

    logAudit({
      actorType: 'ADMIN',
      actorId: session.username,
      action: 'ADMIN_EXPORT',
      metadata: { format, rowCount: data.length },
      ipAddress: ip,
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KernelPrime_Allocations');

    if (format === 'xlsx') {
      const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="KERNEL_PRIME_26_Allocation_Report_${Date.now()}.xlsx"`,
        },
      });
    }

    // Default CSV
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="KERNEL_PRIME_26_Allocation_Report_${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Failed to generate export file' }, { status: 500 });
  }
}
