// Placeholder data for screens/YieldPrediction.jsx — see ./README.md
// Field area (2.4 ha) matches the demo field used across the rest of the app.

export const SUMMARY = {
  yieldPerHa: 6.2,
  fieldAreaHa: 2.4,
  totalTonnes: 14.9,
  vsLastSeasonPct: 8,
  confidence: 74,
};

/**
 * Season-long yield trajectory in tonnes/ha.
 * `actual` stops at the current week; `projected` carries the dashed tail.
 * `low`/`high` bound the confidence band, which widens toward harvest.
 */
export const TRAJECTORY = [
  { week: 1,  actual: 0.0, low: 0.0, high: 0.0 },
  { week: 3,  actual: 0.4, low: 0.3, high: 0.5 },
  { week: 5,  actual: 1.3, low: 1.1, high: 1.6 },
  { week: 7,  actual: 2.5, low: 2.1, high: 2.9 },
  { week: 9,  actual: 3.8, low: 3.3, high: 4.3 },
  { week: 11, actual: 4.9, low: 4.2, high: 5.5 },
  { week: 13, projected: 5.7, low: 4.7, high: 6.6 },
  { week: 15, projected: 6.2, low: 4.9, high: 7.3 },
];

/** Where the solid line ends and the dashed projection begins. */
export const PROJECTION_FROM_WEEK = 11;

export const PLOTS = [
  { id: "A", nameKey: "north", areaHa: 0.8, yieldPerHa: 6.7, trendPct: 12 },
  { id: "B", nameKey: "canal", areaHa: 0.6, yieldPerHa: 6.4, trendPct: 5 },
  { id: "C", nameKey: "south", areaHa: 0.7, yieldPerHa: 5.9, trendPct: -3 },
  { id: "D", nameKey: "lowland", areaHa: 0.3, yieldPerHa: 5.1, trendPct: -9 },
];

/** Upper bound for the plot bars, so they share a scale. */
export const PLOT_YIELD_MAX = 8;
