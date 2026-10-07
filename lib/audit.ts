import { getDb } from './db';
import crypto from 'crypto';

export interface AuditEntry {
  actorType: 'TEAM' | 'ADMIN' | 'SYSTEM';
  actorId: string;
  action: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export function logAudit(entry: AuditEntry): void {
  try {
    const db = getDb();
    const id = `AUD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const stmt = db.prepare(`
      INSERT INTO audit_log (id, actor_type, actor_id, action, metadata, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(
      id,
      entry.actorType,
      entry.actorId,
      entry.action,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
      entry.ipAddress || null
    );
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

export function getRecentAuditLogs(limit = 100) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?
  `).all(limit);
}
