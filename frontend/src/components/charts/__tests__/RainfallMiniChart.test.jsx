import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RainfallMiniChart } from "../RainfallMiniChart.jsx";

const data = [
  { label: "T2", mm: 40 },
  { label: "T3", mm: 55 },
  { label: "T4", mm: 70 },
  { label: "T5", mm: 90 },
  { label: "T6", mm: 100 },
  { label: "T7", mm: 65 },
  { label: "CN", mm: 45 },
];

describe("RainfallMiniChart", () => {
  it("renders all day labels", () => {
    render(<RainfallMiniChart data={data} />);
    expect(screen.getByText("T2")).toBeInTheDocument();
    expect(screen.getByText("CN")).toBeInTheDocument();
  });

  it("renders an SVG bar for each data point", () => {
    const { container } = render(<RainfallMiniChart data={data} />);
    const bars = container.querySelectorAll(".rainfall-svg-bar");
    expect(bars).toHaveLength(data.length);
  });
});
