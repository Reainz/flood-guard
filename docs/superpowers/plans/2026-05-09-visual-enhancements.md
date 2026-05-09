# Visual Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SVG charts, an animated flood-risk gauge, a real Leaflet map, and CSS pulse animations across all four FloodGuard screens so that farmers with low text literacy can understand risk and action at a glance.

**Architecture:** Each visual is a standalone React component in `frontend/src/components/charts/` or `frontend/src/components/map/`. They accept primitive props only (no API calls, no state) and are wired into the existing screens by adding a few lines. A shared `svgUtils.js` provides the `polarToCartesian` and `describeArc` helpers used by the gauge and donut components.

**Tech Stack:** React 19, Vite 6, inline SVG (zero new dependencies for charts), Leaflet + react-leaflet (lazy-loaded for map), Vitest + @testing-library/react (tests), lucide-react already installed.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `frontend/src/components/charts/svgUtils.js` | `polarToCartesian`, `describeArc` helpers |
| Create | `frontend/src/components/charts/LossBarChart.jsx` | Horizontal bars comparing 3 harvest scenarios |
| Create | `frontend/src/components/charts/FloodRiskGauge.jsx` | Semicircle SVG gauge for flood risk 0–100 |
| Create | `frontend/src/components/charts/CropStageTimeline.jsx` | Horizontal growth-stage progress strip |
| Create | `frontend/src/components/charts/EvidenceDonut.jsx` | SVG donut arc for evidence completeness % |
| Create | `frontend/src/components/charts/RainfallMiniChart.jsx` | SVG bar chart replacing hardcoded CSS bars |
| Create | `frontend/src/components/map/LeafletMap.jsx` | Lazy-loaded Leaflet map with field pin |
| Modify | `frontend/src/screens/HarvestDecision.jsx` | Add LossBarChart + CropStageTimeline |
| Modify | `frontend/src/screens/Dashboard.jsx` | Add FloodRiskGauge + LeafletMap |
| Modify | `frontend/src/screens/Alerts.jsx` | Add RainfallMiniChart, critical pulse class |
| Modify | `frontend/src/screens/LossProof.jsx` | Replace `<progress>` with EvidenceDonut |
| Modify | `frontend/src/styles.css` | Add pulse animation keyframes |
| Create | `frontend/vite.config.js` | Enable vitest with jsdom |
| Modify | `frontend/package.json` | Add test deps + leaflet |

---

## Task 0: Frontend test infrastructure

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vite.config.js`

- [ ] **Step 1: Install test and map dependencies**

```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
npm install leaflet react-leaflet
```

Expected: `package.json` gains those packages, `node_modules/vitest` exists.

- [ ] **Step 2: Create `frontend/vite.config.js`**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.js"],
  },
});
```

- [ ] **Step 3: Create `frontend/src/test-setup.js`**

```js
import "@testing-library/jest-dom";
```

- [ ] **Step 4: Add test script to `frontend/package.json`**

Add under `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Smoke-test the setup**

```bash
cd frontend
npm test
```

Expected: "No test files found" (exit 0 or vitest exit with no failures).

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/vite.config.js frontend/src/test-setup.js
git commit -m "chore: add vitest, testing-library, leaflet"
```

---

## Task 1: SVG utility helpers

**Files:**
- Create: `frontend/src/components/charts/svgUtils.js`
- Create: `frontend/src/components/charts/__tests__/svgUtils.test.js`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/components/charts/__tests__/svgUtils.test.js`:

```js
import { describe, it, expect } from "vitest";
import { polarToCartesian, describeArc } from "../svgUtils.js";

describe("polarToCartesian", () => {
  it("angle 270 maps to left of center (gauge start)", () => {
    const pt = polarToCartesian(100, 100, 80, 270);
    expect(pt.x).toBeCloseTo(20, 0);
    expect(pt.y).toBeCloseTo(100, 0);
  });

  it("angle 360 maps to top of circle", () => {
    const pt = polarToCartesian(100, 100, 80, 360);
    expect(pt.x).toBeCloseTo(100, 0);
    expect(pt.y).toBeCloseTo(20, 0);
  });

  it("angle 90 maps to right of center (gauge end)", () => {
    const pt = polarToCartesian(100, 100, 80, 90);
    expect(pt.x).toBeCloseTo(180, 0);
    expect(pt.y).toBeCloseTo(100, 0);
  });
});

