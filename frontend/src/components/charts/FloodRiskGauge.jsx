import React from "react";
import { polarToCartesian, describeArc } from "./svgUtils.js";

// polarToCartesian uses (angleDeg - 90), so:
//   angle 270 -> 180 deg -> LEFT  (cx-r, cy)
//   angle 360 -> 270 deg -> TOP   (cx, cy-r)
//   angle 450 -> 360 deg -> RIGHT (cx+r, cy)
// Range 270 -> 450 covers the upper half clockwise.
const START = 270;
const RANGE = 180;
const END = START + RANGE;

const ZONES = [
  { from: 0,  to: 33,  key: "LOW",      color: "var(--green)" },
  { from: 33, to: 66,  key: "MODERATE", color: "var(--amber)" },
  { from: 66, to: 100, key: "HIGH",     color: "var(--red)"   },
];

const RISK_COLOR = {
  LOW:      "var(--green)",
  MODERATE: "var(--amber)",
  HIGH:     "var(--red)",
  CRITICAL: "var(--red)",
};

const RISK_LABEL_KEY = {
  LOW:      "risk.LOW",
  MODERATE: "risk.MODERATE",
  HIGH:     "risk.HIGH",
  CRITICAL: "risk.CRITICAL",
};

function angleFor(pct) {
  return START + (Math.min(100, Math.max(0, pct)) / 100) * RANGE;
}

export function FloodRiskGauge({ riskLevel = "MODERATE", pct = 50, label = "Flood Risk", t }) {
  const VB_W = 300;
  const VB_H = 200;
  const cx = VB_W / 2;
  const cy = 170;
  const r = 110;
  const trackWidth = 26;

  const color = RISK_COLOR[riskLevel] || "var(--amber)";
  const safePct = Math.min(100, Math.max(0, pct));
  const needleAngle = angleFor(safePct);

  const needleTip   = polarToCartesian(cx, cy, r - 8, needleAngle);
  const needleLeft  = polarToCartesian(cx, cy, 12, needleAngle - 90);
  const needleRight = polarToCartesian(cx, cy, 12, needleAngle + 90);

  const lowEnd  = polarToCartesian(cx, cy, r + 18, START);
  const midTop  = polarToCartesian(cx, cy, r + 18, START + RANGE / 2);
  const highEnd = polarToCartesian(cx, cy, r + 18, END);

  const riskText = t ? t(RISK_LABEL_KEY[riskLevel] || RISK_LABEL_KEY.MODERATE) : riskLevel;
  const labelText = label;

  function isActiveZone(zoneKey) {
    if (riskLevel === "CRITICAL") return zoneKey === "HIGH";
    return zoneKey === riskLevel;
  }

  return (
    <div className="flood-risk-gauge-wrap" role="img" aria-label={`${labelText}: ${riskText}`}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="fg-gauge-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(42,76,5,0.22)" />
          </filter>
          <linearGradient id="fg-needle-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.78" />
          </linearGradient>
        </defs>

        <path
          d={describeArc(cx, cy, r, START, END)}
          fill="none"
          stroke="var(--surface3)"
          strokeWidth={trackWidth + 2}
          strokeLinecap="round"
        />

        {ZONES.map((zone) => {
          const a1 = START + (zone.from / 100) * RANGE;
          const a2 = START + (zone.to / 100) * RANGE;
          return (
            <path
              key={zone.key}
              d={describeArc(cx, cy, r, a1, a2)}
              fill="none"
              style={{ stroke: zone.color }}
              strokeWidth={trackWidth}
              strokeLinecap="butt"
              opacity={isActiveZone(zone.key) ? 1 : 0.28}
            />
          );
        })}

        <text x={lowEnd.x}  y={lowEnd.y + 4}  textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text2)" fontFamily="var(--font)">
          {t ? t("risk.LOW") : "Low"}
        </text>
        <text x={midTop.x}  y={midTop.y}      textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text2)" fontFamily="var(--font)">
          {t ? t("risk.MODERATE") : "Med"}
        </text>
        <text x={highEnd.x} y={highEnd.y + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text2)" fontFamily="var(--font)">
          {t ? t("risk.HIGH") : "High"}
        </text>

        <g filter="url(#fg-gauge-shadow)">
          <polygon
            points={`${needleTip.x.toFixed(2)},${needleTip.y.toFixed(2)} ${needleLeft.x.toFixed(2)},${needleLeft.y.toFixed(2)} ${needleRight.x.toFixed(2)},${needleRight.y.toFixed(2)}`}
            fill="url(#fg-needle-grad)"
          />
          <circle cx={cx} cy={cy} r={14} fill="var(--surface)" stroke={color} strokeWidth={3.5} />
          <circle cx={cx} cy={cy} r={5} style={{ fill: color }} />
        </g>

        <text x={cx} y={cy - 56} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text3)" fontFamily="var(--font)" letterSpacing="0.06em">
          {labelText.toUpperCase()}
        </text>
        <text x={cx} y={cy - 28} textAnchor="middle" fontSize={28} fontWeight={800} style={{ fill: color }} fontFamily="var(--font)" letterSpacing="-0.6px">
          {riskText}
        </text>
      </svg>
    </div>
  );
}
