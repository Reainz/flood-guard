# Frontend Agent Guide

Read `../../AGENTS.md` first (root table of contents).
This file covers frontend-specific rules only.

## Stack

- React Native (Expo) for mobile
- OR mobile-responsive React web app (fallback if Expo setup time is tight)
- `services/api.js` — all backend calls live here, screens never call fetch() directly
- `i18n/vi.json` — all user-facing Vietnamese strings

## Screen inventory

| Screen | File | Purpose |
|--------|------|---------|
| Dashboard | `screens/Dashboard.jsx` | Flood status, countdown, river levels, map |
| Harvest Decision | `screens/HarvestDecision.jsx` | Crop inputs + 3-scenario comparison |
| Alerts | `screens/Alerts.jsx` | Active alerts + crop recommendations |
| Loss Proof | `screens/LossProof.jsx` | Photo capture + damage form + compensation |

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
2. Add any new strings to `i18n/vi.json`
3. Add the route to `App.jsx` navigation
4. Add any new API calls to `services/api.js`
5. Write a Storybook story if time permits

## Testing

```bash
npm test                    # Jest unit tests
npm run test:e2e            # Detox (if configured)
```
