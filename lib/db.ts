import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import fs from 'fs';

// Detect Serverless / Vercel Environment
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  (process.env.NODE_ENV === 'production' && !process.env.LOCAL_DEV)
);

// In Vercel/Lambda, only /tmp is writable
const dataDir = isServerless ? '/tmp' : path.join(process.cwd(), 'data');

try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create data directory:', dataDir, e);
}

const dbPath = path.join(dataDir, 'kernel_prime.db');

// If running in /tmp and file does not exist, copy pre-seeded db from repository
if (isServerless && !fs.existsSync(dbPath)) {
  const sourcePaths = [
    path.join(process.cwd(), 'data', 'kernel_prime.db'),
    path.join(__dirname, '..', 'data', 'kernel_prime.db'),
  ];
  for (const src of sourcePaths) {
    if (fs.existsSync(src)) {
      try {
        fs.copyFileSync(src, dbPath);
        console.log(`Copied initial seed database from ${src} to ${dbPath}`);
        break;
      } catch (e) {
        console.warn('Failed to copy seed database to /tmp:', e);
      }
    }
  }
}

// Singleton database instance
let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    try {
      dbInstance = new Database(dbPath, { timeout: 8000 });
      try {
        dbInstance.pragma('journal_mode = WAL');
        dbInstance.pragma('foreign_keys = ON');
        dbInstance.pragma('synchronous = NORMAL');
      } catch (e) {
        // Fallback for restricted filesystems
        try {
          dbInstance.pragma('journal_mode = DELETE');
        } catch (_) {}
      }
      initDatabase(dbInstance);
    } catch (err: any) {
      console.error('Fatal Database connection error:', err);
      // If disk opening failed, fallback to memory
      if (!dbInstance) {
        console.warn('Falling back to in-memory database instance');
        dbInstance = new Database(':memory:');
        initDatabase(dbInstance);
      }
    }
  }
  return dbInstance;
}

