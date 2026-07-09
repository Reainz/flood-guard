// Placeholder data for screens/HarvestTiming.jsx — see ./README.md

/** Milliseconds the fake "recalculate" runs before resolving to the same answer. */
export const RECALC_MS = 800;

export const STAGES = [
  "seedling",
  "tillering",
  "panicle_initiation",
  "booting",
  "heading",
  "grain_filling",
  "maturity",
];

export const TIMING = {
  currentStage: "grain_filling",
  confidence: 82,

  // Track spans 30 days from trackStartDay. Values are day-of-month in March 2026.
  trackStartDay: 1,
  trackDays: 30,
  todayDay: 11,
  windowStartDay: 18,
  windowEndDay: 24,

  // Flood risk overlaps the tail of the window.
  floodRiskStartDay: 22,
  floodRiskEndDay: 30,
};

/** Each factor scores 0-100 and pushes toward or away from the window. */
export const FACTORS = [
  { key: "grain_moisture", score: 78, valueLabel: "22%", color: "var(--green)" },
  { key: "forecast_rainfall", score: 46, valueLabel: "64 mm", color: "var(--amber)" },
  { key: "stage_maturity", score: 91, valueLabel: "Day 96", color: "var(--green)" },
];
