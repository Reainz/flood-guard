import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// api.js reads the mode through dataSource.js, which caches it at import time.
// Set the stored preference before importing either module.
async function loadWithMode(mode) {
  localStorage.clear();
  localStorage.setItem("fg_data_source", mode);
  vi.resetModules();
  return import("../api.js");
}

describe("api.js in demo mode", () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function resolveWithTimers(promise) {
    await vi.runAllTimersAsync();
    return promise;
  }

  it("never calls fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { getFloodStatus } = await loadWithMode("demo");

    await resolveWithTimers(getFloodStatus());

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns a demo payload marked as mock, not as a failure", async () => {
    const { getAlertStatus } = await loadWithMode("demo");

    const payload = await resolveWithTimers(getAlertStatus());

    expect(payload.mock).toBe(true);
    // `demo` means "the backend failed and we coped" — nothing failed here, and
    // the screens key their warning banners off `demo` and `fromCache`.
    expect(payload.demo).toBeUndefined();
    expect(payload.fromCache).toBe(false);
    expect(payload.data.tier).toBe("WARNING");
  });

  it("ignores a cache entry left behind by a previous live session", async () => {
    localStorage.clear();
    localStorage.setItem("fg_data_source", "demo");
    localStorage.setItem(
      "fg_cache__alerts",
      JSON.stringify({ data: { tier: "CRITICAL" }, updatedAt: "2020-01-01", fromCache: false }),
    );
    vi.resetModules();
    const { getAlertStatus } = await import("../api.js");

    const payload = await resolveWithTimers(getAlertStatus());

    expect(payload.data.tier).toBe("WARNING");
    expect(payload.fromCache).toBe(false);
  });

  it("does not write to the response cache", async () => {
    const { getFloodStatus } = await loadWithMode("demo");

    await resolveWithTimers(getFloodStatus());

    const cacheKeys = Object.keys(localStorage).filter((key) => key.startsWith("fg_cache_"));
    expect(cacheKeys).toEqual([]);
  });

  it("passes the request payload through to the demo factory", async () => {
    const { postHarvestDecision } = await loadWithMode("demo");

    const payload = await resolveWithTimers(
      postHarvestDecision({
        crop_type: "vegetables",
        predicted_flood_depth_cm: 65,
        days_to_flood: 3,
        field_area_ha: 2.4,
      }),
    );

    expect(payload.data.crop_type).toBe("vegetables");
    expect(payload.data.scenarios).toHaveLength(3);
    expect(payload.data.scenarios.filter((s) => s.is_recommended)).toHaveLength(1);
  });
});

describe("api.js in live mode", () => {
  afterEach(() => vi.restoreAllMocks());

  it("calls fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ tier: "WATCH" }),
    });
    const { getAlertStatus } = await loadWithMode("live");

    const payload = await getAlertStatus();

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(payload.data.tier).toBe("WATCH");
    expect(payload.mock).toBeUndefined();
  });

  it("still falls back to a demo payload when the backend is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));
    const { getAlertStatus } = await loadWithMode("live");

    const payload = await getAlertStatus();

    expect(payload.demo).toBe(true);
    expect(payload.data.tier).toBe("WARNING");
  });
});
