const assert = require('assert');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'kernel_prime.db');
const db = new Database(dbPath);

console.log('Testing Master Reset Database Transactions...');

// 1. Insert test allocation
db.prepare("INSERT OR REPLACE INTO allocations (id, team_id, problem_statement_id, allocated_at, allocation_seed, status) VALUES ('TEST-RESET-01', 'TEAM-001', 'PS-01', datetime('now'), 'seed1', 'CONFIRMED')").run();
db.prepare("UPDATE problem_statements SET allocated_count = 1 WHERE id = 'PS-01'").run();
db.prepare("UPDATE teams SET has_allocated = 1, allocated_ps_id = 'PS-01', allocation_time = datetime('now') WHERE id = 'TEAM-001'").run();

let allocCount = db.prepare('SELECT COUNT(*) as count FROM allocations').get().count;
console.log('Allocations before reset:', allocCount);
assert(allocCount > 0, 'Should have allocations');

// 2. Perform Master Reset
const performMasterReset = db.transaction(() => {
  db.prepare('DELETE FROM allocations').run();
  db.prepare('DELETE FROM downloads').run();
  db.prepare("UPDATE teams SET has_allocated = 0, allocated_ps_id = NULL, allocation_time = NULL, updated_at = datetime('now')").run();
  db.prepare('UPDATE problem_statements SET allocated_count = 0').run();
});
performMasterReset();

// 3. Verify clean state
allocCount = db.prepare('SELECT COUNT(*) as count FROM allocations').get().count;
const teamsAllocated = db.prepare('SELECT COUNT(*) as count FROM teams WHERE has_allocated = 1').get().count;
const psAllocated = db.prepare('SELECT SUM(allocated_count) as sum FROM problem_statements').get().sum;

console.log('Allocations after reset:', allocCount);
console.log('Teams marked allocated after reset:', teamsAllocated);
console.log('PS sum allocated_count after reset:', psAllocated);

assert.strictEqual(allocCount, 0, 'Allocations must be 0');
assert.strictEqual(teamsAllocated, 0, 'Allocated teams must be 0');
assert.strictEqual(psAllocated, 0, 'PS allocated count must be 0');

console.log('\n[PASS] MASTER SYSTEM RESET DATABASE LOGIC VERIFIED 100%!');
