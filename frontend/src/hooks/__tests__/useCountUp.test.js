import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCountUp } from "../useCountUp.js";

describe("useCountUp", () => {
  it("starts at 0", () => {
    const { result } = renderHook(() => useCountUp(50, 0));
    expect(typeof result.current).toBe("number");
  });

  it("returns a number", () => {
    const { result } = renderHook(() => useCountUp(75, 100));
    expect(typeof result.current).toBe("number");
    expect(result.current).toBeGreaterThanOrEqual(0);
    expect(result.current).toBeLessThanOrEqual(75);
  });
});
