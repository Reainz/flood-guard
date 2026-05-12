import { describe, it, expect } from "vitest";
import { polarToCartesian, describeArc } from "../svgUtils.js";

describe("polarToCartesian", () => {
  it("angle 270 maps to left of center (gauge start)", () => {
    const pt = polarToCartesian(100, 100, 80, 270);
    expect(pt.x).toBeCloseTo(20, 0);
    expect(pt.y).toBeCloseTo(100, 0);
  });

  it("angle 360 maps to top of circle", () => {
    const pt = polarToCartesian(100, 100, 80, 360);
    expect(pt.x).toBeCloseTo(100, 0);
    expect(pt.y).toBeCloseTo(20, 0);
  });

  it("angle 90 maps to right of center (gauge end)", () => {
    const pt = polarToCartesian(100, 100, 80, 90);
    expect(pt.x).toBeCloseTo(180, 0);
    expect(pt.y).toBeCloseTo(100, 0);
  });
});

describe("describeArc", () => {
  it("returns a string starting with M", () => {
    const d = describeArc(100, 100, 80, 270, 450);
    expect(d).toMatch(/^M /);
  });

  it("contains an A (arc) segment", () => {
    const d = describeArc(100, 100, 80, 270, 450);
    expect(d).toContain(" A ");
  });
});

describe("describeArc edge cases", () => {
  it("produces a non-empty path at exactly 180 degrees", () => {
    const d = describeArc(100, 100, 80, 270, 450);
    expect(d).toContain("1 1");
  });

  it("returns empty string when startAngle equals endAngle", () => {
    const d = describeArc(100, 100, 80, 270, 270);
    expect(d).toBe("");
  });
});
