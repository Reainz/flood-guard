// Placeholder data for screens/DiseaseDetection.jsx — see ./README.md

/** Milliseconds the fake "analysis" runs before revealing a result. */
export const ANALYSIS_MS = 900;

export const DETECTION = {
  diseaseKey: "leaf_blast",
  confidence: 87,
  severity: "moderate", // low | moderate | high
  affectedAreaPct: 12,
  observedOn: "2026-03-11",
  treatmentKeys: ["isolate", "fungicide", "drain"],
};

export const RECENT_NEARBY = [
  { id: "n1", diseaseKey: "leaf_blast", distanceKm: 1.8, daysAgo: 2, severity: "moderate" },
  { id: "n2", diseaseKey: "brown_spot", distanceKm: 4.2, daysAgo: 5, severity: "low" },
  { id: "n3", diseaseKey: "sheath_blight", distanceKm: 6.7, daysAgo: 9, severity: "high" },
];

export const SEVERITY_STYLE = {
  low: { color: "var(--green)", dim: "var(--green-dim)" },
  moderate: { color: "var(--amber)", dim: "var(--amber-dim)" },
  high: { color: "var(--red)", dim: "var(--red-dim)" },
};
