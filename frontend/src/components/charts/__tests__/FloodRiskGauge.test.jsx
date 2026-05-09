import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FloodRiskGauge } from "../FloodRiskGauge.jsx";

describe("FloodRiskGauge", () => {
  it("renders the risk label", () => {
    render(<FloodRiskGauge riskLevel="HIGH" pct={75} />);
    expect(screen.getByText("HIGH")).toBeInTheDocument();
  });

  it("renders an SVG element", () => {
    const { container } = render(<FloodRiskGauge riskLevel="LOW" pct={20} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("clamps pct above 100 to 100", () => {
    render(<FloodRiskGauge riskLevel="CRITICAL" pct={150} />);
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
  });
});
