import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { teams, overwriteExisting } = body;

    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json({ error: 'No team data provided for import.' }, { status: 400 });
    }

    const db = getDb();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    const insertStmt = db.prepare(`
      INSERT INTO teams (
        id, team_name, college_name, leader_name, leader_mobile, leader_email,
        members_count, track, registration_status, payment_status, credential_hash
      ) VALUES (
        @id, @team_name, @college_name, @leader_name, @leader_mobile, @leader_email,
        @members_count, 'Software Track', 'CONFIRMED', @payment_status, @credential_hash
      )
    `);

    let importedCount = 0;
    const errors: string[] = [];

    const importTx = db.transaction((rows: any[]) => {
      if (overwriteExisting) {
        db.exec('DELETE FROM downloads');
        db.exec('DELETE FROM allocations');
        db.exec('DELETE FROM login_events');
        db.exec('DELETE FROM teams');
        db.exec('UPDATE problem_statements SET allocated_count = 0');
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rawName = row['Team Name'] || row.teamName || row.name;
        const rawCollege = row['College'] || row.collegeName || row.college;
        const rawLeader = row['Team Leader'] || row.leaderName || row.leader;
        const rawMobile = row['Mobile'] || row.leaderMobile || row.mobile;
        const rawEmail = row['Email'] || row.leaderEmail || row.email;
        const rawMembers = Number(row['Members Count'] || row.membersCount || row.count) || 4;
        const rawPayment = row['Payment Status'] || row.paymentStatus || 'PAID';

        if (!rawName || !rawMobile) {
          errors.push(`Row ${i + 1}: Missing Team Name or Mobile Number`);
          continue;
        }

        const cleanName = String(rawName).trim().toUpperCase();
        const cleanMobile = String(rawMobile).replace(/\D/g, '');
        const id = `TEAM-${Date.now()}-${String(i + 1).padStart(3, '0')}`;
        const credHash = bcrypt.hashSync(cleanMobile, 10);

        try {
          insertStmt.run({
            id,
            team_name: cleanName,
            college_name: rawCollege ? String(rawCollege).trim() : 'S.A. Engineering College',
            leader_name: rawLeader ? String(rawLeader).trim() : 'Team Leader',
            leader_mobile: String(rawMobile).trim(),
            leader_email: rawEmail ? String(rawEmail).trim() : `team${i + 1}@hackathon.local`,
            members_count: rawMembers,
            payment_status: rawPayment,
            credential_hash: credHash,
          });
          importedCount++;
        } catch (insertErr: any) {
          errors.push(`Row ${i + 1} (${cleanName}): ${insertErr.message}`);
        }
      }
    });

    importTx(teams);

    logAudit({
      actorType: 'ADMIN',
      actorId: session.username,
      action: 'ADMIN_TEAM_IMPORT',
      metadata: { importedCount, errorsCount: errors.length, overwrite: !!overwriteExisting },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      importedCount,
      errors,
      message: `Successfully imported ${importedCount} teams.`,
    });
  } catch (err: any) {
    console.error('Import error:', err);
    return NextResponse.json({ error: 'Failed to process team import' }, { status: 500 });
  }
}
