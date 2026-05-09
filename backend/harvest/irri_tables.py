EARLY_HARVEST_PENALTY = {
    "seedling": 95,
    "tillering": 75,
    "panicle_initiation": 60,
    "booting": 42,
    "heading": 30,
    "grain_filling": 10,
    "maturity": 5,
}

IRRI_FLOOD_DAMAGE = {
    "seedling": {"shallow": 55, "moderate": 72, "deep": 90},
    "tillering": {"shallow": 42, "moderate": 58, "deep": 82},
    "panicle_initiation": {"shallow": 50, "moderate": 76, "deep": 94},
    "booting": {"shallow": 38, "moderate": 62, "deep": 85},
    "heading": {"shallow": 30, "moderate": 50, "deep": 75},
    "grain_filling": {"shallow": 18, "moderate": 45, "deep": 65},
    "maturity": {"shallow": 8, "moderate": 16, "deep": 28},
}

POST_FLOOD_QUALITY_LOSS = {
    "seedling": 88,
    "tillering": 65,
    "panicle_initiation": 58,
    "booting": 42,
    "heading": 34,
    "grain_filling": 24,
    "maturity": 9,
}

ELEVATION_MODIFIER = {"low": 1.25, "medium": 1.0, "high": 0.75}
