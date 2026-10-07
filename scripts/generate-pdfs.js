const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'private', 'problem-statements');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const problemStatements = [
  {
    code: 'PS-01',
    fileName: 'PS01_Decentralized_Supply_Chain.pdf',
    title: 'Decentralized Supply Chain Provenance & Traceability Engine',
    domain: 'Web3 / Distributed Systems / Cryptography',
    overview: 'Architect a verifiable cryptographic ledger system to eliminate counterfeits, trace raw material custody across multi-tier supplier networks, and produce real-time ESG compliance proofs.',
    keyReqs: [
      'Multi-party state machine with cryptographic signatures for handover validation.',
      'Decentralized identity (DID) verification for authorized suppliers and logistics carriers.',
      'Immutable audit trail with zero-knowledge proof verification for confidential bill-of-materials.',
      'Real-time automated dispute arbitration and smart contract escrow settlement.',
      'Sub-second query latency for public consumer barcode/QR verification portals.'
    ]
  },
  {
    code: 'PS-02',
    fileName: 'PS02_AI_Healthcare_Diagnostics.pdf',
    title: 'AI Multi-Modal Clinical Diagnostics & Triage Accelerator',
    domain: 'Healthcare AI / Computer Vision / Edge Inference',
    overview: 'Develop an edge-capable AI inference suite that integrates clinical imaging (CT/X-ray), lab biomarkers, and EHR telemetry for instantaneous high-acuity triage and automated differential diagnosis.',
    keyReqs: [
      'Multi-modal neural network fusing DICOM imaging with unstructured text clinical notes.',
      'Local ONNX / TensorRT edge model deployment for offline clinic resilience.',
      'Explainable AI heatmap overlays (Grad-CAM) justifying clinical alerts to physicians.',
      'HIPAA and Indian Digital Personal Data Protection (DPDP) compliant data anonymization.',
      'High-throughput HL7 / FHIR protocol ingestion interface.'
    ]
  },
  {
    code: 'PS-03',
    fileName: 'PS03_Autonomous_Traffic_Optimization.pdf',
    title: 'Adaptive Urban Traffic & Autonomous Emergency Corridor Routing',
    domain: 'Smart Cities / Computer Vision / Graph Optimization',
    overview: 'Design a dynamic city-scale routing protocol leveraging real-time vision sensor streams to clear green wave corridors for first responders while minimizing overall grid congestion.',
    keyReqs: [
      'YOLO/Edge-vision vehicle counting and density estimation across multi-lane junctions.',
      'Dynamic reinforcement-learning phase timing for smart traffic light controllers.',
      'Ultra-reliable ambulance and fire responder priority corridor preemption protocol.',
      'Decentralized V2X (Vehicle-to-Infrastructure) alert broadcast network.',
      'Interactive 3D digital-twin GIS dashboard visualizing live congestion and ETA metrics.'
    ]
  },
  {
    code: 'PS-04',
    fileName: 'PS04_Smart_Grid_Energy_Forecasting.pdf',
    title: 'Smart Grid Renewable Energy Forecasting & Microgrid Balancing',
    domain: 'CleanTech / Time-Series ML / Industrial IoT',
    overview: 'Construct a predictive machine learning platform for sub-second solar/wind generation forecasting, dynamic battery storage dispatch, and virtual power plant dispatch under sudden load surges.',
    keyReqs: [
      'Multi-horizon transformer for ultra-short-term (15-min) and day-ahead renewable power generation.',
      'Mixed-integer linear programming (MILP) battery charge/discharge optimization engine.',
      'Automated peak shaving and frequency regulation command dispatch.',
      'Industrial Modbus / MQTT SCADA telemetry gateway integration.',
      'High-resolution anomaly detection for grid voltage sag, swell, and equipment degradation.'
    ]
  },
  {
    code: 'PS-05',
    fileName: 'PS05_Cyber_Threat_Hunting_LLM.pdf',
    title: 'Zero-Trust Cyber Threat Hunting & Autonomous Incident Response Copilot',
    domain: 'Cybersecurity / LLM Agents / Graph Threat Modeling',
    overview: 'Build an autonomous SOC security analyst engine using specialized LLMs and graph neural networks to reconstruct attack kill chains and deploy automated containment playbooks.',
    keyReqs: [
      'Real-time ingestion and correlation of Zeek, Suricata, Sysmon, and CloudTrail logs.',
      'Automated MITRE ATT&CK technique mapping and attack progression graph construction.',
      'Interactive conversational analyst copilot with tool-use for automated firewall rule isolation.',
      'Zero-hallucination deterministic verification of security policies before execution.',
      'Automated synthetic malware sandbox detonation and behavioral signature generation.'
    ]
  },
  {
    code: 'PS-06',
    fileName: 'PS06_Agritech_Precision_Irrigation.pdf',
    title: 'Satellite & IoT Precision Agriculture Hydro-Optimization System',
    domain: 'Agritech / Remote Sensing / Embedded Systems',
    overview: 'Engineer an intelligent multi-spectral satellite imagery and soil telemetry pipeline that optimizes variable-rate irrigation scheduling and detects crop stress patterns 10 days before visible emergence.',
    keyReqs: [
      'Sentinel-2 / Landsat NDVI and NDWI multi-spectral index calculation pipeline.',
      'LoRaWAN low-power mesh sensor network for soil volumetric water content and temperature.',
      'Evapotranspiration (Penman-Monteith) estimation combining local microclimate weather models.',
      'Automated solenoid valve automation control with solar battery power management.',
      'Farmer-first multilingual SMS/WhatsApp alert interface and offline-first PWA dashboard.'
    ]
  },
  {
    code: 'PS-07',
    fileName: 'PS07_Disaster_Response_Drone_Swarm.pdf',
    title: 'Autonomous Multi-Agent Drone Swarm Protocol for Disaster Response',
    domain: 'Robotics / Swarm Intelligence / Autonomous Systems',
    overview: 'Formulate a decentralized peer-to-peer swarm mesh communication and navigation protocol enabling autonomous search-and-rescue mapping in GPS-denied catastrophe zones.',
    keyReqs: [
      'Decentralized flocking and collision avoidance based on Reynolds swarm heuristics and APF.',
      'Visual SLAM (Simultaneous Localization and Mapping) for indoor and collapsed structure navigation.',
      'Real-time thermal infrared survivor detection and victim geolocation tagging.',
      'Self-healing dynamic ad-hoc mesh network maintaining relay connectivity with base camp.',
      'Automated payload drop trajectory calculation for critical emergency medical kits.'
    ]
  },
  {
    code: 'PS-08',
    fileName: 'PS08_Zero_Knowledge_Identity_Vault.pdf',
    title: 'Privacy-Preserving Zero-Knowledge Digital Identity Vault',
    domain: 'Cryptography / Identity / Privacy Tech',
    overview: 'Implement a selective disclosure decentralized identity framework utilizing zk-SNARKs to allow citizens to prove age, citizenship, and academic credentials without revealing underlying personal data.',
    keyReqs: [
      'zk-SNARK / Groth16 circuit implementation for private predicate verification (e.g., Age >= 18).',
      'W3C Verifiable Credentials and Decentralized Identifiers (DID) standard compliance.',
      'Hardware secure enclave / biometric key generation on client devices.',
      'Instant revocation check mechanism using dynamic cryptographic accumulator trees.',
      'Seamless single-click OAuth2 / OIDC bridge for rapid web application integration.'
    ]
  },
  {
    code: 'PS-09',
    fileName: 'PS09_Fintech_Fraud_Detection_Engine.pdf',
    title: 'Sub-Millisecond High-Frequency Fraud Detection & AML Anomaly Engine',
    domain: 'FinTech / Streaming Analytics / High-Performance Computing',
    overview: 'Deliver an ultra-low latency streaming transaction intelligence pipeline capable of scoring complex synthetic identity and layering fraud patterns within 15 milliseconds at 50,000 TPS.',
    keyReqs: [
      'Sub-15ms P99 decisioning engine with sliding temporal feature stores.',
      'Dynamic graph link analysis identifying mule account rings and rapid money laundering chains.',
      'Adaptive behavioral biometric profiling (typing cadence, swipe dynamics, device fingerprints).',
      'High-throughput Apache Kafka / Redpanda event processing integration.',
      'Comprehensive regulatory AML SAR (Suspicious Activity Report) generation workflow.'
    ]
  }
];

