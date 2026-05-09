import React from "react";

const W = 200, H = 80, PAD = 14, BAR_GAP = 3;

export function RainfallMiniChart({ data, threshold = 85 }) {
  if (!data || data.length === 0) return null;
  const maxMm = Math.max(...data.map((d) => d.mm), 1);
  const barW = (W - PAD * 2 - BAR_GAP * (data.length - 1)) / data.length;
  const chartH = H - 18;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-label="7-day rainfall forecast">
      {data.map((d, i) => {
        const barH = Math.max(2, (d.mm / maxMm) * chartH);
        const x = PAD + i * (barW + BAR_GAP);
        const y = chartH - barH;
        const isHigh = d.mm >= threshold;
        return (
          <g key={d.label}>
            <rect
              className="rainfall-svg-bar"
              x={x} y={y} width={barW} height={barH}
              rx={3}
              fill={isHigh ? "rgba(59,130,246,0.55)" : "rgba(59,130,246,0.22)"}
              stroke={isHigh ? "rgba(59,130,246,0.7)" : "rgba(59,130,246,0.3)"}
              strokeWidth={1}
            />
            {isHigh && (
              <text x={x + barW / 2} y={y - 2} textAnchor="middle" fontSize={8} fill="var(--blue)" fontWeight={700}>
                {d.mm}
              </text>
            )}
            <text x={x + barW / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="var(--text3)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
