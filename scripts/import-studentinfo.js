const XLSX = require('xlsx');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const xlsxPath = path.join(__dirname, '..', 'public', 'Studentinfo', 'password.xlsx');
const dbPath = path.join(__dirname, '..', 'data', 'kernel_prime.db');

if (!fs.existsSync(xlsxPath)) {
  console.error('File not found:', xlsxPath);
  process.exit(1);
}

const workbook = XLSX.readFile(xlsxPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

console.log(`Found ${rawRows.length} rows in password.xlsx`);

const parsedTeams = rawRows.map((row, index) => {
  const teamNameRaw = (row['Team Name'] || row['TeamName'] || row['team_name'] || '').toString().trim();
  const leaderNameRaw = (row['Teamlead name'] || row['TeamLeader'] || row['leader_name'] || row['Leader'] || '').toString().trim();
  const mobileRaw = (row['mobile no.'] || row['Mobile'] || row['MobileNumber'] || row['mobile'] || '').toString().trim();
  
  // Clean mobile: strip spaces, non-digits
  const cleanMobile = mobileRaw.replace(/\D/g, '');
  const id = `TEAM-${String(index + 1).padStart(3, '0')}`;
  
  return {
    id,
    name: teamNameRaw.toUpperCase(),
    originalName: teamNameRaw,
    leader: leaderNameRaw,
    mobile: cleanMobile,
    rawMobile: mobileRaw,
    college: "S.A. Engineering College", // Default college
    email: `${teamNameRaw.toLowerCase().replace(/[^a-z0-9]/g, '')}@hackathon.saec.ac.in`,
    count: 4
  };
});

console.log('Parsed Teams:');
console.table(parsedTeams.map(t => ({ ID: t.id, Team: t.name, Leader: t.leader, Mobile: t.mobile })));

// 1. Update live SQLite Database
const db = new Database(dbPath);
const saltRounds = 10;

// Check existing allocations
const existingAllocations = db.prepare('SELECT COUNT(*) as count FROM allocations').get().count;
console.log(`Existing allocations in DB: ${existingAllocations}`);

// Clear existing teams and re-insert fresh 20 teams
const clearAllocations = db.prepare('DELETE FROM allocations');
const clearDownloads = db.prepare('DELETE FROM downloads');
const clearLogins = db.prepare('DELETE FROM login_events');
const clearTeams = db.prepare('DELETE FROM teams');
const resetPsCount = db.prepare('UPDATE problem_statements SET allocated_count = 0');

const insertTeam = db.prepare(`
  INSERT INTO teams (
    id, team_name, college_name, leader_name, leader_mobile, leader_email,
    members_count, track, registration_status, payment_status, credential_hash, has_allocated
  ) VALUES (
    @id, @team_name, @college_name, @leader_name, @leader_mobile, @leader_email,
    @members_count, 'Software Track', 'CONFIRMED', 'PAID', @credential_hash, 0
  )
`);

db.transaction(() => {
  clearAllocations.run();
  clearDownloads.run();
  clearLogins.run();
  clearTeams.run();
  resetPsCount.run();

  for (const t of parsedTeams) {
    const hash = bcrypt.hashSync(t.mobile, saltRounds);
    insertTeam.run({
      id: t.id,
      team_name: t.name,
      college_name: t.college,
      leader_name: t.leader,
      leader_mobile: t.mobile,
      leader_email: t.email,
      members_count: t.count,
      credential_hash: hash
    });
  }
})();

console.log('✅ Successfully updated SQLite database with 20 official teams from Studentinfo/password.xlsx');

// Verify DB
const totalInDb = db.prepare('SELECT COUNT(*) as count FROM teams').get().count;
console.log(`Verified DB Teams count: ${totalInDb}`);