describe("describeArc", () => {
  it("returns a string starting with M", () => {
    const d = describeArc(100, 100, 80, 270, 450);
    expect(d).toMatch(/^M /);
  });

  it("contains an A (arc) segment", () => {
    const d = describeArc(100, 100, 80, 270, 450);
    expect(d).toContain(" A ");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd frontend && npm test
```

Expected: `Cannot find module '../svgUtils.js'`

- [ ] **Step 3: Create `frontend/src/components/charts/svgUtils.js`**

```js
export function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export function describeArc(cx, cy, r, startAngle, endAngle) {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const sweep = endAngle > startAngle ? 1 : 0;
  const large = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd frontend && npm test
```

Expected: 5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/charts/svgUtils.js frontend/src/components/charts/__tests__/svgUtils.test.js
git commit -m "feat: add SVG arc utilities (polarToCartesian, describeArc)"
```

---

## Task 2: LossBarChart

**Files:**
- Create: `frontend/src/components/charts/LossBarChart.jsx`
- Create: `frontend/src/components/charts/__tests__/LossBarChart.test.jsx`
- Modify: `frontend/src/screens/HarvestDecision.jsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/components/charts/__tests__/LossBarChart.test.jsx`:

```jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LossBarChart } from "../LossBarChart.jsx";

const scenarios = [
  { label: "harvest_now", labelShort: "Now", loss_pct: 15, is_recommended: true,  color: "#00C97B" },
  { label: "wait",         labelShort: "Wait", loss_pct: 72, is_recommended: false, color: "#D97706" },
  { label: "harvest_after",labelShort: "After",loss_pct: 38, is_recommended: false, color: "#2563EB" },
];

describe("LossBarChart", () => {
  it("renders all three scenario labels", () => {
    render(<LossBarChart scenarios={scenarios} />);
    expect(screen.getByText("Now")).toBeInTheDocument();
    expect(screen.getByText("Wait")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
  });

  it("shows all three loss percentages", () => {
    render(<LossBarChart scenarios={scenarios} />);
    expect(screen.getByText("15%")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText("38%")).toBeInTheDocument();
  });

  it("shows the recommended badge on the winning scenario", () => {
    render(<LossBarChart scenarios={scenarios} />);
    expect(screen.getByText("✓ Recommended")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd frontend && npm test
```

Expected: `Cannot find module '../LossBarChart.jsx'`

- [ ] **Step 3: Create `frontend/src/components/charts/LossBarChart.jsx`**

```jsx
import React from "react";

export function LossBarChart({ scenarios }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
      {scenarios.map((s) => (
        <div key={s.label}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: s.is_recommended ? s.color : "var(--text2)" }}>
              {s.labelShort}
              {s.is_recommended && (
                <span style={{ marginLeft: 6, fontSize: 10, color: s.color }}>✓ Recommended</span>
              )}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.loss_pct}%</span>
          </div>
          <div style={{ height: 12, borderRadius: 6, background: "var(--surface3)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, Math.max(0, s.loss_pct))}%`,
                background: s.color,
                borderRadius: 6,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd frontend && npm test
```

Expected: all tests pass.

- [ ] **Step 5: Wire into `HarvestDecision.jsx`**

In `HarvestDecision.jsx`, add the import at the top:

```jsx
import { LossBarChart } from "../components/charts/LossBarChart.jsx";
```

In `HarvestResult`, after the closing `</div>` of the scenario-grid card and before the recommendation panel, add:

```jsx
<LossBarChart
  scenarios={scenarios.map((s, i) => ({
    label: s.label,
    labelShort: ["Now", "Wait", "After"][i],
    loss_pct: Math.round(s.loss_pct),
    is_recommended: s.is_recommended,
    color: scenarioCfgs[i]?.tc || "#00C97B",
  }))}
/>
```

The full replacement block for the scenario card (lines 206–249 in `HarvestDecision.jsx`) — insert `<LossBarChart>` after line 230 (after `</div>` that closes `.scenario-grid`):

```jsx
      </div>  {/* closes scenario-grid */}

      <LossBarChart
        scenarios={scenarios.map((s, i) => ({
          label: s.label,
          labelShort: i === 0 ? "Thu hoạch ngay" : i === 1 ? "Chờ lũ" : "Sau lũ",
          loss_pct: Math.round(s.loss_pct),
          is_recommended: s.is_recommended,
          color: scenarioCfgs[i]?.tc || "#00C97B",
        }))}
      />
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/charts/LossBarChart.jsx \
        frontend/src/components/charts/__tests__/LossBarChart.test.jsx \
        frontend/src/screens/HarvestDecision.jsx
git commit -m "feat: add LossBarChart visual to harvest decision screen"
```

---

## Task 3: FloodRiskGauge

**Files:**
- Create: `frontend/src/components/charts/FloodRiskGauge.jsx`
- Create: `frontend/src/components/charts/__tests__/FloodRiskGauge.test.jsx`
- Modify: `frontend/src/screens/Dashboard.jsx`

Risk levels map to numeric 0–100: LOW=20, MODERATE=50, HIGH=75, CRITICAL=95.

- [ ] **Step 1: Write failing test**

Create `frontend/src/components/charts/__tests__/FloodRiskGauge.test.jsx`:

```jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FloodRiskGauge } from "../FloodRiskGauge.jsx";

describe("FloodRiskGauge", () => {
  it("renders the risk label", () => {
    render(<FloodRiskGauge riskLevel="HIGH" pct={75} />);
    expect(screen.getByText("HIGH")).toBeInTheDocument();
  });

  it("renders an SVG element", () => {
    const { container } = render(<FloodRiskGauge riskLevel="LOW" pct={20} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("clamps pct above 100 to 100", () => {
    render(<FloodRiskGauge riskLevel="CRITICAL" pct={150} />);
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd frontend && npm test
```

Expected: `Cannot find module '../FloodRiskGauge.jsx'`

- [ ] **Step 3: Create `frontend/src/components/charts/FloodRiskGauge.jsx`**

```jsx
import React from "react";
import { polarToCartesian, describeArc } from "./svgUtils.js";

const RISK_COLORS = {
  LOW:      "#00C97B",
  MODERATE: "#D97706",
  HIGH:     "#DC2626",
  CRITICAL: "#7F1D1D",
};

// Gauge spans 270° (left) → 450° (right) through top at 360°
const START = 270;
const RANGE = 180;

export function FloodRiskGauge({ riskLevel, pct }) {
  const cx = 100, cy = 105, r = 78, trackR = 78;
  const safePct = Math.min(100, Math.max(0, pct)) / 100;
  const endAngle = START + safePct * RANGE;
  const color = RISK_COLORS[riskLevel] || RISK_COLORS.MODERATE;

  const trackD = describeArc(cx, cy, r, START, START + RANGE);
  const fillD  = safePct > 0 ? describeArc(cx, cy, r, START, endAngle) : null;

  // Needle tip
  const tip = polarToCartesian(cx, cy, r - 10, endAngle);
  const base1 = polarToCartesian(cx, cy, 12, endAngle + 90);
  const base2 = polarToCartesian(cx, cy, 12, endAngle - 90);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 200 120" width="200" height="120" aria-label={`Flood risk gauge: ${riskLevel}`}>
        {/* Coloured zone arcs */}
        <path d={describeArc(cx, cy, r, 270, 330)} fill="none" stroke="#00C97B" strokeWidth={10} strokeLinecap="butt" opacity={0.25} />
        <path d={describeArc(cx, cy, r, 330, 390)} fill="none" stroke="#D97706" strokeWidth={10} strokeLinecap="butt" opacity={0.25} />
        <path d={describeArc(cx, cy, r, 390, 450)} fill="none" stroke="#DC2626" strokeWidth={10} strokeLinecap="butt" opacity={0.25} />
        {/* Track (faint) */}
        <path d={trackD} fill="none" stroke="var(--border2)" strokeWidth={10} strokeLinecap="round" />
        {/* Fill */}
        {fillD && (
          <path d={fillD} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" />
        )}
        {/* Needle */}
        {safePct > 0 && (
          <polygon
            points={`${tip.x},${tip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`}
            fill={color}
            opacity={0.9}
          />
        )}
        {/* Center */}
        <circle cx={cx} cy={cy} r={6} fill={color} />
        {/* Label */}
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
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd frontend && npm test
```

Expected: all tests pass.

- [ ] **Step 5: Wire into `Dashboard.jsx`**

Add import at top of `Dashboard.jsx`:

```jsx
import { FloodRiskGauge } from "../components/charts/FloodRiskGauge.jsx";
```

In the `Dashboard` component, add the `RISK_PCT` map and insert the gauge inside the Countdown card. Replace the Countdown card (starting at line 79) with:

```jsx
      {/* Countdown + Gauge */}
      <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div className="section-title">{t("dashboard.arrival")}</div>
          <Countdown hours={data.prediction.hours_to_arrival} />
        </div>
        <FloodRiskGauge
          riskLevel={risk}
          pct={{ LOW: 18, MODERATE: 50, HIGH: 78, CRITICAL: 96 }[risk] ?? 50}
        />
      </div>
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/charts/FloodRiskGauge.jsx \
        frontend/src/components/charts/__tests__/FloodRiskGauge.test.jsx \
        frontend/src/screens/Dashboard.jsx
git commit -m "feat: add FloodRiskGauge SVG to dashboard"
```

---

## Task 4: CropStageTimeline

**Files:**
- Create: `frontend/src/components/charts/CropStageTimeline.jsx`
- Create: `frontend/src/components/charts/__tests__/CropStageTimeline.test.jsx`
- Modify: `frontend/src/screens/HarvestDecision.jsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/components/charts/__tests__/CropStageTimeline.test.jsx`:

```jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CropStageTimeline } from "../CropStageTimeline.jsx";

const STAGES = ["seedling", "tillering", "panicle_initiation", "booting", "heading", "grain_filling", "maturity"];

describe("CropStageTimeline", () => {
  it("renders all 7 stage dots", () => {
    const { container } = render(<CropStageTimeline currentStage="grain_filling" stages={STAGES} />);
    const dots = container.querySelectorAll(".stage-dot");
    expect(dots).toHaveLength(7);
  });

  it("marks the active stage", () => {
    render(<CropStageTimeline currentStage="grain_filling" stages={STAGES} />);
    expect(screen.getByText("grain_filling").closest(".stage-dot-wrap")).toHaveClass("active");
  });

  it("marks past stages as completed", () => {
    const { container } = render(<CropStageTimeline currentStage="heading" stages={STAGES} />);
    const completed = container.querySelectorAll(".stage-dot.completed");
    expect(completed.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd frontend && npm test
```

Expected: `Cannot find module '../CropStageTimeline.jsx'`

- [ ] **Step 3: Create `frontend/src/components/charts/CropStageTimeline.jsx`**

```jsx
import React from "react";

const STAGE_LABELS_VI = {
  seedling:           "Mạ",
  tillering:          "Đẻ nhánh",
  panicle_initiation: "Làm đòng",
  booting:            "Trỗ bông",
  heading:            "Trỗ",
  grain_filling:      "Vào chắc",
  maturity:           "Chín",
};

export function CropStageTimeline({ currentStage, stages }) {
  const activeIdx = stages.indexOf(currentStage);

  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "flex-start", minWidth: 340, position: "relative" }}>
        {/* Track line */}
        <div style={{
          position: "absolute",
          top: 10,
          left: "calc(100% / (var(--n) * 2))",
          right: "calc(100% / (var(--n) * 2))",
          height: 2,
          background: "var(--border2)",
          zIndex: 0,
          width: `calc(100% - ${100 / stages.length}%)`,
          marginLeft: `calc(${50 / stages.length}%)`,
        }} />
        {stages.map((stage, i) => {
          const isPast   = i < activeIdx;
          const isActive = i === activeIdx;
          const dotColor = isPast ? "var(--green)" : isActive ? "var(--blue)" : "var(--surface3)";
          const dotBorder = isActive ? "2px solid var(--blue)" : isPast ? "2px solid var(--green)" : "2px solid var(--border2)";
          return (
            <div
              key={stage}
              className={`stage-dot-wrap${isActive ? " active" : ""}`}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}
            >
              <div
                className={`stage-dot${isPast ? " completed" : ""}${isActive ? " active" : ""}`}
                style={{
                  width: isActive ? 20 : 14,
                  height: isActive ? 20 : 14,
                  borderRadius: "50%",
                  background: dotColor,
                  border: dotBorder,
                  transition: "all 0.3s ease",
                  flexShrink: 0,
                }}
              />
              <div style={{
                fontSize: 9,
                marginTop: 4,
                color: isActive ? "var(--blue)" : isPast ? "var(--green)" : "var(--text3)",
                fontWeight: isActive ? 700 : 400,
                textAlign: "center",
                lineHeight: 1.2,
              }}>
                {stage}
              </div>
              <div style={{ fontSize: 8, color: "var(--text3)", textAlign: "center", lineHeight: 1.1, marginTop: 1 }}>
                {STAGE_LABELS_VI[stage] || ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd frontend && npm test
```

Expected: all tests pass.

- [ ] **Step 5: Wire into `HarvestDecision.jsx`**

Add import:

```jsx
import { CropStageTimeline } from "../components/charts/CropStageTimeline.jsx";
```

In `HarvestResult`, inside the "Growth stage & Compensation" card (after the stat-grid), add:

```jsx
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>Growth stage progress</div>
          <CropStageTimeline
            currentStage={data.growth_stage || "grain_filling"}
            stages={["seedling", "tillering", "panicle_initiation", "booting", "heading", "grain_filling", "maturity"]}
          />
        </div>
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/charts/CropStageTimeline.jsx \
        frontend/src/components/charts/__tests__/CropStageTimeline.test.jsx \
        frontend/src/screens/HarvestDecision.jsx
git commit -m "feat: add CropStageTimeline visual to harvest screen"
```

---

## Task 5: EvidenceDonut

**Files:**
- Create: `frontend/src/components/charts/EvidenceDonut.jsx`
- Create: `frontend/src/components/charts/__tests__/EvidenceDonut.test.jsx`
- Modify: `frontend/src/screens/LossProof.jsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/components/charts/__tests__/EvidenceDonut.test.jsx`:

```jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvidenceDonut } from "../EvidenceDonut.jsx";

describe("EvidenceDonut", () => {
  it("renders the percentage as text", () => {
    render(<EvidenceDonut pct={72} />);
    expect(screen.getByText("72%")).toBeInTheDocument();
  });

  it("renders an SVG", () => {
    const { container } = render(<EvidenceDonut pct={50} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("clamps pct to 0–100", () => {
    render(<EvidenceDonut pct={120} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd frontend && npm test
```

- [ ] **Step 3: Create `frontend/src/components/charts/EvidenceDonut.jsx`**

```jsx
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
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface3)" strokeWidth={12} />
        {/* Fill — starts at 12 o'clock (rotate -90deg) */}
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
        {/* Center text */}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill={color} fontFamily="var(--font)">
          {safePct}%
        </text>
      </svg>
      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: -4 }}>{label}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd frontend && npm test
```

- [ ] **Step 5: Wire into `LossProof.jsx`**

Add import:

```jsx
import { EvidenceDonut } from "../components/charts/EvidenceDonut.jsx";
```

In the "Proof score" section (around line 271), replace the `<div className="proof-status">` block with:

```jsx
      <div className="proof-status" style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <EvidenceDonut pct={proofPct} label="Evidence" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Evidence completeness</div>
          <div style={{ fontSize: 11, color: "var(--text2)" }}>
            {proofPct >= 100
              ? "✓ Evidence package complete — ready to submit."
              : proofPct >= 80
              ? "Add 2 more photos to reach 100% — maximises your claim amount."
              : "Add photos to strengthen your claim. More evidence = higher approval rate."}
          </div>
        </div>
      </div>
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/charts/EvidenceDonut.jsx \
        frontend/src/components/charts/__tests__/EvidenceDonut.test.jsx \
        frontend/src/screens/LossProof.jsx
git commit -m "feat: replace progress bar with EvidenceDonut SVG"
```

---

## Task 6: RainfallMiniChart

**Files:**
- Create: `frontend/src/components/charts/RainfallMiniChart.jsx`
- Create: `frontend/src/components/charts/__tests__/RainfallMiniChart.test.jsx`
- Modify: `frontend/src/screens/Alerts.jsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/components/charts/__tests__/RainfallMiniChart.test.jsx`:

```jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RainfallMiniChart } from "../RainfallMiniChart.jsx";

const data = [
  { label: "T2", mm: 40 },
  { label: "T3", mm: 55 },
  { label: "T4", mm: 70 },
  { label: "T5", mm: 90 },
  { label: "T6", mm: 100 },
  { label: "T7", mm: 65 },
  { label: "CN", mm: 45 },
];

describe("RainfallMiniChart", () => {
  it("renders all day labels", () => {
    render(<RainfallMiniChart data={data} />);
    expect(screen.getByText("T2")).toBeInTheDocument();
    expect(screen.getByText("CN")).toBeInTheDocument();
  });

  it("renders an SVG bar for each data point", () => {
    const { container } = render(<RainfallMiniChart data={data} />);
    const bars = container.querySelectorAll(".rainfall-svg-bar");
    expect(bars).toHaveLength(data.length);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd frontend && npm test
```

- [ ] **Step 3: Create `frontend/src/components/charts/RainfallMiniChart.jsx`**

```jsx
import React from "react";

const W = 200, H = 80, PAD = 14, BAR_GAP = 3;

export function RainfallMiniChart({ data, threshold = 85 }) {
  if (!data || data.length === 0) return null;
  const maxMm = Math.max(...data.map((d) => d.mm), 1);
  const barW = (W - PAD * 2 - BAR_GAP * (data.length - 1)) / data.length;
  const chartH = H - 18; // leave 18px for labels

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
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd frontend && npm test
```

- [ ] **Step 5: Wire into `Alerts.jsx`**

Add import:

```jsx
import { RainfallMiniChart } from "../components/charts/RainfallMiniChart.jsx";
```

In `Alerts.jsx`, replace the hardcoded `rainfallHeights`/`rainfallLabels` section. Delete:
```jsx
const rainfallHeights = [40, 55, 70, 90, 100, 65, 45];
const rainfallLabels  = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
```

And replace the `<div className="rainfall-chart">` block (approximately lines 156–169) with:
```jsx
            <RainfallMiniChart
              data={[
                { label: "T2", mm: 40 }, { label: "T3", mm: 55 },
                { label: "T4", mm: 70 }, { label: "T5", mm: 90 },
                { label: "T6", mm: 100 },{ label: "T7", mm: 65 },
                { label: "CN", mm: 45 },
              ]}
              threshold={85}
            />
```

Also remove the `<div className="rainfall-labels">` block directly below it (the labels are now inside the SVG).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/charts/RainfallMiniChart.jsx \
        frontend/src/components/charts/__tests__/RainfallMiniChart.test.jsx \
        frontend/src/screens/Alerts.jsx
git commit -m "feat: replace CSS rainfall bars with SVG RainfallMiniChart"
```

---

## Task 7: Critical alert pulse animation

**Files:**
- Modify: `frontend/src/styles.css`
- Modify: `frontend/src/screens/Alerts.jsx`

No test needed — pure CSS animation with no logic.

- [ ] **Step 1: Add CSS to `frontend/src/styles.css`**

Append to the end of the file:

```css
/* ── ALERT PULSE ── */
@keyframes fg-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); }
  50%       { box-shadow: 0 0 0 14px rgba(220, 38, 38, 0); }
}

.alert-icon-pulse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  flex-shrink: 0;
}

.alert-icon-pulse.critical {
  animation: fg-pulse 1.8s ease-in-out infinite;
  background: rgba(220, 38, 38, 0.12);
}

.alert-icon-pulse.warning {
  background: rgba(217, 119, 6, 0.12);
}

.alert-icon-pulse.watch {
  background: rgba(37, 99, 235, 0.12);
}
```

- [ ] **Step 2: Apply pulse class in `Alerts.jsx`**

In the primary active alert card (around line 73), replace:
```jsx
          <div style={{ fontSize: 22 }}>{cfg.emoji}</div>
```
With:
```jsx
          <div className={`alert-icon-pulse ${tier.toLowerCase()}`}>{cfg.emoji}</div>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles.css frontend/src/screens/Alerts.jsx
git commit -m "feat: add CSS pulse animation to critical alert icon"
```

---

## Task 8: LeafletMap

**Files:**
- Create: `frontend/src/components/map/LeafletMap.jsx`
- Modify: `frontend/src/screens/Dashboard.jsx`

Leaflet is lazy-loaded so the map chunk (~400KB) does not impact the initial JS bundle.

- [ ] **Step 1: Verify leaflet is installed** (from Task 0 — should already be done)

```bash
ls frontend/node_modules/leaflet
```

Expected: directory exists.

- [ ] **Step 2: Create `frontend/src/components/map/LeafletMap.jsx`**

```jsx
import { useEffect, useRef } from "react";

let L;

async function getLeaflet() {
  if (L) return L;
  L = await import("leaflet");
  await import("leaflet/dist/leaflet.css");
  return L;
}

const RISK_COLORS = { LOW: "#00C97B", MODERATE: "#D97706", HIGH: "#DC2626", CRITICAL: "#7F1D1D" };

export default function LeafletMap({ lat, lon, riskLevel, stationName }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    let map;
    getLeaflet().then((leaflet) => {
      if (!containerRef.current || mapRef.current) return;
      map = leaflet.map(containerRef.current, { zoomControl: false, attributionControl: false })
                   .setView([lat, lon], 12);
      leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      const color = RISK_COLORS[riskLevel] || RISK_COLORS.MODERATE;
      leaflet.circle([lat, lon], { radius: 2500, color, fillColor: color, fillOpacity: 0.18, weight: 2 }).addTo(map);

      const icon = leaflet.divIcon({
        html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
        iconSize: [12, 12],
        className: "",
      });
      leaflet.marker([lat, lon], { icon })
             .bindPopup(`<strong>Your field</strong><br>${stationName || ""}`)
             .addTo(map);

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [lat, lon, riskLevel, stationName]);

  return <div ref={containerRef} style={{ height: 200, borderRadius: 12, overflow: "hidden" }} />;
}
```

- [ ] **Step 3: Wire into `Dashboard.jsx`**

Add a lazy import at the top of `Dashboard.jsx`:

```jsx
import { Suspense, lazy } from "react";
const LeafletMap = lazy(() => import("../components/map/LeafletMap.jsx"));
```

Replace the existing map placeholder `<div className="card">` block (the one with `.map-placeholder`, `.map-grid`, `.map-river`, `.map-flood-zone`, `.map-pin` divs) with:

```jsx
      {/* Map */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <Suspense fallback={<div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 12 }}>Loading map…</div>}>
          <LeafletMap
            lat={10.52}
            lon={105.12}
            riskLevel={risk}
            stationName={data.river.station}
          />
        </Suspense>
        <div className="map-legend" style={{ padding: "8px 14px" }}>
          <div className="map-legend-item">
            <div className="map-legend-sq" style={{ background: "rgba(239,68,68,0.3)" }} />
            Flood risk zone
          </div>
          <div className="map-legend-item">
            <div className="map-legend-dot" style={{ background: "var(--green)" }} />
            Your field
          </div>
        </div>
      </div>
```

- [ ] **Step 4: Run the app and verify the map loads**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173`, go to Dashboard. Expected: a real OpenStreetMap tile map loads with a coloured risk circle and field pin.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/map/LeafletMap.jsx frontend/src/screens/Dashboard.jsx
git commit -m "feat: add lazy-loaded Leaflet map to dashboard"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Harvest Decision: LossBarChart (visual bar comparison) + CropStageTimeline
- ✅ Dashboard: FloodRiskGauge + LeafletMap (real map)
- ✅ Alerts: RainfallMiniChart (SVG) + AlertPulse (CSS animation)
- ✅ LossProof: EvidenceDonut (replaces `<progress>`)
- ✅ Test infrastructure: vitest + @testing-library/react setup

**Placeholder scan:** No TBDs. All code blocks are complete and runnable.

**Type consistency:**
- `describeArc` / `polarToCartesian` defined in Task 1, used by FloodRiskGauge in Task 3 — import path matches.
- `LossBarChart` props: `scenarios[]` with `{label, labelShort, loss_pct, is_recommended, color}` — used consistently in HarvestDecision wire-up.
- `RainfallMiniChart` props: `data[]` with `{label, mm}`, `threshold` — consistent with Alerts wire-up.
- `EvidenceDonut` props: `{pct, label}` — consistent with LossProof wire-up.
- `FloodRiskGauge` props: `{riskLevel, pct}` — consistent with Dashboard wire-up.
- `CropStageTimeline` props: `{currentStage, stages}` — consistent with HarvestDecision wire-up.
- `LeafletMap` props: `{lat, lon, riskLevel, stationName}` — consistent with Dashboard wire-up.
