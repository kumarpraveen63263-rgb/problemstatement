import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { logAudit } from './audit';

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'kernel-prime-2026-super-secure-production-jwt-key-9988'
);

export const TEAM_COOKIE_NAME = 'kp_team_session';
export const ADMIN_COOKIE_NAME = 'kp_admin_session';

// In-memory rate limiting map: identifier -> { attempts, lastAttempt }
const loginRateLimitMap = new Map<string, { count: number; firstAttempt: number }>();

export function checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const record = loginRateLimitMap.get(identifier);

  if (!record) {
    loginRateLimitMap.set(identifier, { count: 1, firstAttempt: now });
    return true;
  }

  if (now - record.firstAttempt > windowMs) {
    // Window expired, reset
    loginRateLimitMap.set(identifier, { count: 1, firstAttempt: now });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false; // Rate limited
  }

  record.count += 1;
  return true;
}

export function resetRateLimit(identifier: string) {
  loginRateLimitMap.delete(identifier);
}

// ==================== TEAM AUTHENTICATION ====================

export interface TeamSessionPayload {
  teamId: string;
  teamName: string;
  leaderName: string;
  role: 'TEAM';
}

export async function createTeamSessionToken(payload: TeamSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyTeamSessionToken(token: string): Promise<TeamSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'TEAM' || !payload.teamId) return null;
    return payload as unknown as TeamSessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentTeamSession(): Promise<TeamSessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(TEAM_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyTeamSessionToken(token);
}

export async function authenticateTeam(
  rawTeamName: string,
  rawMobile: string,
  ipAddress = 'unknown'
): Promise<{ success: boolean; error?: string; team?: any; token?: string }> {
  const cleanTeamName = rawTeamName.trim().toUpperCase();
  const cleanMobile = rawMobile.trim().replace(/\D/g, '');

  if (!cleanTeamName || !cleanMobile) {
    return { success: false, error: 'Invalid Team Name or Team Leader Mobile Number.' };
  }

  // Rate limit key per IP + Team
  const rateLimitKey = `team-login:${ipAddress}:${cleanTeamName}`;
  if (!checkRateLimit(rateLimitKey)) {
    logAudit({
      actorType: 'TEAM',
      actorId: cleanTeamName,
      action: 'TEAM_LOGIN_RATE_LIMITED',
      ipAddress,
    });
    return {
      success: false,
      error: 'Too many failed login attempts. Please wait 5 minutes before trying again.',
    };
  }

  const db = getDb();
  const team = db.prepare('SELECT * FROM teams WHERE UPPER(team_name) = ?').get(cleanTeamName) as any;

  if (!team) {
    logAudit({
      actorType: 'TEAM',
      actorId: cleanTeamName,
      action: 'TEAM_LOGIN_FAILED',
      metadata: { reason: 'Team not found' },
      ipAddress,
    });
    return { success: false, error: 'Invalid Team Name or Team Leader Mobile Number.' };
  }

  // Compare mobile against bcrypt hash with direct clean mobile fallback
  let isMatch = false;
  try {
    if (team.credential_hash) {
      isMatch = bcrypt.compareSync(cleanMobile, team.credential_hash);
    }
  } catch (e) {
    console.warn('bcrypt compare error, checking raw mobile match:', e);
  }

  if (!isMatch && team.leader_mobile) {
    const rawClean = team.leader_mobile.replace(/\D/g, '');
    if (cleanMobile === rawClean || cleanMobile.endsWith(rawClean) || rawClean.endsWith(cleanMobile)) {
      isMatch = true;
    }
  }

  if (!isMatch) {
    try {
      logAudit({
        actorType: 'TEAM',
        actorId: team.id,
        action: 'TEAM_LOGIN_FAILED',
        metadata: { reason: 'Invalid mobile match' },
        ipAddress,
      });
    } catch (_) {}
    return { success: false, error: 'Invalid Team Name or Team Leader Mobile Number.' };
  }

  // Reset rate limit on success
  resetRateLimit(rateLimitKey);

  // Update last login (safely)
  try {
    db.prepare(`
      UPDATE teams 
      SET last_login_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(team.id);

    // Record login event
    const loginEventId = `LOG-${Date.now()}`;
    db.prepare(`
      INSERT INTO login_events (id, team_id, login_time, ip_address, status)
      VALUES (?, ?, datetime('now'), ?, 'SUCCESS')
    `).run(loginEventId, team.id, ipAddress);

    logAudit({
      actorType: 'TEAM',
      actorId: team.id,
      action: 'TEAM_LOGIN',
      metadata: { teamName: team.team_name, leader: team.leader_name },
      ipAddress,
    });
  } catch (dbUpdateErr) {
    console.warn('Non-critical login telemetry update error:', dbUpdateErr);
  }

  const token = await createTeamSessionToken({
    teamId: team.id,
    teamName: team.team_name,
    leaderName: team.leader_name,
    role: 'TEAM',
  });

  return { success: true, team, token };
}

// ==================== ADMIN AUTHENTICATION ====================

export interface AdminSessionPayload {
  adminId: string;
  username: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export async function createAdminSessionToken(payload: AdminSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(JWT_SECRET);
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.role || (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN')) return null;
    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAdminSessionToken(token);
}

export async function authenticateAdmin(
  usernameInput: string,
  passwordInput: string,
  ipAddress = 'unknown'
): Promise<{ success: boolean; error?: string; token?: string; role?: 'ADMIN' | 'SUPER_ADMIN' }> {
  const username = usernameInput.trim();
  const password = passwordInput.trim();

  const envAdminUser = process.env.ADMIN_USERNAME || 'admin';
  const envAdminPass = process.env.ADMIN_PASSWORD || 'Admin@KernelPrime2026';
  const envSuperPin = process.env.SUPER_ADMIN_PIN || '2026KP';

  const rateLimitKey = `admin-login:${ipAddress}:${username}`;
  if (!checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000)) {
    logAudit({
      actorType: 'ADMIN',
      actorId: username,
      action: 'ADMIN_LOGIN_RATE_LIMITED',
      ipAddress,
    });
    return { success: false, error: 'Too many failed admin login attempts. Try again in 10 minutes.' };
  }

  if (username !== envAdminUser || password !== envAdminPass) {
    logAudit({
      actorType: 'ADMIN',
      actorId: username,
      action: 'ADMIN_LOGIN_FAILED',
      ipAddress,
    });
    return { success: false, error: 'Invalid admin credentials.' };
  }

  resetRateLimit(rateLimitKey);

  const role = 'SUPER_ADMIN';

  logAudit({
    actorType: 'ADMIN',
    actorId: username,
    action: 'ADMIN_LOGIN',
    metadata: { role },
    ipAddress,
  });

  const token = await createAdminSessionToken({
    adminId: 'ADMIN-ROOT',
    username,
    role,
  });

  return { success: true, token, role };
}
