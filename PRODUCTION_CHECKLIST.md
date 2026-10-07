# KERNEL PRIME'26 - PRE-LAUNCH PRODUCTION CHECKLIST

Run through this verification checklist before opening the allocation portal to participants on October 8, 2026.

---

### Phase 1: Team & Credential Verification
- [x] **20 Teams Imported**: Verify 20 registered software teams are present in database via Admin Panel.
- [x] **Credential Hashes**: Confirm all team leader mobile numbers are stored as non-reversible bcrypt hashes (`$2a$...`).
- [x] **Case-Insensitive Verification**: Tested team login with lowercase, mixed case, and uppercase variations.
- [x] **Rate-Limiting Protection**: Confirmed max 5 failed attempts locks login window for 5 minutes.

---

### Phase 2: Problem Statement & Capacity Calibration
- [x] **9 Problem Statements Uploaded**: PS-01 through PS-09 active with titles and technical descriptions.
- [x] **Capacity Quota Math**: PS-01 (3), PS-02 (3), PS-03 to PS-09 (2 each) = **Total exactly 20 teams**.
- [x] **Protected PDF Storage**: PDFs stored in private directory (`private/problem-statements/`) and unaccessible via public URLs.
- [x] **Authenticated Download Streaming**: Verified `/api/allocation/download` enforces session validation and matches allocated statement.

---

### Phase 3: Allocation Engine & Concurrency Integrity
- [x] **Server-Determined Allocation**: Confirmed frontend JavaScript does not pick the statement.
- [x] **Database ACID Lock**: Verified atomic transaction with row locking in `executeAtomicAllocation`.
- [x] **One-Spin Rule**: Database constraint `UNIQUE(team_id)` prevents secondary allocations.
- [x] **Refresh & Re-login Protection**: Verified reloading or logging back in immediately renders the locked Result Card without showing the spin wheel.
- [x] **Exhaustion Guard**: Fully allocated statements (`allocated_count >= capacity`) are dynamically omitted from random selection pool.

---

### Phase 4: Administrative Command Controls
- [x] **Global Status Control**: Tested OPEN, CLOSE, and PAUSE allocation switches.
- [x] **Emergency Kill Switch**: PAUSED state halts all incoming spin requests immediately with user banner.
- [x] **Super Admin Reallocation**: Reallocation requires mandatory reason, confirmation modal, and admin password re-verification.
- [x] **Live Polling Telemetry**: Admin dashboard polls every 4 seconds, reflecting live spins without page refresh.
- [x] **Excel & CSV Export**: Verified full telemetry export with 19 structured data columns.
- [x] **Google Sheets Sync**: Non-blocking async sync queue handles transmission without failing participant requests.
- [x] **Immutable Audit Log**: Login, spin, download, export, and admin status events logged permanently with actor and timestamp.

---

### Phase 5: UI/UX & Responsive Presentation
- [x] **Visual Identity**: Official Deep Black (`#050505`), Electric Blue (`#00C8FF`), and Premium Gold (`#F4B400`) cyber theme.
- [x] **Wheel Physics**: 6.5-second easing deceleration landing accurately on server-selected segment.
- [x] **Sound Synthesis**: Client-side Web Audio API tick clicks and fanfare chord with global mute toggle.
- [x] **Mobile Responsiveness**: Tested layouts across Desktop (1920x1080), Laptop (1366x768), Tablet, and Mobile.
- [x] **Database Backup**: Local database file located at `data/kernel_prime.db` backed up prior to event opening.
