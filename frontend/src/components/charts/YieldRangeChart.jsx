import React from "react";

const VB_W = 320;
const VB_H = 190;
const PAD_L = 28;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 26;

const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = VB_H - PAD_T - PAD_B;

const GRID_LINES = 4;

function niceMax(value) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.ceil(value);
}

/**
 * Season yield trajectory: a solid line for weeks already observed, a dashed tail for
 * the projection, and a confidence band that widens toward harvest.
 *
 * Each datum needs `week`, `low`, `high`, and one of `actual` or `projected`.
 * The dashed tail starts at the last observed point so the two lines meet.
 */
export function YieldRangeChart({
  data = [],
  projectionFromWeek,
  yMax,
  xAxisLabel,
  yAxisLabel,
  ariaLabel,
}) {
  if (data.length < 2) {
    return <div className="yield-range-chart is-empty" role="img" aria-label={ariaLabel} />;
  }

  const weeks = data.map((d) => d.week);
  const minWeek = Math.min(...weeks);
  const maxWeek = Math.max(...weeks);
  const weekSpan = maxWeek - minWeek || 1;

  const top = niceMax(yMax ?? Math.max(...data.map((d) => d.high ?? 0)));

  const x = (week) => PAD_L + ((week - minWeek) / weekSpan) * PLOT_W;
  const y = (value) => PAD_T + PLOT_H - (Math.min(top, Math.max(0, value)) / top) * PLOT_H;

  const bandPath = [
    ...data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(d.week).toFixed(1)} ${y(d.high ?? 0).toFixed(1)}`),
    ...[...data].reverse().map((d) => `L ${x(d.week).toFixed(1)} ${y(d.low ?? 0).toFixed(1)}`),
    "Z",
  ].join(" ");

  const observed = data.filter((d) => Number.isFinite(d.actual));
  const lastObserved = observed[observed.length - 1];

  const projected = data.filter((d) => Number.isFinite(d.projected));
  // Anchor the dashed line to the last solid point so there is no visual gap.
  const projectedWithAnchor = lastObserved
    ? [{ week: lastObserved.week, projected: lastObserved.actual }, ...projected]
    : projected;

  const line = (points, valueKey) =>
    points
      .map((d, i) => `${i === 0 ? "M" : "L"} ${x(d.week).toFixed(1)} ${y(d[valueKey]).toFixed(1)}`)
      .join(" ");

  const gridValues = Array.from({ length: GRID_LINES + 1 }, (_, i) => (top / GRID_LINES) * i);

  const splitX = Number.isFinite(projectionFromWeek) ? x(projectionFromWeek) : null;

  return (
    <div className="yield-range-chart" role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="auto" preserveAspectRatio="xMidYMid meet">
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={PAD_L}
              y1={y(value)}
              x2={VB_W - PAD_R}
              y2={y(value)}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 6}
              y={y(value) + 3}
              textAnchor="end"
              fontSize={8}
              fontWeight={600}
              fill="var(--text3)"
              fontFamily="var(--font)"
            >
              {value.toFixed(0)}
            </text>
          </g>
        ))}

        <path className="yield-band" d={bandPath} fill="var(--green)" opacity="0.14" />

        {splitX !== null && (
          <line
            x1={splitX}
            y1={PAD_T}
            x2={splitX}
            y2={PAD_T + PLOT_H}
            stroke="var(--border2)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
        )}

        {observed.length >= 2 && (
          <path
            className="yield-line"
            d={line(observed, "actual")}
            fill="none"
            stroke="var(--green)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {projectedWithAnchor.length >= 2 && (
          <path
            className="yield-line-projected"
            d={line(projectedWithAnchor, "projected")}
            fill="none"
            stroke="var(--green)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="5 4"
            opacity="0.75"
          />
        )}

        {lastObserved && (
          <circle
            cx={x(lastObserved.week)}
            cy={y(lastObserved.actual)}
            r={4}
            fill="var(--surface)"
            stroke="var(--green)"
            strokeWidth="2.5"
          />
        )}

        {yAxisLabel && (
          // Anchored past the axis numbers so it never sits on top of the highest one.
          <text
            x={PAD_L + 2}
            y={PAD_T - 3}
            textAnchor="start"
            fontSize={8}
            fontWeight={700}
            fill="var(--text3)"
            fontFamily="var(--font)"
          >
            {yAxisLabel}
          </text>
        )}

        {xAxisLabel && (
          <text
            x={VB_W - PAD_R}
            y={VB_H - 6}
            textAnchor="end"
            fontSize={8}
            fontWeight={700}
            fill="var(--text3)"
            fontFamily="var(--font)"
          >
            {xAxisLabel}
          </text>
        )}

        {[minWeek, maxWeek].map((week) => (
          <text
            key={week}
            x={x(week)}
            y={VB_H - 14}
            textAnchor={week === minWeek ? "start" : "middle"}
            fontSize={8}
            fontWeight={600}
            fill="var(--text3)"
            fontFamily="var(--font)"
          >
            {week}
          </text>
        ))}
      </svg>
    </div>
  );
}
