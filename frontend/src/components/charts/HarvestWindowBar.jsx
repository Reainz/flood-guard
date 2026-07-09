import React from "react";

const VB_W = 320;
const VB_H = 100;
const PAD_X = 14;
const TRACK_W = VB_W - PAD_X * 2;
const TRACK_Y = 46;
const TRACK_H = 18;
const RADIUS = 6;

/**
 * A day-of-month track showing the recommended harvest window, where today sits,
 * and any stretch of the window that overlaps forecast flood risk.
 *
 * All `*Day` props are days of the month. Spans are inclusive on both ends.
 * Days outside the track are clamped rather than drawn off the edge.
 */
export function HarvestWindowBar({
  trackStartDay = 1,
  trackDays = 30,
  todayDay,
  windowStartDay,
  windowEndDay,
  floodRiskStartDay,
  floodRiskEndDay,
  windowLabel,
  todayLabel,
  floodRiskLabel,
  ariaLabel,
}) {
  const lastDay = trackStartDay + trackDays - 1;
  const clampDay = (day) => Math.min(lastDay + 1, Math.max(trackStartDay, day));

  // Left edge of a day's cell. Passing lastDay + 1 yields the track's right edge,
  // which is what an inclusive span's end needs.
  const dayX = (day) => PAD_X + ((clampDay(day) - trackStartDay) / trackDays) * TRACK_W;

  const spanX = (from, to) => {
    const x1 = dayX(from);
    const x2 = dayX(to + 1);
    return { x: x1, width: Math.max(0, x2 - x1) };
  };

  const hasWindow = Number.isFinite(windowStartDay) && Number.isFinite(windowEndDay);
  const hasFloodRisk = Number.isFinite(floodRiskStartDay) && Number.isFinite(floodRiskEndDay);
  const hasToday = Number.isFinite(todayDay);

  const windowSpan = hasWindow ? spanX(windowStartDay, windowEndDay) : null;
  const floodSpan = hasFloodRisk ? spanX(floodRiskStartDay, floodRiskEndDay) : null;
  const todayX = hasToday ? dayX(todayDay) + TRACK_W / trackDays / 2 : 0;

  const ticks = [];
  for (let day = trackStartDay; day <= lastDay; day += 5) ticks.push(day);

  return (
    <div className="harvest-window-bar" role="img" aria-label={ariaLabel || windowLabel}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="fg-flood-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--amber-dim)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--amber)" strokeWidth="1.6" opacity="0.55" />
          </pattern>
          <clipPath id="fg-window-clip">
            <rect x={PAD_X} y={TRACK_Y} width={TRACK_W} height={TRACK_H} rx={RADIUS} />
          </clipPath>
        </defs>

        <rect
          x={PAD_X}
          y={TRACK_Y}
          width={TRACK_W}
          height={TRACK_H}
          rx={RADIUS}
          fill="var(--surface3)"
        />

        <g clipPath="url(#fg-window-clip)">
          {windowSpan && (
            <rect
              className="harvest-window-band"
              x={windowSpan.x}
              y={TRACK_Y}
              width={windowSpan.width}
              height={TRACK_H}
              fill="var(--green)"
              opacity="0.9"
            />
          )}
          {floodSpan && (
            <rect
              x={floodSpan.x}
              y={TRACK_Y}
              width={floodSpan.width}
              height={TRACK_H}
              fill="url(#fg-flood-hatch)"
            />
          )}
        </g>

        <rect
          x={PAD_X}
          y={TRACK_Y}
          width={TRACK_W}
          height={TRACK_H}
          rx={RADIUS}
          fill="none"
          stroke="var(--border2)"
          strokeWidth="1"
        />

        {ticks.map((day) => (
          <g key={day}>
            <line
              x1={dayX(day)}
              y1={TRACK_Y + TRACK_H + 3}
              x2={dayX(day)}
              y2={TRACK_Y + TRACK_H + 7}
              stroke="var(--border2)"
              strokeWidth="1"
            />
            <text
              x={dayX(day)}
              y={TRACK_Y + TRACK_H + 19}
              textAnchor="middle"
              fontSize={9}
              fontWeight={600}
              fill="var(--text3)"
              fontFamily="var(--font)"
            >
              {day}
            </text>
          </g>
        ))}

        {hasToday && (
          <g className="harvest-window-today">
            <line
              x1={todayX}
              y1={TRACK_Y - 12}
              x2={todayX}
              y2={TRACK_Y + TRACK_H + 4}
              stroke="var(--text)"
              strokeWidth="2"
              strokeDasharray="3 2"
            />
            <circle cx={todayX} cy={TRACK_Y - 12} r={3.5} fill="var(--text)" />
            <text
              x={todayX}
              y={TRACK_Y - 20}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill="var(--text2)"
              fontFamily="var(--font)"
              letterSpacing="0.05em"
            >
              {(todayLabel || "").toUpperCase()}
            </text>
          </g>
        )}

        {windowSpan && windowLabel && (
          <text
            x={windowSpan.x + windowSpan.width / 2}
            y={TRACK_Y + TRACK_H / 2 + 4}
            textAnchor="middle"
            fontSize={10}
            fontWeight={800}
            fill="var(--bg)"
            fontFamily="var(--font)"
          >
            {windowLabel}
          </text>
        )}

        {floodSpan && floodRiskLabel && (
          <text
            x={VB_W - PAD_X}
            y={TRACK_Y + TRACK_H + 33}
            textAnchor="end"
            fontSize={9}
            fontWeight={700}
            fill="var(--amber)"
            fontFamily="var(--font)"
          >
            {floodRiskLabel}
          </text>
        )}
      </svg>
    </div>
  );
}
