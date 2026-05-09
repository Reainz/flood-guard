GROWTH_STAGES = [
    ("seedling", "Ma non", 0, 15),
    ("tillering", "De nhanh", 15, 45),
    ("panicle_initiation", "Lam dong", 45, 65),
    ("booting", "Tro bong", 65, 75),
    ("heading", "Tro", 75, 85),
    ("grain_filling", "Vao chac - hat dang chac", 85, 100),
    ("maturity", "Chin", 100, 130),
]

CROP_DURATION_DAYS = {
    "rice": 105,
    "maize": 100,
    "vegetables": 75,
    "fruit_trees": 365,
}

CROP_STAGE_OFFSET = {
    "rice": 1.0,
    "maize": 1.05,
    "vegetables": 1.35,
    "fruit_trees": 0.35,
}
