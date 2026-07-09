import React from "react";
import { describeArc } from "./svgUtils.js";

// A full sweep would make describeArc's start and end points coincide, which
// renders as an empty path. Stop just short of the seam.
const MAX_SWEEP = 359.9;

function clampPct(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, number));
}

/**
 * Circular progress ring with the percentage in the middle.
 *
 * @param {number} value    0-100. Out-of-range and non-numeric values clamp to the ring.
 * @param {string} color    Any CSS colour; defaults to the brand green.
 * @param {number} size     Rendered width/height in px.
 * @param {string} caption  Small text under the number. Omit for a bare ring.
 */
export function ConfidenceMeter({
  value = 0,
  color = "var(--green)",
  size = 96,
  caption,
  ariaLabel,
}) {
  const pct = clampPct(value);
  const VB = 100;
  const c = VB / 2;
  const r = 42;
  const stroke = 9;
  const sweep = (pct / 100) * MAX_SWEEP;

  return (
    <div
      className="confidence-meter"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel || `${Math.round(pct)}%`}
    >
      <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%">
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="var(--surface3)"
          strokeWidth={stroke}
        />
        {pct > 0 && (
          <path
            className="confidence-meter-arc"
            d={describeArc(c, c, r, 0, sweep)}
            fill="none"
            style={{ stroke: color }}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        )}
        <text
          x={c}
          y={caption ? c : c + 6}
          textAnchor="middle"
          fontSize={24}
          fontWeight={800}
          style={{ fill: color }}
          fontFamily="var(--font)"
          letterSpacing="-0.5px"
        >
          {Math.round(pct)}
          <tspan fontSize={12} fontWeight={700} dy="-1">%</tspan>
        </text>
        {caption && (
          <text
            x={c}
            y={c + 18}
            textAnchor="middle"
            fontSize={9}
            fontWeight={600}
            fill="var(--text3)"
            fontFamily="var(--font)"
            letterSpacing="0.06em"
          >
            {caption.toUpperCase()}
          </text>
        )}
      </svg>
    </div>
  );
}
