import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const STORAGE_KEY = "fg_data_source";

// The module caches the stored value at import time, so each test needs a fresh copy.
async function loadFresh() {
  vi.resetModules();
  return import("../dataSource.js");
}

describe("dataSource", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("defaults to demo when nothing is stored", async () => {
    const { getDataSource, isDemoMode, DEMO } = await loadFresh();
    expect(getDataSource()).toBe(DEMO);
    expect(isDemoMode()).toBe(true);
  });

  it("restores a stored live preference", async () => {
    localStorage.setItem(STORAGE_KEY, "live");
    const { getDataSource, isDemoMode, LIVE } = await loadFresh();
    expect(getDataSource()).toBe(LIVE);
    expect(isDemoMode()).toBe(false);
  });

  it("falls back to demo for an unrecognised stored value", async () => {
    localStorage.setItem(STORAGE_KEY, "banana");
    const { getDataSource, DEMO } = await loadFresh();
    expect(getDataSource()).toBe(DEMO);
  });

  it("persists a change and reflects it immediately", async () => {
    const { setDataSource, getDataSource, LIVE } = await loadFresh();
    setDataSource(LIVE);
    expect(getDataSource()).toBe(LIVE);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("live");
  });

  it("coerces any non-live value to demo", async () => {
    const { setDataSource, DEMO } = await loadFresh();
    expect(setDataSource("nonsense")).toBe(DEMO);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("demo");
  });

  it("still applies the mode when localStorage throws", async () => {
    const { setDataSource, getDataSource, LIVE } = await loadFresh();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("private browsing");
    });
    expect(() => setDataSource(LIVE)).not.toThrow();
    expect(getDataSource()).toBe(LIVE);
  });
});
