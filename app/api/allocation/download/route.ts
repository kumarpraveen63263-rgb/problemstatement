import { NextRequest, NextResponse } from 'next/server';
import { getCurrentTeamSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const PS_FILE_MAP: Record<string, string[]> = {
  'PS-01': ['PS1.pdf', 'PS01_Decentralized_Supply_Chain.pdf'],
  'PS-02': ['PS2.pdf', 'PS02_AI_Healthcare_Diagnostics.pdf'],
  'PS-03': ['PS3.pdf', 'PS03_Autonomous_Traffic_Optimization.pdf'],
  'PS-04': ['PS4.pdf', 'PS04_Smart_Grid_Energy_Forecasting.pdf'],
  'PS-05': ['PS5.pdf', 'PS05_Cyber_Threat_Hunting_LLM.pdf'],
  'PS-06': ['PS6.pdf', 'PS06_Agritech_Precision_Irrigation.pdf'],
  'PS-07': ['PS7.pdf', 'PS07_Disaster_Response_Drone_Swarm.pdf'],
  'PS-08': ['PS8.pdf', 'PS08_Zero_Knowledge_Identity_Vault.pdf'],
  'PS-09': ['PS9.pdf', 'PS09_Fintech_Fraud_Detection_Engine.pdf'],
};

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentTeamSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const db = getDb();

    // Query team and verify allocation status directly from source-of-truth database
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(session.teamId) as any;
    if (!team) {
      return NextResponse.json({ error: 'Team record not found.' }, { status: 404 });
    }

    if (team.has_allocated !== 1 || !team.allocated_ps_id) {
      logAudit({
        actorType: 'TEAM',
        actorId: team.id,
        action: 'UNAUTHORIZED_DOWNLOAD_ATTEMPT',
        metadata: { reason: 'No PS allocated yet' },
        ipAddress: ip,
      });
      return NextResponse.json(
        { error: 'Forbidden: You must complete your Problem Statement allocation before downloading.' },
        { status: 403 }
      );
    }

    const psCode = team.allocated_ps_id;
    const candidates = PS_FILE_MAP[psCode] || [`${psCode}.pdf`, `PS_${psCode}.pdf`];

    let filePath: string | null = null;
    let resolvedFileName = `${psCode}.pdf`;

    for (const name of candidates) {
      const privatePath = path.join(process.cwd(), 'private', 'problem-statements', name);
      if (fs.existsSync(privatePath)) {
        filePath = privatePath;
        resolvedFileName = name;
        break;
      }
      const publicPath = path.join(process.cwd(), 'public', 'problem-statements', name);
      if (fs.existsSync(publicPath)) {
        filePath = publicPath;
        resolvedFileName = name;
        break;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      console.error(`File missing for PS ${psCode}`);
      return NextResponse.json(
        { error: 'Problem Statement document is temporarily unavailable. Contact support.' },
        { status: 404 }
      );
    }

    // Record Download Event in Database
    const downloadId = `DL-${Date.now()}`;
    db.prepare(`
      INSERT INTO downloads (id, team_id, problem_statement_id, downloaded_at, ip_address)
      VALUES (?, ?, ?, datetime('now'), ?)
    `).run(downloadId, team.id, psCode, ip);

    // Audit log
    logAudit({
      actorType: 'TEAM',
      actorId: team.id,
      action: 'PS_DOWNLOADED',
      metadata: { psCode, fileName: resolvedFileName },
      ipAddress: ip,
    });

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KERNEL_PRIME_26_${psCode}_Problem_Statement.pdf"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    console.error('Download route error:', err);
    return NextResponse.json({ error: 'Server error while generating download' }, { status: 500 });
  }
}
