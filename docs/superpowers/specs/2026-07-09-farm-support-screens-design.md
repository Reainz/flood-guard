# Farm Support Screens — UI/UX Design

Date: 2026-07-09
Status: Approved

## Purpose

FloodGuard today ships four screens, all oriented around a flood event. This pass
widens the product into a full rice-farming support app by adding five screens that
cover the crop lifecycle from variety selection through harvest and record-keeping.

**All five new screens are visual placeholders.** They render mock data from
`frontend/src/mocks/`. They make no API calls, save nothing, and validate nothing.
The goal is that a reviewer can click through nine features and understand the whole
product vision, while the four existing API-backed screens keep working untouched.

## Scope

### In scope

| Screen | Section | Status |
|--------|---------|--------|
| Disease Detection | Field | New, mocked |
| Harvest Timing | Crop | New, mocked |
| Yield Prediction | Crop | New, mocked |
| Variety Advisor | Crop | New, mocked |
| Activity Log | Records | New, mocked |

Plus: navigation restructure in `App.jsx`, one surgical edit to `HarvestDecision.jsx`,
three new SVG chart components, a new stylesheet, and i18n keys in all three locales.

### Out of scope

- Any backend module, endpoint, or change to `services/api.js`.
- Any change to `backend/`, `scripts/`, or `tests/` (Python).
- Persistence of any kind. No `localStorage`, no `AsyncStorage`.
- Form validation on the new screens.

### Deliberate deviations from the original request

The request assumed five features already existed (disease detection, weather
tracking, yield loss prediction, growth stage tracker, government form submission).
Only four of those are present, folded into flood-response screens. Disease detection
does not exist at all. Two decisions follow:

1. **Disease Detection is built as a fifth mocked screen** so the click-through covers
   nine features. It is a placeholder despite the request describing it as
   API-integrated.
2. **Overlapping concepts are retired from `HarvestDecision.jsx`** so each concept
   lives in exactly one place. This modifies working code, which sits outside a
   strict "UI-only" constraint, and was approved explicitly.

## Information architecture

Nine screens, four bottom-nav sections. `Alerts` stays top-level: it is time-critical
and carries the unread badge.

```
Field    ─┬─ Dashboard            (existing, API-backed)
          └─ Disease Detection    (new, mocked)

Crop     ─┬─ Harvest Timing       (new, mocked)
          ├─ Flood Scenarios      (existing HarvestDecision, API-backed)
          ├─ Yield Prediction     (new, mocked)
          └─ Variety Advisor      (new, mocked)

Records  ─┬─ Activity Log         (new, mocked)
          └─ Loss Proof           (existing, API-backed)

Alerts   ─── Alerts               (existing, API-backed)
```

Selecting a section reveals a segmented sub-navigation above the content surface.
Each section remembers its last-viewed screen. Sections with one screen (`Alerts`)
render no sub-nav.

On desktop, the existing top nav in `App.jsx` expands to show all nine screens as a
grouped list. The bottom nav is already mobile-only via CSS, so the segmented control
is the mobile affordance and the grouped top nav is the desktop one.

### Retiring the overlap

`HarvestDecision.jsx` is renamed *Flood Scenarios* in the UI (file name unchanged).
It keeps its three-scenario loss comparison, the `LossBarChart`, and the compensation
figures — that is its actual job and it is API-backed.

The `CropStageTimeline` growth-stage block and its surrounding "Growth stage progress"
markup move out of it and become the anchor of the new Harvest Timing screen, where
stage-versus-timing is the entire point. The compensation half of that card stays.

No change to `services/api.js`. `npm test` runs clean afterward.

## Code structure

```
frontend/src/
├── mocks/                      NEW — one module per mocked feature
│   ├── disease.js
│   ├── harvestTiming.js
│   ├── yieldPrediction.js
│   ├── variety.js
│   └── activityLog.js
├── screens/
│   ├── DiseaseDetection.jsx    NEW
│   ├── HarvestTiming.jsx       NEW
│   ├── YieldPrediction.jsx     NEW
│   ├── VarietyAdvisor.jsx      NEW
│   ├── ActivityLog.jsx         NEW
│   └── HarvestDecision.jsx     EDIT — growth-stage block removed
├── components/
│   ├── SharedUI.jsx            EDIT — add SectionTabs
│   └── charts/
│       ├── HarvestWindowBar.jsx    NEW
│       ├── YieldRangeChart.jsx     NEW
│       └── ConfidenceMeter.jsx     NEW
├── styles/
│   └── features.css            NEW — styles for the five new screens
├── styles.css                  EDIT — @import features.css, extend reduced-motion
├── App.jsx                     EDIT — section/screen navigation
└── i18n/{vi,en,mm}.json        EDIT — new keys
```

Mock data lives in `mocks/`, deliberately **not** behind `api.js`. This keeps the
`frontend/AGENTS.md` rule "screens never call fetch() directly" literally true, and a
reviewer opening `mocks/` sees at once which features are placeholders.

`styles.css` is already 1,638 lines. It keeps ownership of tokens, shell, nav, and
shared primitives. The five new screens get `styles/features.css`, `@import`ed at the
top of `styles.css`. No token duplication — everything draws from the existing custom
properties (`--green`, `--yellow`, `--amber`, `--red`, `--blue`, `--surface*`,
`--text*`, `--border*`).

