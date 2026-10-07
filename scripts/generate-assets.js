const fs = require('fs');
const path = require('path');

const brandingDir = path.join(__dirname, '..', 'public', 'assets', 'branding');
if (!fs.existsSync(brandingDir)) {
  fs.mkdirSync(brandingDir, { recursive: true });
}

// 1. KERNEL PRIME OFFICIAL LOGO SVG
const kernelPrimeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 120" width="100%" height="100%">
  <defs>
    <linearGradient id="blueGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00C8FF" />
      <stop offset="50%" stop-color="#00E5FF" />
      <stop offset="100%" stop-color="#F4B400" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F4B400" />
      <stop offset="100%" stop-color="#FFD700" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Core Hex Shield Emblem -->
  <g transform="translate(15, 10)">
    <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" fill="none" stroke="url(#blueGoldGrad)" stroke-width="3.5" filter="url(#glow)"/>
    <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" fill="#0D1117" stroke="#00C8FF" stroke-width="1.5" opacity="0.8"/>
    <!-- CPU Die Core Icon -->
    <rect x="36" y="36" width="28" height="28" rx="4" fill="#00C8FF" fill-opacity="0.2" stroke="#00C8FF" stroke-width="2"/>
    <circle cx="50" cy="50" r="5" fill="#F4B400"/>
    <!-- Circuit connector pins -->
    <line x1="50" y1="20" x2="50" y2="36" stroke="#00C8FF" stroke-width="2"/>
    <line x1="50" y1="64" x2="50" y2="80" stroke="#00C8FF" stroke-width="2"/>
    <line x1="24" y1="50" x2="36" y2="50" stroke="#00C8FF" stroke-width="2"/>
    <line x1="64" y1="50" x2="76" y2="50" stroke="#00C8FF" stroke-width="2"/>
    <circle cx="50" cy="20" r="2.5" fill="#F4B400"/>
    <circle cx="50" cy="80" r="2.5" fill="#00C8FF"/>
    <circle cx="24" cy="50" r="2.5" fill="#00C8FF"/>
    <circle cx="76" cy="50" r="2.5" fill="#F4B400"/>
  </g>

  <!-- Typography -->
  <text x="130" y="65" font-family="'Inter', -apple-system, sans-serif" font-weight="900" font-size="44" letter-spacing="4" fill="#FFFFFF">
    KERNEL
  </text>
  <text x="325" y="65" font-family="'Inter', -apple-system, sans-serif" font-weight="900" font-size="44" letter-spacing="4" fill="url(#goldGrad)" filter="url(#glow)">
    PRIME
  </text>
  <text x="462" y="44" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="20" fill="#00C8FF">
    '26
  </text>

  <!-- Subtitle Tagline -->
  <text x="132" y="94" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" letter-spacing="6" fill="#00C8FF" opacity="0.9">
    SOFTWARE TRACK • 24H HACKATHON
  </text>
</svg>`;

// 2. S.A. ENGINEERING COLLEGE LOGO SVG
const saCollegeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 100" width="100%" height="100%">
  <defs>
    <linearGradient id="crestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00C8FF"/>
      <stop offset="100%" stop-color="#F4B400"/>
    </linearGradient>
  </defs>

  <!-- College Crest Emblem -->
  <g transform="translate(10, 10)">
    <circle cx="40" cy="40" r="38" fill="#0D1117" stroke="url(#crestGrad)" stroke-width="2.5"/>
    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <!-- Academic Lamp / Gear Symbol -->
    <path d="M 28 45 L 52 45 L 48 55 L 32 55 Z" fill="#F4B400"/>
    <path d="M 40 22 C 34 28, 46 32, 40 42 C 38 34, 42 26, 40 22 Z" fill="#00C8FF"/>
    <circle cx="40" cy="22" r="3" fill="#FFFFFF"/>
    <!-- Laurel Wreath -->
    <path d="M 18 42 C 16 54, 25 64, 40 68 C 55 64, 64 54, 62 42" fill="none" stroke="#F4B400" stroke-width="1.8" stroke-dasharray="2,3"/>
  </g>

  <!-- Text Hierarchy -->
  <text x="100" y="38" font-family="'Inter', sans-serif" font-weight="900" font-size="22" letter-spacing="2.5" fill="#FFFFFF">
    S.A. ENGINEERING COLLEGE
  </text>
  <text x="102" y="58" font-family="'Inter', sans-serif" font-weight="600" font-size="11" letter-spacing="1.2" fill="#00C8FF">
    AUTONOMOUS INSTITUTION • AFFILIATED TO ANNA UNIVERSITY
  </text>
  <text x="102" y="74" font-family="'Inter', sans-serif" font-weight="500" font-size="10" letter-spacing="0.8" fill="#AEB6C2">
    Accredited by NBA &amp; NAAC 'A' Grade • ISO 9001:2015 Certified
  </text>
</svg>`;

// 3. ACCREDITATIONS BADGE
const accreditationsSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 40" width="100%" height="100%">
  <g fill="#AEB6C2" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600" letter-spacing="1">
    <rect x="0" y="5" width="80" height="28" rx="4" fill="#0D1117" stroke="rgba(255,255,255,0.1)"/>
    <text x="15" y="23" fill="#00C8FF">NAAC 'A'</text>

    <rect x="90" y="5" width="70" height="28" rx="4" fill="#0D1117" stroke="rgba(255,255,255,0.1)"/>
    <text x="105" y="23" fill="#F4B400">NBA</text>

    <rect x="170" y="5" width="85" height="28" rx="4" fill="#0D1117" stroke="rgba(255,255,255,0.1)"/>
    <text x="180" y="23" fill="#FFFFFF">ANNA UNIV</text>

    <rect x="265" y="5" width="105" height="28" rx="4" fill="#0D1117" stroke="rgba(255,255,255,0.1)"/>
    <text x="275" y="23" fill="#00C8FF">ECE &amp; VLSI</text>
  </g>
</svg>`;

// 4. CIRCUIT PATTERN SVG
const circuitSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%" opacity="0.12">
  <defs>
    <pattern id="circuitGrid" width="160" height="160" patternUnits="userSpaceOnUse">
      <path d="M 0 40 L 40 40 L 60 20 L 100 20 L 120 40 L 160 40" fill="none" stroke="#00C8FF" stroke-width="1.2"/>
      <path d="M 40 160 L 40 120 L 60 100 L 60 60 L 80 40 L 120 40" fill="none" stroke="#F4B400" stroke-width="1"/>
      <path d="M 80 160 L 100 140 L 140 140 L 160 160" fill="none" stroke="#00C8FF" stroke-width="1"/>
      <circle cx="40" cy="40" r="3" fill="#00C8FF"/>
      <circle cx="100" cy="20" r="3" fill="#F4B400"/>
      <circle cx="60" cy="60" r="2.5" fill="#00C8FF"/>
      <circle cx="140" cy="140" r="3" fill="#F4B400"/>
      <rect x="95" y="95" width="14" height="14" fill="none" stroke="#00C8FF" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#circuitGrid)" />
</svg>`;

// 5. PCB TRACES SVG
const pcbTracesSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="100%" height="100%" opacity="0.18">
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 0 100 L 250 100 L 320 170 L 580 170 L 620 210 L 900 210 L 980 130 L 1200 130" stroke="#00C8FF" stroke-width="2"/>
    <path d="M 0 350 L 180 350 L 240 290 L 450 290 L 510 350 L 750 350 L 810 410 L 1200 410" stroke="#F4B400" stroke-width="2"/>
    <path d="M 150 0 L 150 200 L 220 270 L 220 500" stroke="#00C8FF" stroke-width="1.5" stroke-dasharray="6,4"/>
    <path d="M 1050 600 L 1050 380 L 980 310 L 980 50" stroke="#F4B400" stroke-width="1.5" stroke-dasharray="6,4"/>
    
    <circle cx="320" cy="170" r="4.5" fill="#00C8FF"/>
    <circle cx="620" cy="210" r="4.5" fill="#F4B400"/>
    <circle cx="980" cy="130" r="4.5" fill="#00C8FF"/>
    <circle cx="240" cy="290" r="4.5" fill="#F4B400"/>
    <circle cx="510" cy="350" r="4.5" fill="#00C8FF"/>
    <circle cx="810" cy="410" r="4.5" fill="#F4B400"/>
  </g>
</svg>`;

// 6. EVENT BACKGROUND SVG
const eventBgSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <radialGradient id="radialGlowBlue" cx="15%" cy="20%" r="55%">
      <stop offset="0%" stop-color="#00C8FF" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#050505" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="radialGlowGold" cx="85%" cy="80%" r="55%">
      <stop offset="0%" stop-color="#F4B400" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#050505" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(0, 200, 255, 0.04)"/>
      <stop offset="100%" stop-color="rgba(244, 180, 0, 0.02)"/>
    </linearGradient>
  </defs>

  <rect width="1920" height="1080" fill="#050505"/>
  <rect width="1920" height="1080" fill="url(#radialGlowBlue)"/>
  <rect width="1920" height="1080" fill="url(#radialGlowGold)"/>
</svg>`;

fs.writeFileSync(path.join(brandingDir, 'kernel-prime-logo.svg'), kernelPrimeSvg);
fs.writeFileSync(path.join(brandingDir, 'sa-college-logo.svg'), saCollegeSvg);
fs.writeFileSync(path.join(brandingDir, 'accreditations.svg'), accreditationsSvg);
fs.writeFileSync(path.join(brandingDir, 'circuit-pattern.svg'), circuitSvg);
fs.writeFileSync(path.join(brandingDir, 'pcb-traces.svg'), pcbTracesSvg);
fs.writeFileSync(path.join(brandingDir, 'event-background.svg'), eventBgSvg);

console.log('All branding SVG assets written successfully.');
