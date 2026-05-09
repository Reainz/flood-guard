import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LossBarChart } from "../LossBarChart.jsx";

const scenarios = [
  { label: "harvest_now", labelShort: "Now", loss_pct: 15, is_recommended: true,  color: "#00C97B" },
  { label: "wait",         labelShort: "Wait", loss_pct: 72, is_recommended: false, color: "#D97706" },
  { label: "harvest_after",labelShort: "After",loss_pct: 38, is_recommended: false, color: "#2563EB" },
];

describe("LossBarChart", () => {
  it("renders all three scenario labels", () => {
    render(<LossBarChart scenarios={scenarios} />);
    expect(screen.getByText("Now")).toBeInTheDocument();
    expect(screen.getByText("Wait")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
  });

  it("shows all three loss percentages", () => {
    render(<LossBarChart scenarios={scenarios} />);
    expect(screen.getByText("15%")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText("38%")).toBeInTheDocument();
  });

  it("shows the recommended badge on the winning scenario", () => {
    render(<LossBarChart scenarios={scenarios} />);
    expect(screen.getByText("✓ Recommended")).toBeInTheDocument();
  });
});
