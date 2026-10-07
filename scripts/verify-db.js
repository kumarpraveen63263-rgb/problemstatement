const { getDb } = require('../lib/db');

console.log('--- Initializing KERNEL PRIME 26 Database ---');
const db = getDb();
console.log('Database successfully initialized and verified at ./data/kernel_prime.db');
const teamsCount = db.prepare('SELECT COUNT(*) as count FROM teams').get().count;
const psCount = db.prepare('SELECT COUNT(*) as count FROM problem_statements').get().count;
console.log(`Registered Teams: ${teamsCount} (Target: 20)`);
console.log(`Problem Statements: ${psCount} (Target: 9)`);
