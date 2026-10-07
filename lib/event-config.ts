/**
 * KERNEL PRIME'26 - Central Event Configuration
 * 
 * Edit this file to customize event metadata, schedules, contact info,
 * and high-level platform configuration.
 */

export const EVENT_CONFIG = {
  eventName: "KERNEL PRIME'26",
  eventTagline: "THE CORE OF INNOVATION",
  track: "Software Track",
  subTrack: "National Level 24-Hour Hackathon",
  eventDate: "October 8, 2026",
  eventLocation: "S.A. Engineering College, Chennai, Tamil Nadu",
  
  institution: {
    collegeName: "S.A. ENGINEERING COLLEGE",
    collegeAffiliation: "Institute Level Research Centre • Affiliated to Anna University, Chennai",
    accreditation: "Accredited by NAAC ‘A’ Grade, NBA & ISO 9001:2015 Certified",
    fullAccreditationText: "Institute Level Research Centre • Affiliated to Anna University, Chennai • Accredited by NAAC ‘A’ Grade, NBA & ISO 9001:2015 Certified",
    tagline: "WE DESIGN YOUR TOMORROW",
    departmentNames: [
      "Department of Electronics & Communication Engineering",
      "Department of Electronics Engineering (VLSI Design & Technology)"
    ],
    contactEmail: "kernelprime26@saec.ac.in",
    helpdeskMobile: "+91 98765 43210",
  },

  allocationRules: {
    totalTeams: 20,
    totalProblemStatements: 9,
    defaultCapacities: {
      "PS-01": 3,
      "PS-02": 3,
      "PS-03": 2,
      "PS-04": 2,
      "PS-05": 2,
      "PS-06": 2,
      "PS-07": 2,
      "PS-08": 2,
      "PS-09": 2,
    },
    // Spin animation duration in milliseconds
    spinDurationMs: 6500,
    // Whether participants can spin only once (CRITICAL RULE: TRUE)
    oneSpinPerTeamStrict: true,
  },

  brandingColors: {
    background: "#050505",
    surface: "#0D1117",
    electricBlue: "#00C8FF",
    premiumGold: "#F4B400",
    textPrimary: "#FFFFFF",
    textSecondary: "#AEB6C2",
    borderSubtle: "rgba(255, 255, 255, 0.08)",
  },
};

export default EVENT_CONFIG;
