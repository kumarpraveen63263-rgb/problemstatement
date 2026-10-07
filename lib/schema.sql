-- ========================================================
-- KERNEL PRIME'26 - POSTGRESQL / SUPABASE SCHEMA
-- National Level 24-Hour Hackathon Allocation Database
-- ========================================================

-- Enable UUID extension if on Supabase/PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TEAMS TABLE
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(64) PRIMARY KEY,
    team_name VARCHAR(120) NOT NULL UNIQUE,
    college_name VARCHAR(255) NOT NULL,
    leader_name VARCHAR(120) NOT NULL,
    leader_mobile VARCHAR(30) NOT NULL,
    leader_email VARCHAR(160) NOT NULL,
    members_count INTEGER NOT NULL DEFAULT 4,
    track VARCHAR(60) NOT NULL DEFAULT 'Software Track',
    registration_status VARCHAR(40) NOT NULL DEFAULT 'CONFIRMED',
    payment_status VARCHAR(40) NOT NULL DEFAULT 'PAID',
    credential_hash VARCHAR(255) NOT NULL,
    has_allocated INTEGER NOT NULL DEFAULT 0,
    allocated_ps_id VARCHAR(32) NULL,
    allocation_time TIMESTAMPTZ NULL,
    active_session_token VARCHAR(255) NULL,
    last_login_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. PROBLEM STATEMENTS TABLE
CREATE TABLE IF NOT EXISTS problem_statements (
    id VARCHAR(32) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 2,
    allocated_count INTEGER NOT NULL DEFAULT 0,
    pdf_path VARCHAR(255) NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. ALLOCATIONS TABLE
-- Notice: UNIQUE(team_id) strictly prevents multiple allocations per team at database level!
CREATE TABLE IF NOT EXISTS allocations (
    id VARCHAR(64) PRIMARY KEY,
    team_id VARCHAR(64) NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
    problem_statement_id VARCHAR(32) NOT NULL REFERENCES problem_statements(id),
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    allocation_seed VARCHAR(128) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'CONFIRMED'
);

-- 4. DOWNLOADS TABLE
CREATE TABLE IF NOT EXISTS downloads (
    id VARCHAR(64) PRIMARY KEY,
    team_id VARCHAR(64) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    problem_statement_id VARCHAR(32) NOT NULL REFERENCES problem_statements(id),
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(64) NULL
);

-- 5. LOGIN EVENTS TABLE
CREATE TABLE IF NOT EXISTS login_events (
    id VARCHAR(64) PRIMARY KEY,
    team_id VARCHAR(64) NOT NULL,
    login_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMPTZ NULL,
    ip_address VARCHAR(64) NULL,
    user_agent TEXT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'SUCCESS'
);

-- 6. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(64) PRIMARY KEY,
    actor_type VARCHAR(32) NOT NULL, -- TEAM, ADMIN, SYSTEM
    actor_id VARCHAR(120) NOT NULL,
    action VARCHAR(80) NOT NULL,
    metadata JSONB NULL,
    ip_address VARCHAR(64) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR MAXIMUM CONCURRENCY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(team_name);
CREATE INDEX IF NOT EXISTS idx_teams_allocated ON teams(has_allocated);
CREATE INDEX IF NOT EXISTS idx_ps_code ON problem_statements(code);
CREATE INDEX IF NOT EXISTS idx_allocations_team ON allocations(team_id);
CREATE INDEX IF NOT EXISTS idx_allocations_ps ON allocations(problem_statement_id);
CREATE INDEX IF NOT EXISTS idx_downloads_team ON downloads(team_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
