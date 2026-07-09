import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HarvestWindowBar } from "../HarvestWindowBar.jsx";

const baseProps = {
  trackStartDay: 1,
  trackDays: 30,
  todayDay: 11,
  windowStartDay: 18,
  windowEndDay: 24,
  windowLabel: "18–24",
};

describe("HarvestWindowBar", () => {
  it("renders an SVG element", () => {
    const { container } = render(<HarvestWindowBar {...baseProps} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders the window label inside the band", () => {
    render(<HarvestWindowBar {...baseProps} />);
    expect(screen.getByText("18–24")).toBeInTheDocument();
  });

  it("draws the recommended window band", () => {
    const { container } = render(<HarvestWindowBar {...baseProps} />);
    expect(container.querySelector(".harvest-window-band")).not.toBeNull();
  });

  it("sizes the band to the inclusive day span", () => {
    const { container } = render(<HarvestWindowBar {...baseProps} />);
    const band = container.querySelector(".harvest-window-band");
    // 7 of 30 days across a 292px track.
    const expected = (7 / 30) * 292;
    expect(Number(band.getAttribute("width"))).toBeCloseTo(expected, 1);
  });

  it("omits the today marker when no day is given", () => {
    const { container } = render(<HarvestWindowBar {...baseProps} todayDay={undefined} />);
    expect(container.querySelector(".harvest-window-today")).toBeNull();
  });

  it("draws the today marker when a day is given", () => {
    const { container } = render(<HarvestWindowBar {...baseProps} todayLabel="Today" />);
    expect(container.querySelector(".harvest-window-today")).not.toBeNull();
    expect(screen.getByText("TODAY")).toBeInTheDocument();
  });

  it("clamps a window that runs past the end of the track", () => {
    const { container } = render(
      <HarvestWindowBar {...baseProps} windowStartDay={28} windowEndDay={45} />,
    );
    const band = container.querySelector(".harvest-window-band");
    // Days 28-30 survive; day 45 is clamped back to the track's right edge.
    const expected = (3 / 30) * 292;
    expect(Number(band.getAttribute("width"))).toBeCloseTo(expected, 1);
  });

  it("omits the flood hatch when no flood span is given", () => {
    const { container } = render(<HarvestWindowBar {...baseProps} floodRiskLabel="Flood risk" />);
    expect(screen.queryByText("Flood risk")).toBeNull();
  });

  it("labels the flood span when one is given", () => {
    render(
      <HarvestWindowBar
        {...baseProps}
        floodRiskStartDay={22}
        floodRiskEndDay={30}
        floodRiskLabel="Flood risk"
      />,
    );
    expect(screen.getByText("Flood risk")).toBeInTheDocument();
  });
});
