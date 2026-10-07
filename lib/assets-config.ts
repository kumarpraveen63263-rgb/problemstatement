/**
 * KERNEL PRIME'26 - Asset Configuration File
 * 
 * Replace these file paths with your provided assets inside /public/assets/.
 * The application references these central definitions throughout the UI.
 */

export const ASSETS_CONFIG = {
  // Official Logos
  kernelPrimeLogo: "/assets/branding/kernel-prime-logo.png",
  collegeLogo: "/assets/branding/sa-college-emblem.png",
  years28Badge: "/assets/branding/28-years-badge.png",
  naacLogo: "/assets/branding/naac-badge.png",
  nbaLogo: "/assets/branding/nba-badge.png",
  campusBackground: "/assets/branding/sa-campus-bg.png",
  accreditationLogos: "/assets/branding/accreditations.svg",
  favicon: "/favicon.ico",

  // Visual Graphics & Backgrounds
  eventBackground: "/assets/branding/sa-campus-bg.png",
  circuitGraphics: "/assets/branding/circuit-pattern.svg",
  pcbTraces: "/assets/branding/pcb-traces.svg",

  // Official Problem Statement PDFs
  // Note: Stored securely in storage / private folder and served through /api/allocation/download
  problemStatementPdfs: {
    "PS-01": "/problem-statements/PS1.pdf",
    "PS-02": "/problem-statements/PS2.pdf",
    "PS-03": "/problem-statements/PS3.pdf",
    "PS-04": "/problem-statements/PS4.pdf",
    "PS-05": "/problem-statements/PS5.pdf",
    "PS-06": "/problem-statements/PS6.pdf",
    "PS-07": "/problem-statements/PS7.pdf",
    "PS-08": "/problem-statements/PS8.pdf",
    "PS-09": "/problem-statements/PS9.pdf",
  } as Record<string, string>,
};

export default ASSETS_CONFIG;
