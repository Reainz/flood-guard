const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 4000;

export function apiUrl(path) {
  return `${BASE_URL}${path}`;
}

async function requestJson(endpoint, options = {}, fallbackFactory = null) {
  const cacheKey = `fg_cache_${endpoint.replace(/[^a-z0-9]/gi, "_")}`;
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, signal: controller.signal })
      .finally(() => window.clearTimeout(timeout));
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    const payload = { data, updatedAt: new Date().toISOString(), fromCache: false };
    localStorage.setItem(cacheKey, JSON.stringify(payload));
    return payload;
  } catch (error) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const payload = JSON.parse(cached);
      return { ...payload, fromCache: true, error };
    }
    if (fallbackFactory) {
      return {
        data: fallbackFactory(),
        updatedAt: new Date().toISOString(),
        fromCache: false,
        demo: true,
        error,
      };
    }
    throw error;
  }
}

export function getFloodStatus(params = { lat: 10.52, lon: 105.12 }) {
  const search = new URLSearchParams(params).toString();
  return requestJson(`/flood-status?${search}`, {}, demoFloodStatus);
}

export function getAlertStatus() {
  return requestJson("/alerts", {}, demoAlertStatus);
}

export function postHarvestDecision(payload) {
  return requestJson("/harvest-decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, () => demoHarvestDecision(payload));
}

export function postLossReport(formData) {
  return requestJson("/loss-report", {
    method: "POST",
    body: formData,
  }, () => demoLossReport(formData));
}

function demoFloodStatus() {
  return {
    river: {
      station: "Tan Chau",
      current_level_m: 3.82,
      trend: "rising",
      rise_rate_cm_per_hr: 7.5,
      alert_level_m: 3.5,
      danger_level_m: 4.5,
      status: "ALERT",
      updated: new Date().toISOString(),
    },
    prediction: {
      risk_level: "HIGH",
      hours_to_arrival: 71,
      predicted_depth_cm: 65,
      predicted_duration_days: 5,
      confidence: "high",
      explanation: "",
    },
    forecast: [0, 6, 12, 18, 24].map((offset, index) => ({
      time: new Date(Date.now() + offset * 60 * 60 * 1000).toISOString(),
      rain_mm: [4.2, 8.7, 11.3, 6.1, 3.9][index],
      temp: 31,
      humidity: 82,
    })),
    cached: true,
    stale_reason: null,
    data_sources: ["Demo fallback", "Local cache unavailable"],
  };
}

function demoAlertStatus() {
  return {
    alert_id: `Tan Chau_WARNING_${new Date().toISOString().slice(0, 10)}`,
    tier: "WARNING",
    station: "Tan Chau",
    trigger_reasons: ["hours_to_arrival < 72", "river_status = ALERT"],
    dedupe_key: "demo",
    title: "",
    message: "",
    action_required: "",
    rainfall_tier: "WARNING",
    rainfall_forecast: [
      { label: "T2", mm: 40 },
      { label: "T3", mm: 55 },
      { label: "T4", mm: 70 },
      { label: "T5", mm: 90 },
      { label: "T6", mm: 100 },
      { label: "T7", mm: 65 },
      { label: "CN", mm: 45 },
    ],
    cached: true,
    stale_reason: null,
  };
}

function demoHarvestDecision(payload) {
  const depth = Number(payload.predicted_flood_depth_cm);
  const days = Number(payload.days_to_flood);
  const area = Number(payload.field_area_ha);
  const harvestNowLoss = Math.max(8, Math.min(38, 18 - Math.min(days, 10) + Math.round(depth / 20)));
  const waitLoss = Math.max(25, Math.min(85, 28 + Math.round(depth / 2)));
  const afterLoss = Math.max(20, Math.min(70, waitLoss - 14));
  const losses = { harvest_now: harvestNowLoss, wait: waitLoss, harvest_after: afterLoss };
  const recommended = Object.entries(losses).sort((left, right) => left[1] - right[1])[0][0];

  return {
    crop_type: payload.crop_type,
    growth_stage: "grain_filling",
    growth_stage_vi: "",
    days_to_harvest: 12,
    scenarios: ["harvest_now", "wait", "harvest_after"].map((label) => ({
      label,
      label_vi: "",
      loss_pct: losses[label],
      is_recommended: label === recommended,
      reasoning: "",
      action_steps: label === "harvest_now" ? [""] : [],
    })),
    recommended,
    compensation: {
      eligible: true,
      compensation_vnd: Math.round(area * 2000000 * (losses[recommended] / 100)),
      compensation_million_vnd: Number((area * 2 * (losses[recommended] / 100)).toFixed(1)),
      rate_vnd_per_ha: 2000000,
      legal_basis: "",
      submit_deadline_note: "",
    },
    data_sources: ["Demo fallback"],
  };
}

function demoLossReport(formData) {
  const fieldId = formData.get("field_id") || "AG-TCPU-2024-00847";
  const photos = formData.getAll("photos");
  return {
    report_id: `FG-${fieldId}-${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`,
    farmer_name: formData.get("farmer_name") || "",
    field_id: fieldId,
    compensation: {
      eligible: true,
      compensation_vnd: 6300000,
      compensation_million_vnd: 6.3,
      rate_vnd_per_ha: 4600000,
      legal_basis: "",
      submit_deadline_note: "",
    },
    evidence_completeness_pct: photos.length >= 2 ? 82 : 60,
    photos_accepted: photos.length,
    photo_metadata: photos.map((photo, index) => ({
      filename: photo.name || `photo-${index + 1}.jpg`,
      photo_type: index === 0 ? "before" : index === 1 ? "after" : "damage",
      content_type: photo.type || "image/jpeg",
      size_bytes: photo.size || 1,
      sha256: `demo-${index}-${photo.name || "photo"}`,
      timestamp: new Date().toISOString(),
      gps_source: "demo",
      path: "",
    })),
    required_documents: [],
    pdf_url: "",
    status: "pending_submission",
  };
}
