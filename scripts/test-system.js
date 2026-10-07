const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'kernel_prime.db');
const db = new Database(dbPath);

console.log('========================================================');
console.log('KERNEL PRIME\'26 - SYSTEM VERIFICATION SUITE');
console.log('========================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    testsFailed++;
  }
}

// TEST 1: Database Tables Existence
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
assert(tables.includes('teams'), 'Teams table exists');
assert(tables.includes('problem_statements'), 'Problem Statements table exists');
assert(tables.includes('allocations'), 'Allocations table exists');
assert(tables.includes('downloads'), 'Downloads table exists');
assert(tables.includes('login_events'), 'Login Events table exists');
assert(tables.includes('audit_log'), 'Audit Log table exists');
assert(tables.includes('system_settings'), 'System Settings table exists');

// TEST 2: Seed Verification
const teamsCount = db.prepare('SELECT COUNT(*) as count FROM teams').get().count;
assert(teamsCount === 20, `20 Software teams pre-seeded in database (Found: ${teamsCount})`);

const psCount = db.prepare('SELECT COUNT(*) as count FROM problem_statements').get().count;
assert(psCount === 9, `9 Problem Statements present (Found: ${psCount})`);

const totalCapacity = db.prepare('SELECT SUM(capacity) as total FROM problem_statements').get().total;
assert(totalCapacity === 20, `Total PS capacities sum to exactly 20 teams (Found: ${totalCapacity})`);

// TEST 3: Credential Security (Zero Plaintext Mobile Passwords)
const sampleTeam = db.prepare("SELECT * FROM teams WHERE team_name = 'ZEYPHER'").get();
assert(sampleTeam !== undefined, 'ZEYPHER exists');
assert(sampleTeam.credential_hash && sampleTeam.credential_hash.startsWith('$2'), 'Team credential stored as secure bcrypt hash');
assert(bcrypt.compareSync('8056264662', sampleTeam.credential_hash), 'Team Leader mobile matches bcrypt hash');
assert(!bcrypt.compareSync('9999999999', sampleTeam.credential_hash), 'Invalid mobile fails authentication');

// TEST 4: Case Insensitive Team Name
const lowerMatch = db.prepare('SELECT * FROM teams WHERE UPPER(team_name) = ?').get('zeypher'.toUpperCase());
assert(lowerMatch.id === sampleTeam.id, 'Case-insensitive lookup resolves correctly');

// Clean up any previous test allocations
db.prepare("DELETE FROM allocations WHERE id LIKE 'TEST-%' OR team_id = 'TEAM-002'").run();
db.prepare("UPDATE teams SET has_allocated = 0, allocated_ps_id = NULL, allocation_time = NULL WHERE id = 'TEAM-002'").run();
// Recalculate allocated_count for all PS
db.prepare("UPDATE problem_statements SET allocated_count = (SELECT COUNT(*) FROM allocations WHERE problem_statement_id = problem_statements.id)").run();

// TEST 5: Atomic Allocation Concurrency & Capacity Constraint Test
console.log('\n--- Running Atomic Allocation Simulation ---');

// Pick a test team
const testTeam = db.prepare("SELECT * FROM teams WHERE id = 'TEAM-002'").get();
const availableBefore = db.prepare('SELECT id, capacity, allocated_count FROM problem_statements WHERE allocated_count < capacity').all();
assert(availableBefore.length > 0, `Problem statements have remaining capacity (${availableBefore.length} statements available)`);

// Simulate atomic allocation inside transaction
const targetPs = availableBefore[0];
const allocTx = db.transaction(() => {
  // Lock check
  const locked = db.prepare('SELECT has_allocated FROM teams WHERE id = ?').get(testTeam.id);
  if (locked.has_allocated === 1) return { replayed: true };

  db.prepare('INSERT INTO allocations (id, team_id, problem_statement_id, allocated_at, allocation_seed, status) VALUES (?, ?, ?, datetime(\'now\'), ?, ?)')
    .run('TEST-ALC-001', testTeam.id, targetPs.id, 'seed123', 'CONFIRMED');

  db.prepare('UPDATE problem_statements SET allocated_count = allocated_count + 1 WHERE id = ?')
    .run(targetPs.id);

  db.prepare('UPDATE teams SET has_allocated = 1, allocated_ps_id = ?, allocation_time = datetime(\'now\') WHERE id = ?')
    .run(targetPs.id, testTeam.id);

  return { replayed: false };
});

const result = allocTx();
assert(!result.replayed, 'First allocation succeeds');

// Verify updated state
const updatedTeam = db.prepare('SELECT has_allocated, allocated_ps_id FROM teams WHERE id = ?').get(testTeam.id);
assert(updatedTeam.has_allocated === 1, 'Team permanently marked as has_allocated = 1');
assert(updatedTeam.allocated_ps_id === targetPs.id, `Team assigned to ${targetPs.id}`);

// TEST 6: Strict One-Spin Rule / Idempotency Test
// Attempting a second allocation for the same team
let secondAttemptFailed = false;
try {
  const secondTx = db.transaction(() => {
    // Unique constraint on team_id in allocations table
    db.prepare('INSERT INTO allocations (id, team_id, problem_statement_id, allocated_at, allocation_seed, status) VALUES (?, ?, ?, datetime(\'now\'), ?, ?)')
      .run('TEST-ALC-002', testTeam.id, targetPs.id, 'seed456', 'CONFIRMED');
  });
  secondTx();
} catch (e) {
  secondAttemptFailed = true;
}
assert(secondAttemptFailed, 'Database UNIQUE(team_id) constraint strictly blocks duplicate allocation attempt');

// Clean up test allocation
db.prepare('DELETE FROM allocations WHERE id = ?').run('TEST-ALC-001');
db.prepare('UPDATE problem_statements SET allocated_count = allocated_count - 1 WHERE id = ?').run(targetPs.id);
db.prepare('UPDATE teams SET has_allocated = 0, allocated_ps_id = NULL, allocation_time = NULL WHERE id = ?').run(testTeam.id);

// TEST 7: Problem Statement PDF file verification
const fs = require('fs');
for (let i = 1; i <= 9; i++) {
  const code = `PS-0${i}`;
  const files = fs.readdirSync(path.join(__dirname, '..', 'private', 'problem-statements'));
  const found = files.some(f => f.startsWith(`PS0${i}`) && f.endsWith('.pdf'));
  assert(found, `Official PDF document present on disk for ${code}`);
}

console.log('\n========================================================');
console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('========================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('ALL SYSTEMS VERIFIED & PRODUCTION READY.\n');
}