function escapePdfText(str) {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function createPdfContent(ps) {
  const lines = [
    `%PDF-1.4`,
    `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,
    `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj`,
    `4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj`,
    `5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`
  ];

  let stream = `BT\n`;
  // Header
  stream += `/F1 16 Tf 50 740 Td (S.A. ENGINEERING COLLEGE) Tj\n`;
  stream += `/F2 10 Tf 0 -15 Td (Autonomous Institution | Affiliated to Anna University | NBA & NAAC 'A' Grade) Tj\n`;
  stream += `/F2 9 Tf 0 -13 Td (Dept of Electronics & Communication Engg & Dept of Electronics Engg [VLSI Design & Technology]) Tj\n`;
  stream += `0 -20 Td 512 0 0 -1 re S\n`; // divider line

  // Event Banner
  stream += `/F1 18 Tf 0 -25 Td (KERNEL PRIME '26 - SOFTWARE TRACK) Tj\n`;
  stream += `/F2 10 Tf 0 -14 Td (National Level 24-Hour Hackathon | October 8-9, 2026) Tj\n`;

  // Problem Statement Badge
  stream += `/F1 14 Tf 0 -28 Td (OFFICIAL PROBLEM STATEMENT: ${escapePdfText(ps.code)}) Tj\n`;
  stream += `/F1 12 Tf 0 -18 Td (${escapePdfText(ps.title)}) Tj\n`;
  stream += `/F2 10 Tf 0 -15 Td (Domain: ${escapePdfText(ps.domain)}) Tj\n`;
  stream += `0 -15 Td 512 0 0 -1 re S\n`;

  // Overview
  stream += `/F1 11 Tf 0 -22 Td (1. PROBLEM OVERVIEW & CHALLENGE STATEMENT) Tj\n`;
  stream += `/F2 9.5 Tf 0 -15 Td (${escapePdfText(ps.overview.substring(0, 100))}) Tj\n`;
  if (ps.overview.length > 100) {
    stream += `0 -12 Td (${escapePdfText(ps.overview.substring(100))}) Tj\n`;
  }

  // Key Requirements
  stream += `/F1 11 Tf 0 -22 Td (2. MANDATORY ARCHITECTURAL REQUIREMENTS) Tj\n`;
  ps.keyReqs.forEach((req, idx) => {
    stream += `/F2 9 Tf 0 -14 Td ([REQ-${idx + 1}] ${escapePdfText(req.substring(0, 95))}) Tj\n`;
  });

  // Evaluation Metrics
  stream += `/F1 11 Tf 0 -22 Td (3. HACKATHON EVALUATION MATRIX) Tj\n`;
  stream += `/F2 9 Tf 0 -13 Td (* System Architecture & Concurrency Resilience: 25%) Tj\n`;
  stream += `0 -12 Td (* Technical Innovation & Production Viability: 25%) Tj\n`;
  stream += `0 -12 Td (* Live Demo & Real-World Latency Benchmarks: 30%) Tj\n`;
  stream += `0 -12 Td (* Security Hardening, UI Polish & Documentation: 20%) Tj\n`;

  // Footer
  stream += `0 -25 Td 512 0 0 -1 re S\n`;
  stream += `/F1 9 Tf 0 -16 Td (CONFIDENTIAL - AUTHORIZED ALLOCATION COPY ONLY) Tj\n`;
  stream += `/F2 8 Tf 0 -12 Td (Generated securely via Kernel Prime Allocation Engine. Strictly non-transferable.) Tj\n`;
  stream += `ET\n`;

  const streamLength = Buffer.byteLength(stream);
  lines.push(`6 0 obj << /Length ${streamLength} >> stream\n${stream}endstream\nendobj`);

  // Build xref
  let currentOffset = 0;
  const offsets = [];
  const bodyParts = [];

  for (let i = 0; i < lines.length; i++) {
    offsets.push(currentOffset);
    const chunk = lines[i] + '\n';
    bodyParts.push(chunk);
    currentOffset += Buffer.byteLength(chunk);
  }

  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${lines.length + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < offsets.length; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ` 00000 n \n`;
  }

  const trailer = `trailer << /Size ${lines.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(bodyParts.join('') + xref + trailer);
}

for (const ps of problemStatements) {
  const pdfBuffer = createPdfContent(ps);
  const filePath = path.join(targetDir, ps.fileName);
  fs.writeFileSync(filePath, pdfBuffer);
  console.log(`Generated official PDF: ${ps.fileName} (${pdfBuffer.length} bytes)`);
}

console.log('All 9 official problem statement PDFs generated successfully.');
