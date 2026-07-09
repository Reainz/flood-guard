import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfidenceMeter } from "../ConfidenceMeter.jsx";

describe("ConfidenceMeter", () => {
  it("renders the rounded percentage", () => {
    render(<ConfidenceMeter value={82.4} />);
    expect(screen.getByText("82")).toBeInTheDocument();
  });

  it("renders an SVG element", () => {
    const { container } = render(<ConfidenceMeter value={50} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("clamps values above 100", () => {
    render(<ConfidenceMeter value={150} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("clamps values below 0 and draws no arc", () => {
    const { container } = render(<ConfidenceMeter value={-20} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(container.querySelector(".confidence-meter-arc")).toBeNull();
  });

  it("treats a non-numeric value as zero", () => {
    render(<ConfidenceMeter value={undefined} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("draws an arc at full value rather than collapsing to an empty path", () => {
    const { container } = render(<ConfidenceMeter value={100} />);
    const arc = container.querySelector(".confidence-meter-arc");
    expect(arc).not.toBeNull();
    expect(arc.getAttribute("d")).not.toBe("");
  });

  it("uses the caption as an uppercase label when provided", () => {
    render(<ConfidenceMeter value={60} caption="confidence" />);
    expect(screen.getByText("CONFIDENCE")).toBeInTheDocument();
  });

  it("exposes an accessible label", () => {
    render(<ConfidenceMeter value={60} ariaLabel="Match score 60 percent" />);
    expect(screen.getByRole("img", { name: "Match score 60 percent" })).toBeInTheDocument();
  });
});
