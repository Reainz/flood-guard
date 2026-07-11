/**
 * The farmer's own profile, captured once during onboarding and reused as
 * form defaults across screens (Harvest Decision, Loss Proof, the nav
 * location pill) instead of asking for the same details repeatedly.
 *
 * Same shape as `services/dataSource.js`: a plain module holding state,
 * persisted to `localStorage`, not React state — so any screen can read it
 * without a provider.
 */

const PROFILE_KEY = "fg_profile";
const ONBOARDED_KEY = "fg_onboarded";

export const DEFAULT_PROFILE = {
  farmerName: "",
  fieldId: "",
  fieldArea: 2.4,
  cropType: "rice",
  plantingDate: "",
  province: "",
  lat: null,
  lon: null,
};

function read() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

let current = read();

export function getProfile() {
  return current;
}

export function saveProfile(partial) {
  current = { ...current, ...partial };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(current));
  } catch {
    // Non-fatal: the profile still applies for this session.
  }
  return current;
}

export function isOnboarded() {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "true";
  } catch {
    return false;
  }
}

export function completeOnboarding(profile) {
  saveProfile(profile);
  try {
    localStorage.setItem(ONBOARDED_KEY, "true");
  } catch {
    // Non-fatal: onboarding still completes for this session.
  }
}

export function restartOnboarding() {
  try {
    localStorage.setItem(ONBOARDED_KEY, "false");
  } catch {
    // Non-fatal.
  }
}