function initDatabase(db: Database.Database) {
  try {
    // 1. Teams Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        team_name TEXT NOT NULL UNIQUE,
        college_name TEXT NOT NULL,
        leader_name TEXT NOT NULL,
        leader_mobile TEXT NOT NULL,
        leader_email TEXT NOT NULL,
        members_count INTEGER NOT NULL DEFAULT 4,
        track TEXT NOT NULL DEFAULT 'Software Track',
        registration_status TEXT NOT NULL DEFAULT 'CONFIRMED',
        payment_status TEXT NOT NULL DEFAULT 'PAID',
        credential_hash TEXT NOT NULL,
        has_allocated INTEGER NOT NULL DEFAULT 0,
        allocated_ps_id TEXT NULL,
        allocation_time TEXT NULL,
        active_session_token TEXT NULL,
        last_login_at TEXT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 2. Problem Statements Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS problem_statements (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 2,
        allocated_count INTEGER NOT NULL DEFAULT 0,
        pdf_path TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 3. Allocations Table (Strict UNIQUE team_id constraint enforces ONE spin per team)
    db.exec(`
      CREATE TABLE IF NOT EXISTS allocations (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
        problem_statement_id TEXT NOT NULL REFERENCES problem_statements(id),
        allocated_at TEXT NOT NULL DEFAULT (datetime('now')),
        allocation_seed TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'CONFIRMED'
      );
    `);

    // 4. Downloads Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS downloads (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        problem_statement_id TEXT NOT NULL REFERENCES problem_statements(id),
        downloaded_at TEXT NOT NULL DEFAULT (datetime('now')),
        ip_address TEXT NULL
      );
    `);

    // 5. Login Events Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS login_events (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        login_time TEXT NOT NULL DEFAULT (datetime('now')),
        logout_time TEXT NULL,
        ip_address TEXT NULL,
        user_agent TEXT NULL,
        status TEXT NOT NULL DEFAULT 'SUCCESS'
      );
    `);

    // 6. Audit Log Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        actor_type TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        action TEXT NOT NULL,
        metadata TEXT NULL,
        ip_address TEXT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 7. System Settings Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(team_name);
      CREATE INDEX IF NOT EXISTS idx_teams_allocated ON teams(has_allocated);
      CREATE INDEX IF NOT EXISTS idx_allocations_team ON allocations(team_id);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
    `);

    // Initialize Default System Settings
    const checkSetting = db.prepare('SELECT value FROM system_settings WHERE key = ?');
    if (!checkSetting.get('allocation_status')) {
      db.prepare("INSERT INTO system_settings (key, value) VALUES ('allocation_status', 'OPEN')").run();
    }
    if (!checkSetting.get('test_mode')) {
      db.prepare("INSERT INTO system_settings (key, value) VALUES ('test_mode', 'false')").run();
    }
    if (!checkSetting.get('emergency_message')) {
      db.prepare("INSERT INTO system_settings (key, value) VALUES ('emergency_message', '')").run();
    }
    if (!checkSetting.get('ribbon_enabled')) {
      db.prepare("INSERT INTO system_settings (key, value) VALUES ('ribbon_enabled', 'true')").run();
    }

    // Seed default Problem Statements if empty
    const countPS = (db.prepare('SELECT COUNT(*) as count FROM problem_statements').get() as { count: number }).count;
    if (countPS === 0) {
      seedProblemStatements(db);
    }

    // Seed default 20 Teams if empty
    const countTeams = (db.prepare('SELECT COUNT(*) as count FROM teams').get() as { count: number }).count;
    if (countTeams === 0) {
      seedTeams(db);
    }
  } catch (initErr) {
    console.error('Database schema initialization error:', initErr);
  }
}

export function seedProblemStatements(db: Database.Database) {
  const statements = [
    {
      id: 'PS-01',
      code: 'PS-01',
      title: 'Decentralized Supply Chain Provenance & Traceability Engine',
      description: 'Architect a verifiable cryptographic ledger system to eliminate counterfeits, trace raw material custody across multi-tier supplier networks, and produce real-time ESG compliance proofs.',
      capacity: 3,
      pdf_path: '/problem-statements/PS1.pdf'
    },
    {
      id: 'PS-02',
      code: 'PS-02',
      title: 'AI Multi-Modal Clinical Diagnostics & Triage Accelerator',
      description: 'Develop an edge-capable AI inference suite that integrates clinical imaging (CT/X-ray), lab biomarkers, and EHR telemetry for instantaneous high-acuity triage and automated differential diagnosis.',
      capacity: 3,
      pdf_path: '/problem-statements/PS2.pdf'
    },
    {
      id: 'PS-03',
      code: 'PS-03',
      title: 'Adaptive Urban Traffic & Autonomous Emergency Corridor Routing',
      description: 'Design a dynamic city-scale routing protocol leveraging real-time vision sensor streams to clear green wave corridors for first responders while minimizing overall grid congestion.',
      capacity: 2,
      pdf_path: '/problem-statements/PS3.pdf'
    },
    {
      id: 'PS-04',
      code: 'PS-04',
      title: 'Smart Grid Renewable Energy Forecasting & Microgrid Balancing',
      description: 'Construct a predictive machine learning platform for sub-second solar/wind generation forecasting, dynamic battery storage dispatch, and virtual power plant dispatch under sudden load surges.',
      capacity: 2,
      pdf_path: '/problem-statements/PS4.pdf'
    },
    {
      id: 'PS-05',
      code: 'PS-05',
      title: 'Zero-Trust Cyber Threat Hunting & Autonomous Incident Response Copilot',
      description: 'Build an autonomous SOC security analyst engine using specialized LLMs and graph neural networks to reconstruct attack kill chains and deploy automated containment playbooks.',
      capacity: 2,
      pdf_path: '/problem-statements/PS5.pdf'
    },
    {
      id: 'PS-06',
      code: 'PS-06',
      title: 'Satellite & IoT Precision Agriculture Hydro-Optimization System',
      description: 'Engineer an intelligent multi-spectral satellite imagery and soil telemetry pipeline that optimizes variable-rate irrigation scheduling and detects crop stress patterns 10 days before visible emergence.',
      capacity: 2,
      pdf_path: '/problem-statements/PS6.pdf'
    },
    {
      id: 'PS-07',
      code: 'PS-07',
      title: 'Autonomous Multi-Agent Drone Swarm Protocol for Disaster Response',
      description: 'Formulate a decentralized peer-to-peer swarm mesh communication and navigation protocol enabling autonomous search-and-rescue mapping in GPS-denied catastrophe zones.',
      capacity: 2,
      pdf_path: '/problem-statements/PS7.pdf'
    },
    {
      id: 'PS-08',
      code: 'PS-08',
      title: 'Privacy-Preserving Zero-Knowledge Digital Identity Vault',
      description: 'Implement a selective disclosure decentralized identity framework utilizing zk-SNARKs to allow citizens to prove age, citizenship, and academic credentials without revealing underlying personal data.',
      capacity: 2,
      pdf_path: '/problem-statements/PS8.pdf'
    },
    {
      id: 'PS-09',
      code: 'PS-09',
      title: 'Sub-Millisecond High-Frequency Fraud Detection & AML Anomaly Engine',
      description: 'Deliver an ultra-low latency streaming transaction intelligence pipeline capable of scoring complex synthetic identity and layering fraud patterns within 15 milliseconds at 50,000 TPS.',
      capacity: 2,
      pdf_path: '/problem-statements/PS9.pdf'
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO problem_statements (id, code, title, description, capacity, allocated_count, pdf_path, is_active)
    VALUES (@id, @code, @title, @description, @capacity, 0, @pdf_path, 1)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) stmt.run(item);
  });

  insertMany(statements);
}

export function seedTeams(db: Database.Database) {
  const initialTeams = [
    { name: "ZEYPHER", college: "SRM Institute of Science and Technology Ramapuram", leader: "S.Sowravkanth", mobile: "8056264662", email: "zeypher@saec.ac.in", count: 4 },
    { name: "AGRILINK", college: "SHREE VENKATESHWARA HI-TECH ENGINEERING COLLEGE", leader: "J BALAJI", mobile: "9629001885", email: "agrilink@saec.ac.in", count: 4 },
    { name: "QUANTUM CODERS", college: "Dr.MGR university", leader: "Mugesh B", mobile: "6383210562", email: "quantumcoders@saec.ac.in", count: 4 },
    { name: "DH-SQUAD", college: "R.M.D ENGINEERING COLLEGE", leader: "DHARSHIGA SHREE P", mobile: "9962289507", email: "dhsquad@saec.ac.in", count: 4 },
    { name: "DUO GIRLS", college: "Easwari engineering college", leader: "Reshma J S", mobile: "948842345", email: "duogirls@saec.ac.in", count: 2 },
    { name: "MAATRAM", college: "Panimalar engineering college chennai", leader: "Eniya VK", mobile: "9025220712", email: "maatram@saec.ac.in", count: 4 },
    { name: "GAMMA TRIAD", college: "VIT Chennai", leader: "Ramanath Sankaranarayanan", mobile: "9488476952", email: "gammatriad@saec.ac.in", count: 3 },
    { name: "HACKNOVA", college: "Saveetha Engineering College", leader: "Nandhitha S", mobile: "9361263243", email: "hacknova@saec.ac.in", count: 4 },
    { name: "DEBUGGERS", college: "RMK ENGINEERING COLLEGE", leader: "JAIKRISHNA V", mobile: "7448462496", email: "debuggers@saec.ac.in", count: 4 },
    { name: "KOHINOOR", college: "Easwari Engineering College", leader: "Pritha Kundu", mobile: "9080278357", email: "kohinoor@saec.ac.in", count: 4 },
    { name: "NEXTGENMINDS", college: "VEL TECH HIGH TECH DR RANGARAJAN DR SAKUNTHALA ENGINEERING COLLEGE", leader: "YOKESHWARAN M", mobile: "8438916244", email: "nextgenminds@saec.ac.in", count: 4 },
    { name: "NIRECTA", college: "Saveetha Engineering College", leader: "Viyuka S S", mobile: "7305533964", email: "nirecta@saec.ac.in", count: 4 },
    { name: "PROOFFORGE", college: "R.M.K ENGINEERING COLLEGE", leader: "SOLARAJU LOKESH RAJU", mobile: "7207470289", email: "proofforge@saec.ac.in", count: 4 },
    { name: "QUARTET", college: "Rajalakshmi Engineering College", leader: "N Harish Vidyarth", mobile: "6382551983", email: "quartet@saec.ac.in", count: 4 },
    { name: "QUDRAFORCE", college: "RMK Group of Institutions", leader: "Rakshana R", mobile: "9444111954", email: "qudraforce@saec.ac.in", count: 4 },
    { name: "TEAM CONTRA", college: "PANIMALAR ENGINEERING COLLEGE", leader: "BALAJIVASAN S", mobile: "9176486966", email: "teamcontra@saec.ac.in", count: 4 },
    { name: "TERRASENTINAL", college: "Rmk engineering college", leader: "Selvi", mobile: "9677323629", email: "terrasentinal@saec.ac.in", count: 4 },
    { name: "ZENORA", college: "R.M.K Engineering College", leader: "Nivethitha P", mobile: "7871855196", email: "zenora@saec.ac.in", count: 4 },
    { name: "CONQUERORS", college: "Karpagam institute of technology", leader: "DIVAKAR R", mobile: "7904477539", email: "conquerors@saec.ac.in", count: 4 },
    { name: "TEAM HUSTLERS", college: "Saveetha engineering college", leader: "Dharani dharan K", mobile: "9042254242", email: "teamhustlers@saec.ac.in", count: 4 }
  ];

  const stmt = db.prepare(`
    INSERT INTO teams (
      id, team_name, college_name, leader_name, leader_mobile, leader_email,
      members_count, track, registration_status, payment_status, credential_hash
    ) VALUES (
      @id, @team_name, @college_name, @leader_name, @leader_mobile, @leader_email,
      @members_count, 'Software Track', 'CONFIRMED', 'PAID', @credential_hash
    )
  `);

  const saltRounds = 10;
  const insertMany = db.transaction((teams) => {
    let index = 1;
    for (const t of teams) {
      const id = `TEAM-${String(index).padStart(3, '0')}`;
      const cleanMobile = t.mobile.replace(/\D/g, '');
      const hash = bcrypt.hashSync(cleanMobile, saltRounds);
      stmt.run({
        id,
        team_name: t.name.trim().toUpperCase(),
        college_name: t.college,
        leader_name: t.leader,
        leader_mobile: t.mobile,
        leader_email: t.email,
        members_count: t.count,
        credential_hash: hash
      });
      index++;
    }
  });

  insertMany(initialTeams);
}
