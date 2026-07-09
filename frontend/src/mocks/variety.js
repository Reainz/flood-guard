// Placeholder data for screens/VarietyAdvisor.jsx — see ./README.md

export const STEP_KEYS = ["soil", "context", "priority"];

export const SOIL_TYPES = ["alluvial", "acid_sulfate", "saline", "sandy"];
export const REGIONS = ["an_giang", "dong_thap", "can_tho", "kien_giang", "soc_trang"];
export const SEASONS = ["winter_spring", "summer_autumn", "autumn_winter"];
export const PRIORITIES = ["yield", "flood_tolerance", "market_price"];

export const DEFAULT_ANSWERS = {
  soil: "alluvial",
  region: "an_giang",
  season: "winter_spring",
  priority: "yield",
};

/** Milliseconds the fake "matching" runs before revealing the result. */
export const MATCH_MS = 800;

/**
 * The flow resolves to the same recommendation regardless of answers.
 * Attribute scores are 0-100.
 */
export const RECOMMENDATION = {
  varietyName: "OM5451",
  matchScore: 92,
  maturityDays: 95,
  attributes: [
    { key: "yield_potential", score: 88 },
    { key: "flood_tolerance", score: 71 },
    { key: "pest_resistance", score: 79 },
    { key: "market_demand", score: 94 },
  ],
};

export const RUNNERS_UP = [
  { varietyName: "OM18", matchScore: 85, maturityDays: 100 },
  { varietyName: "Đài Thơm 8", matchScore: 81, maturityDays: 105 },
];
