from backend.proof.models import CompensationResult

COMPENSATION_RATES_VND_PER_HA = {
    "rice": (2000000, 4600000),
    "maize": (2000000, 4600000),
    "vegetables": (3000000, 5000000),
    "fruit_trees": (4000000, 6000000),
}

LEGAL_BASIS = "Nghi dinh 02/2017/ND-CP, Phu luc I"


def calculate_compensation(crop_type: str, area_ha: float, loss_pct: int) -> CompensationResult:
    if crop_type not in COMPENSATION_RATES_VND_PER_HA:
        raise ValueError("INVALID_CROP_TYPE")
    if loss_pct < 30:
        return CompensationResult(
            eligible=False,
            compensation_vnd=0,
            compensation_million_vnd=0.0,
            rate_vnd_per_ha=0,
            legal_basis=LEGAL_BASIS,
        )

    lower_rate, higher_rate = COMPENSATION_RATES_VND_PER_HA[crop_type]
    rate = higher_rate if loss_pct > 70 else lower_rate
    amount = round(area_ha * rate * (loss_pct / 100))
    return CompensationResult(
        eligible=True,
        compensation_vnd=amount,
        compensation_million_vnd=round(amount / 1000000, 1),
        rate_vnd_per_ha=rate,
        legal_basis=LEGAL_BASIS,
    )
