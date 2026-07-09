/**
 * Where the API-backed screens get their data.
 *
 * `live`  — hit the backend, fall back to cache then to demo payloads on failure.
 * `demo`  — never touch the network. `services/api.js` returns its demo payloads
 *           directly, after a short delay so skeleton loaders still appear.
 *
 * Demo mode exists so the app can be presented without a running backend. It is
 * the default: an unset or unrecognised stored value resolves to `demo`, so a
 * fresh browser never opens onto a screen waiting on a 4-second fetch timeout.
 *
 * This is deliberately not React state. `api.js` sits below the UI layer and
 * cannot import from it, so the mode lives in a module the two share.
 */

const STORAGE_KEY = "fg_data_source";

export const LIVE = "live";
export const DEMO = "demo";

/** Latency the demo payloads pretend to have, so loading states are exercised. */
export const DEMO_LATENCY_MS = 550;

function read() {
  try {
    return localStorage.getItem(STORAGE_KEY) === LIVE ? LIVE : DEMO;
  } catch {
    // Private browsing can throw on localStorage access.
    return DEMO;
  }
}

let current = read();

export function getDataSource() {
  return current;
}

export function isDemoMode() {
  return current === DEMO;
}

export function setDataSource(mode) {
  current = mode === LIVE ? LIVE : DEMO;
  try {
    localStorage.setItem(STORAGE_KEY, current);
  } catch {
    // Non-fatal: the mode still applies for this session.
  }
  return current;
}
