import { getDb } from './db';
import { logAudit } from './audit';
import { syncToGoogleSheets } from './sheets';
import crypto from 'crypto';

export interface AllocationResult {
  success: boolean;
  error?: string;
  isExistingAllocation?: boolean;
  assignedPs?: {
    id: string;
    code: string;
    title: string;
    description: string;
    pdfPath: string;
  };
  allocatedAt?: string;
}

/**
 * Performs atomic, server-side problem statement allocation.
 * Guarantees zero frontend bias, zero race conditions, and strict capacity enforcement.
 */
export async function executeAtomicAllocation(teamId: string, ipAddress = 'unknown'): Promise<AllocationResult> {
  const db = getDb();

  // 1. Check Global System Allocation Status
  const statusSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'allocation_status'").get() as { value: string } | undefined;
  const currentStatus = statusSetting?.value || 'CLOSED';

  if (currentStatus === 'CLOSED') {
    return {
      success: false,
      error: 'Problem Statement Allocation Has Not Started Yet.',
    };
  }

  if (currentStatus === 'PAUSED') {
    return {
      success: false,
      error: 'Problem Statement Allocation is temporarily paused by event administrators. Please wait.',
    };
  }

  // 2. Fetch Team Record
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId) as any;
  if (!team) {
    return {
      success: false,
      error: 'Team record not found. Please log in again.',
    };
  }

  // 3. Idempotency Check: Has team already been allocated?
  if (team.has_allocated === 1 && team.allocated_ps_id) {
    const existingPs = db.prepare('SELECT * FROM problem_statements WHERE id = ?').get(team.allocated_ps_id) as any;
    return {
      success: true,
      isExistingAllocation: true,
      assignedPs: {
        id: existingPs.id,
        code: existingPs.code,
        title: existingPs.title,
        description: existingPs.description,
        pdfPath: existingPs.pdf_path,
      },
      allocatedAt: team.allocation_time,
    };
  }

  // 4. ATOMIC DATABASE TRANSACTION
  // SQLite transaction with immediate lock guarantees ACID isolation across all requests
  const performAllocation = db.transaction(() => {
    // Re-verify inside transaction to eliminate any concurrent race condition
    const lockedTeam = db.prepare('SELECT has_allocated, allocated_ps_id, allocation_time FROM teams WHERE id = ?').get(teamId) as any;
    if (lockedTeam.has_allocated === 1 && lockedTeam.allocated_ps_id) {
      const ps = db.prepare('SELECT * FROM problem_statements WHERE id = ?').get(lockedTeam.allocated_ps_id) as any;
      return {
        alreadyDone: true,
        ps,
        allocatedAt: lockedTeam.allocation_time,
      };
    }

    // Query ONLY problem statements with remaining capacity (allocated_count < capacity) and active
    const availablePS = db.prepare(`
      SELECT * FROM problem_statements 
      WHERE is_active = 1 AND allocated_count < capacity
    `).all() as any[];

    if (!availablePS || availablePS.length === 0) {
      throw new Error('CAPACITY_EXHAUSTED: All available Problem Statements have reached maximum capacity.');
    }

    // Cryptographically secure random selection from available pool
    const randomIndex = crypto.randomInt(0, availablePS.length);
    const selectedPS = availablePS[randomIndex];

    const allocationId = `ALC-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const allocationSeed = crypto.randomBytes(16).toString('hex');
    const nowIso = new Date().toISOString();

    // 1. Insert into Allocations (Strict UNIQUE constraint on team_id)
    db.prepare(`
      INSERT INTO allocations (id, team_id, problem_statement_id, allocated_at, allocation_seed, status)
      VALUES (?, ?, ?, ?, ?, 'CONFIRMED')
    `).run(allocationId, teamId, selectedPS.id, nowIso, allocationSeed);

    // 2. Increment allocated_count on Problem Statement
    db.prepare(`
      UPDATE problem_statements 
      SET allocated_count = allocated_count + 1 
      WHERE id = ?
    `).run(selectedPS.id);

    // 3. Mark team as permanently allocated
    db.prepare(`
      UPDATE teams 
      SET has_allocated = 1, allocated_ps_id = ?, allocation_time = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(selectedPS.id, nowIso, teamId);

    return {
      alreadyDone: false,
      ps: selectedPS,
      allocatedAt: nowIso,
    };
  });

  try {
    const txResult = performAllocation();

    // 5. Audit Logging
    logAudit({
      actorType: 'TEAM',
      actorId: teamId,
      action: 'ALLOCATION_SUCCESS',
      metadata: {
        teamName: team.team_name,
        allocatedPs: txResult.ps.code,
        psTitle: txResult.ps.title,
        isIdempotentReplay: txResult.alreadyDone,
      },
      ipAddress,
    });

    // 6. Background Google Sheets synchronization (Non-blocking)
    syncToGoogleSheets(teamId).catch((err) => {
      console.error('Non-blocking sheet sync failed:', err);
    });

    return {
      success: true,
      isExistingAllocation: txResult.alreadyDone,
      assignedPs: {
        id: txResult.ps.id,
        code: txResult.ps.code,
        title: txResult.ps.title,
        description: txResult.ps.description,
        pdfPath: txResult.ps.pdf_path,
      },
      allocatedAt: txResult.allocatedAt,
    };
  } catch (error: any) {
    console.error('Allocation error:', error);
    logAudit({
      actorType: 'TEAM',
      actorId: teamId,
      action: 'ALLOCATION_FAILED',
      metadata: { error: error.message },
      ipAddress,
    });

    return {
      success: false,
      error: error.message.includes('CAPACITY_EXHAUSTED')
        ? 'All problem statements have reached their team quota. Please contact event coordinators.'
        : 'An error occurred during allocation. Please refresh to check your status or contact support.',
    };
  }
}
