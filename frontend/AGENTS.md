# Frontend Agent Guide

Read `../../AGENTS.md` first (root table of contents).
This file covers frontend-specific rules only.

## Stack

- React Native (Expo) for mobile
- OR mobile-responsive React web app (fallback if Expo setup time is tight)
- `services/api.js` — all backend calls live here, screens never call fetch() directly
- `i18n/vi.json` — all user-facing Vietnamese strings

## Screen inventory

Nine screens across four navigation sections. `App.jsx` owns the section → screen map.

| Section | Screen | File | Backed by |
|---------|--------|------|-----------|
| Field | Dashboard | `screens/Dashboard.jsx` | API — flood status, countdown, river levels, map |
| Field | Disease Detection | `screens/DiseaseDetection.jsx` | **Mock** — `mocks/disease.js` |
| Crop | Harvest Timing | `screens/HarvestTiming.jsx` | **Mock** — `mocks/harvestTiming.js` |
| Crop | Flood Scenarios | `screens/HarvestDecision.jsx` | API — crop inputs + 3-scenario comparison |
| Crop | Yield Prediction | `screens/YieldPrediction.jsx` | **Mock** — `mocks/yieldPrediction.js` |
| Crop | Variety Advisor | `screens/VarietyAdvisor.jsx` | **Mock** — `mocks/variety.js` |
| Records | Activity Log | `screens/ActivityLog.jsx` | **Mock** — `mocks/activityLog.js` |
| Records | Loss Proof | `screens/LossProof.jsx` | API — photo capture + damage form + compensation |
| Alerts | Alerts | `screens/Alerts.jsx` | API — active alerts + crop recommendations |

## Data source: demo vs live

`services/dataSource.js` holds an app-wide mode, persisted to `localStorage` under
`fg_data_source`. The pill in the nav toggles it.

- **`demo`** (the default) — `requestJson` returns the demo payloads in `api.js`
  directly, after a 550 ms delay so skeleton loaders still appear. No `fetch`, no
  read or write of the response cache. Nothing can fail, which is the point: the app
  presents without a backend.
- **`live`** — the original path. Hit the backend, fall back to the response cache,
  then to the demo payload, exactly as before.

The mode lives in a plain module, not React state: `api.js` sits below the UI layer
and may not import from it. Flipping the mode remounts the active screen (`App.jsx`
keys on it), which makes the screen refetch.

Two flags distinguish the cases, and screens must keep treating them differently:

| Flag | Meaning | Screen shows |
|------|---------|--------------|
| `mock: true` | Demo mode. Nothing failed. | no banner |
| `demo: true` | Live mode, backend unreachable, coped. | "backend not responding" banner |
| `fromCache: true` | Live mode, served from the last good response. | stale-data banner |

Adding an endpoint means adding its demo payload factory too, otherwise it throws in
demo mode. That is deliberate — a screen that cannot be demoed should fail loudly.

## Placeholder screens

Five screens are visual placeholders: they read from `src/mocks/`, never call the API,
and save nothing. Mock data lives in `mocks/` rather than behind `services/api.js` so
the "no direct fetch" rule stays literally true and it is obvious which screens are
not yet real. See `src/mocks/README.md`.

When one of these gains a backend, move its data behind `services/api.js` and delete
its mock module. Do not add mock data to `api.js`.

## Styles

- `styles.css` — design tokens, app shell, nav, shared primitives
- `styles/features.css` — the five placeholder screens and the section sub-nav

`App.jsx` imports `features.css` **after** `styles.css` so its card variants can
override the `.card` base rule. Keep that order.

## UI rules

- **No hardcoded Vietnamese strings** — use `t('key')` from i18n, key lives in `vi.json`
- **No calculations in JSX** — call `api.js` and render the result
- **No direct fetch()** — always go through `services/api.js`
- Loss percentages display as integers only (`round()` before display)
- Compensation amounts display as `X.X triệu VND` format
- AQI/flood severity use colour: green=safe, amber=moderate, red=high, dark red=critical

## Offline behaviour

Every screen must handle two states:
1. `loading` — show skeleton loaders, not spinners
2. `offline` — show last cached data with a `"Dữ liệu cũ — cập nhật lần cuối: X"` banner

Use `AsyncStorage` (RN) or `localStorage` (web) to cache the last successful
API response for each screen. Cache key format: `fg_cache_<endpoint>`.

## Expo-specific rules

```jsx
// GPS location
import * as Location from 'expo-location';
await Location.requestForegroundPermissionsAsync();

// Camera / photo
import * as ImagePicker from 'expo-image-picker';
launchCameraAsync({ exif: true, quality: 0.7 })  // exif: true = GPS in metadata
```

Never use `react-native-camera` — Expo SDK only.

## Performance

- Images compressed to 0.7 quality before upload
- Lazy load screens not shown on first render
- Map tiles cached by Leaflet automatically — no extra work needed

## Adding a new screen

1. Create `screens/NewScreen.jsx`
2. Add any new strings to `i18n/vi.json`, `en.json`, **and** `mm.json` — all three stay in sync
3. Register the screen in `SCREENS` and add its key to a section in `SECTIONS` (`App.jsx`)
4. Add a `screens.<key>` label to each locale file
5. Add any new API calls to `services/api.js`
6. Write a Storybook story if time permits

## Testing

```bash
npm test                    # Jest unit tests
npm run test:e2e            # Detox (if configured)
```
