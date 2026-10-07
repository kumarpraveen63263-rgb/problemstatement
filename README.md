# KERNEL PRIME'26 - SOFTWARE PROBLEM STATEMENT ALLOCATION PORTAL

**Official Allocation Platform for the National Level 24-Hour Hackathon**  
*Organized by S.A. Engineering College (Autonomous)*  
*Departments of Electronics & Communication Engineering & Electronics Engineering (VLSI Design & Technology)*  
*Event Date: October 8, 2026*

---

## ⚡ Architectural Overview

The **KERNEL PRIME'26 Allocation Portal** is an enterprise-grade, concurrency-hardened web application designed specifically for high-stakes, live-event allocation of Problem Statements to 20 Software Track teams.

### 🛡️ Critical Architecture Rules Enforced

1. **Server-Side Atomic Allocation Engine**:
   - The digital spin wheel is **strictly a visual presentation layer**. The browser JavaScript never decides the winning statement.
   - The backend runs an atomic database transaction using SQLite WAL mode (`BEGIN IMMEDIATE`) with database-level uniqueness constraints (`UNIQUE(team_id)`).
   - Prevents race conditions when multiple teams click the spin button simultaneously.
   - Statements with zero remaining capacity are dynamically excluded from the server allocation pool.
2. **Strict Single-Spin Enforcement**:
   - Each registered team can spin **only once**.
   - Idempotency protection ensures page refreshes, duplicate clicks, or multi-device attempts never create a duplicate allocation or alter an existing result.
3. **Secure PDF Delivery**:
   - Problem statement PDFs are kept in a protected private storage directory.
   - Served exclusively through an authenticated streaming endpoint (`/api/allocation/download`) ensuring teams can only download their own assigned statement.
   - Download timestamps and counts are permanently tracked.
4. **Zero Plaintext Credential Storage**:
   - Team leader mobile numbers are hashed with `bcrypt` (10 rounds) server-side and never exposed in API payloads or client storage.
   - Rate limiting protects both team and admin login routes against brute-force attacks.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS (Custom Cyber Theme: Deep Black `#050505`, Electric Blue `#00C8FF`, Premium Gold `#F4B400`) |
| **Animation & FX**| Framer Motion & Canvas Confetti |
| **Sound Synthesis**| Web Audio API (zero external assets, client-side synthesized clicks & fanfare chord) |
| **Database** | SQLite with WAL mode (via `better-sqlite3`) + PostgreSQL / Supabase ready (`lib/schema.sql`) |
| **Security & Auth**| HTTP-only signed JWT (`jose`), `bcryptjs`, IP rate-limiting |
| **Reporting** | Google Sheets API synchronization + XLSX / CSV streaming export |

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.x or v20.x or v24.x
- **npm** or **pnpm** or **bun**

### 2. Installation
```bash
# Clone or navigate to the project directory
cd 11111Problemstatement

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default credentials out of the box:
```env
APP_URL=http://localhost:3000
SESSION_SECRET=kernel-prime-2026-super-secure-production-jwt-key-9988
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@KernelPrime2026
SUPER_ADMIN_PIN=2026KP
DATABASE_URL=file:./data/kernel_prime.db
```

### 4. Run System Verification Suite
Before launching, run the automated verification suite to test database integrity, bcrypt hashes, allocation concurrency, and PDF assets:
```bash
node scripts/test-system.js
```
*(Expected output: 29 PASSED, 0 FAILED)*

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Login Credentials

### 👥 Team Leader Login (`/` or `/login`)
Pre-seeded with all 20 Software Track Teams. Example credentials:

| Team Name (Case-Insensitive) | Team Leader | Registered Mobile | College |
|---|---|---|---|
| `TEAM ALPHA` | Aditya Raman | `9876543201` | S.A. Engineering College |
| `TEAM CYBERPULSE` | Karthik Subramanian | `9876543202` | IIT Madras |
| `TEAM NEURALNEXUS` | Pooja Venkatesh | `9876543203` | NIT Trichy |
| `TEAM QUANTUMLEAP` | Rohan Natarajan | `9876543204` | Anna University, CEG |
| `TEAM VOIDRUNNERS` | Sneha Mukherjee | `9876543205` | VIT Vellore |
| *(Teams 6 through 20)* | *(See admin panel)* | `9876543206` - `9876543220` | Various Institutions |

### 🛡️ Admin Command Center Login (`/admin`)
- **Username**: `admin`
- **Password**: `Admin@KernelPrime2026`

---

## 🎯 Default Problem Statement Capacities

| PS Code | Problem Statement Title | Default Capacity |
|---|---|---|
| **PS-01** | Decentralized Supply Chain Provenance & Traceability Engine | **3 Teams** |
| **PS-02** | AI Multi-Modal Clinical Diagnostics & Triage Accelerator | **3 Teams** |
| **PS-03** | Adaptive Urban Traffic & Autonomous Emergency Corridor Routing | **2 Teams** |
| **PS-04** | Smart Grid Renewable Energy Forecasting & Microgrid Balancing | **2 Teams** |
| **PS-05** | Zero-Trust Cyber Threat Hunting & Autonomous Incident Response Copilot | **2 Teams** |
| **PS-06** | Satellite & IoT Precision Agriculture Hydro-Optimization System | **2 Teams** |
| **PS-07** | Autonomous Multi-Agent Drone Swarm Protocol for Disaster Response | **2 Teams** |
| **PS-08** | Privacy-Preserving Zero-Knowledge Digital Identity Vault | **2 Teams** |
| **PS-09** | Sub-Millisecond High-Frequency Fraud Detection & AML Anomaly Engine | **2 Teams** |
| **TOTAL** | **9 Problem Statements** | **20 Teams** |

Capacities can be updated live from the **Admin Dashboard -> Configure Capacities** button.

---

## 📊 Google Sheets Real-time Synchronization

1. Create a service account in the Google Cloud Console.
2. Enable the **Google Sheets API**.
3. Create a Google Spreadsheet and share it with the service account email (with *Editor* role).
4. Add the following to `.env.local`:
   ```env
   GOOGLE_SHEETS_ID=your_spreadsheet_id_here
   GOOGLE_SERVICE_ACCOUNT_EMAIL=kernel-sync@your-project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
5. If Google Sheets API credentials are not provided, the application safely stands by and logs transactions to SQLite/Postgres without interrupting the participant experience.

---

## 📁 Central Configuration Files

To easily update branding or paths:
- **`lib/event-config.ts`**: Event name, dates, college name, departments, accreditation, branding color definitions.
- **`lib/assets-config.ts`**: Centralized image, logo, and PDF paths.
- **`public/assets/branding/`**: Contains high-resolution vector SVGs for Kernel Prime logo, S.A. College logo, circuit patterns, and PCB traces.
- **`private/problem-statements/`**: Contains the 9 official PDF files served securely to allocated teams.

---

## 🌐 Production & Vercel Deployment

### Deploying to Vercel
1. Push this repository to GitHub or GitLab.
2. Import the project into Vercel.
3. Configure environment variables in the Vercel project dashboard:
   - `SESSION_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SUPER_ADMIN_PIN`
4. If using Supabase / PostgreSQL:
   - Run `lib/schema.sql` on your Supabase SQL editor.
   - Set `DATABASE_URL` in your Vercel environment variables.
5. Deploy!