Every user-facing string routes through `t()` with keys added to `vi.json`, `en.json`,
and `mm.json`, per the non-negotiable rule in the root `AGENTS.md`.

## Screen designs

### Disease Detection (Field)

A dashed-border dropzone with a camera icon invites a leaf photo. Tapping it swaps in
a bundled sample paddy image and, after a staged ~900 ms skeleton shimmer, reveals the
result.

The result card carries a colored left rail keyed to severity: **leaf blast, 87 %
confidence**. A `ConfidenceMeter` arc sits beside the disease name. Three collapsible
treatment steps sit below. Under the card, a "recently detected in An Giang" strip of
three thumbnail chips.

The staged reveal is what makes it read as AI. There is no model.

### Harvest Timing (Crop)

Hero is a `HarvestWindowBar`: a horizontal 30-day track with a soft green band
spanning the recommended window (18–24 March), a "today" ticker, and amber hatching
where flood risk overlaps the tail of the window.

Beneath it, the `CropStageTimeline` relocated from `HarvestDecision.jsx`, showing the
current stage as the reason for the window.

Then the recommendation card: *"Harvest between 18–24 March"*, **82 % confidence**, a
two-line rationale, and three factor chips — grain moisture, forecast rainfall, stage
maturity — each with a small bar. A "Recalculate" button spins for ~800 ms and
resolves to the same answer: alive, but honest about being a placeholder.

### Yield Prediction (Crop)

Three `MetricCard`s across the top: estimated yield **6.2 t/ha**, total **14.9 t**,
versus last season **+8 %**.

Below, a `YieldRangeChart` — an area chart across the season with a translucent
confidence band that widens toward harvest, and a dashed projection tail.

Below that, a four-row breakdown by field plot with inline sparkline-style bars.

Sample data describes a 2.4 ha An Giang holding, consistent with the values already
hardcoded in `HarvestDecision`'s `initialForm`.

### Variety Advisor (Crop)

A three-step guided flow with a slim progress rail:

1. **Soil type** — four illustrated radio cards: alluvial, acid sulfate, saline, sandy.
2. **Region and season** — two selects.
3. **Priority** — a segmented pick between yield, flood tolerance, market price.

Each step slides in horizontally. The result is a variety card — **OM5451** — with a
match-score ring, a two-sentence description, four attribute bars, and two runner-up
varieties collapsed beneath. "Start over" resets to step one.

The flow always reaches OM5451 regardless of inputs.

### Activity Log (Records)

A vertical timeline with a continuous rail down the left edge, grouped by date. Each
entry is a card with a type-colored icon node on the rail:

| Type | Color token |
|------|-------------|
| Disease | `--red` |
| Growth | `--green` |
| Expense | `--amber` |
| Note | `--blue` |

Expense entries show a right-aligned VND figure; the date-group header carries a
running total.

A floating action button opens a bottom sheet: type picker as icon chips, date field,
note textarea, and an expense-amount field that appears only for expense entries.
Saving closes the sheet and prepends the entry with a brief highlight flash.

That prepend is local component state. Nothing persists across reload, which keeps the
demo satisfying without pretending to be a backend.

## Motion and states

- Section switches cross-fade the content surface at 160 ms.
- Sub-nav segments slide an active pill.
- Cards on first paint stagger up 8 px over 240 ms with a 40 ms step. The existing
  `.screen-stack > *` `fg-fade-up` rule already does this; new screens reuse it.
- Every mocked "computation" runs `SkeletonBlock` for 600–900 ms before revealing.
  Never a spinner — this matches the `frontend/AGENTS.md` rule that loading shows
  skeletons.
- `useCountUp` drives every headline number.

`styles.css` already has a `prefers-reduced-motion: reduce` block, but it is a narrow
allowlist naming four specific selectors. It gets extended to cover the new animations
rather than left to silently miss them.

## Accessibility

- Sub-nav uses `role="tablist"` / `role="tab"` / `aria-selected`, matching the existing
  bottom nav.
- The dropzone is a `<button>`, not a `<div>` with a click handler.
- The bottom sheet traps focus and closes on `Escape`.
- Timeline entries are a `<ol>`, not a stack of `<div>`s.
- Color is never the sole carrier of meaning: every severity and entry type also
  carries an icon and a text label.

## Testing

The three new chart components get unit tests in `components/charts/__tests__/`,
matching the existing pattern (render, assert on SVG output, assert on edge cases such
as empty data and out-of-range values).

Screens are not unit-tested. They are placeholders with no logic worth asserting on,
and tests over mock data would test the mock.

Verification is `npm test` clean plus a manual click-through of all nine screens in
both themes, all three locales, and at 360 px width.

## Risks

- **Nine screens is a lot of navigation for a phone.** Mitigated by the four-section
  grouping; the risk is that section names are not self-evident to a farmer. Names are
  in the locale files and cheap to change.
- **Mocked screens sitting beside live ones may mislead.** Mitigated by keeping mock
  data in a visibly separate `mocks/` directory rather than behind `api.js`.
- **`HarvestDecision.jsx` edit touches tested code.** Mitigated by keeping the edit to
  JSX removal only, and running `npm test` after.
