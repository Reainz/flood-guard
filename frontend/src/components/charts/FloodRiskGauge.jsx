import React from "react";
import { polarToCartesian, describeArc } from "./svgUtils.js";

const RISK_COLORS = {
  LOW:      "#00C97B",
  MODERATE: "#D97706",
  HIGH:     "#DC2626",
  CRITICAL: "#7F1D1D",
};

const START = 270;
const RANGE = 180;

export function FloodRiskGauge({ riskLevel, pct }) {
  const cx = 100, cy = 105, r = 78;
  const safePct = Math.min(100, Math.max(0, pct)) / 100;
  const endAngle = START + safePct * RANGE;
  const color = RISK_COLORS[riskLevel] || RISK_COLORS.MODERATE;

  const trackD = describeArc(cx, cy, r, START, START + RANGE);
  const fillD  = safePct > 0 ? describeArc(cx, cy, r, START, endAngle) : null;

  const tip = polarToCartesian(cx, cy, r - 10, endAngle);
  const base1 = polarToCartesian(cx, cy, 12, endAngle + 90);
  const base2 = polarToCartesian(cx, cy, 12, endAngle - 90);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 200 120" width="200" height="120" aria-label={`Flood risk gauge: ${riskLevel}`}>
        <path d={describeArc(cx, cy, r, 270, 330)} fill="none" stroke="#00C97B" strokeWidth={10} strokeLinecap="butt" opacity={0.25} />
        <path d={describeArc(cx, cy, r, 330, 390)} fill="none" stroke="#D97706" strokeWidth={10} strokeLinecap="butt" opacity={0.25} />
        <path d={describeArc(cx, cy, r, 390, 450)} fill="none" stroke="#DC2626" strokeWidth={10} strokeLinecap="butt" opacity={0.25} />
        <path d={trackD} fill="none" stroke="var(--border2)" strokeWidth={10} strokeLinecap="round" />
        {fillD && (
          <path d={fillD} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" />
        )}
        {safePct > 0 && (
          <polygon
            points={`${tip.x},${tip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`}
            fill={color}
            opacity={0.9}
          />
        )}
        <circle cx={cx} cy={cy} r={6} fill={color} />
        <text x={cx} y={cy - 20} textAnchor="middle" fontSize={11} fill="var(--text2)" fontFamily="var(--font)">
          Flood Risk
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize={13} fontWeight={700} fill={color} fontFamily="var(--font)">
          {riskLevel}
        </text>
      </svg>
    </div>
  );
}
