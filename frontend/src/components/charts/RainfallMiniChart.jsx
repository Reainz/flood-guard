import React from "react";

/** viewBox height / top reserve / bottom reserve tuned so mm labels are not clipped */
const W = 220;
const H = 98;
const PAD = 12;
const BAR_GAP = 4;
const TOP_RESERVE = 22;
const BOT_RESERVE = 16;
const BASELINE = H - BOT_RESERVE;

export function RainfallMiniChart({ data, threshold = 85 }) {
  if (!data || data.length === 0) return null;
  const maxMm = Math.max(...data.map((d) => d.mm), 1);
  const barW = (W - PAD * 2 - BAR_GAP * (data.length - 1)) / data.length;
  const maxBarH = BASELINE - TOP_RESERVE;

  return (
    <div className="rainfall-mini-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        aria-label="7-day rainfall forecast"
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          className="rainfall-baseline"
          x1={PAD - 4}
          y1={BASELINE}
          x2={W - PAD + 4}
          y2={BASELINE}
        />
        {data.map((d, i) => {
          const barH = Math.max(3, (d.mm / maxMm) * maxBarH);
          const x = PAD + i * (barW + BAR_GAP);
          const y = BASELINE - barH;
          const isHigh = d.mm >= threshold;
          const barClass = `rainfall-svg-bar ${isHigh ? "rainfall-svg-bar--high" : "rainfall-svg-bar--low"}`;
          return (
            <g key={d.label}>
              <rect
                className={barClass}
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
              />
              {isHigh && (
                <text
                  className="rainfall-mm-label"
                  x={x + barW / 2}
                  y={y - 5}
                  textAnchor="middle"
                >
                  {d.mm}
                </text>
              )}
              <text
                className="rainfall-day-label"
                x={x + barW / 2}
                y={H - 3}
                textAnchor="middle"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
