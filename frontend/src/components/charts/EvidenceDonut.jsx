import React from "react";

export function EvidenceDonut({ pct, label = "Evidence" }) {
  const safePct = Math.min(100, Math.max(0, pct));
  const r = 40;
  const cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const fill = circ * (safePct / 100);
  const color = safePct >= 80 ? "#00C97B" : safePct >= 50 ? "#D97706" : "#DC2626";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 100 100" width="100" height="100" aria-label={`${label}: ${safePct}%`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface3)" strokeWidth={12} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill={color} fontFamily="var(--font)">
          {safePct}%
        </text>
      </svg>
      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: -4 }}>{label}</div>
    </div>
  );
}
