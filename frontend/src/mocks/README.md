# Mock data

Every module in this directory backs a **placeholder screen**. None of it comes from
`services/api.js`, the backend, or any network call. It exists so the five newer
screens can be reviewed for layout, spacing, and interaction before the real
data sources are built.

| Module | Screen |
|--------|--------|
| `disease.js` | `screens/DiseaseDetection.jsx` |
| `harvestTiming.js` | `screens/HarvestTiming.jsx` |
| `yieldPrediction.js` | `screens/YieldPrediction.jsx` |
| `variety.js` | `screens/VarietyAdvisor.jsx` |
| `activityLog.js` | `screens/ActivityLog.jsx` |

Screens backed by the real backend — Dashboard, Flood Scenarios, Alerts, Loss Proof —
do not read from here. They go through `services/api.js`, as
`frontend/AGENTS.md` requires.

Numbers are chosen to be consistent with the 2.4 ha An Giang demo field used
throughout the rest of the app. Text that a user sees is **not** stored here; it lives
in `i18n/*.json` and is looked up by the keys these modules reference.
