import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { YieldRangeChart } from "../YieldRangeChart.jsx";

const data = [
  { week: 1, actual: 0, low: 0, high: 0 },
  { week: 5, actual: 1.3, low: 1.1, high: 1.6 },
  { week: 9, actual: 3.8, low: 3.3, high: 4.3 },
  { week: 13, projected: 5.7, low: 4.7, high: 6.6 },
  { week: 15, projected: 6.2, low: 4.9, high: 7.3 },
];

describe("YieldRangeChart", () => {
  it("renders an SVG element", () => {
    const { container } = render(<YieldRangeChart data={data} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("draws the confidence band, the observed line, and the projected line", () => {
    const { container } = render(<YieldRangeChart data={data} projectionFromWeek={9} />);
    expect(container.querySelector(".yield-band")).not.toBeNull();
    expect(container.querySelector(".yield-line")).not.toBeNull();
    expect(container.querySelector(".yield-line-projected")).not.toBeNull();
  });

  it("anchors the projected line to the last observed point so the lines meet", () => {
    const { container } = render(<YieldRangeChart data={data} projectionFromWeek={9} />);
    const observed = container.querySelector(".yield-line").getAttribute("d");
    const projected = container.querySelector(".yield-line-projected").getAttribute("d");

    const lastObservedPoint = observed.split(/(?=[ML])/).pop().trim().slice(2);
    const firstProjectedPoint = projected.split(/(?=[ML])/)[0].trim().slice(2);
    expect(firstProjectedPoint).toBe(lastObservedPoint);
  });

  it("renders nothing plottable for a single point", () => {
    const { container } = render(<YieldRangeChart data={[{ week: 1, actual: 1, low: 0, high: 2 }]} />);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector(".is-empty")).not.toBeNull();
  });

  it("renders nothing plottable for empty data", () => {
    const { container } = render(<YieldRangeChart data={[]} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("labels the first and last week on the x axis", () => {
    render(<YieldRangeChart data={data} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("omits the projected line when no week carries a projection", () => {
    const observedOnly = data.filter((d) => Number.isFinite(d.actual));
    const { container } = render(<YieldRangeChart data={observedOnly} />);
    expect(container.querySelector(".yield-line-projected")).toBeNull();
  });

  it("exposes an accessible label", () => {
    render(<YieldRangeChart data={data} ariaLabel="Season yield trajectory" />);
    expect(screen.getByRole("img", { name: "Season yield trajectory" })).toBeInTheDocument();
  });
});
