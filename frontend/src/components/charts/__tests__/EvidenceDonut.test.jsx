import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvidenceDonut } from "../EvidenceDonut.jsx";

describe("EvidenceDonut", () => {
  it("renders the percentage as text", () => {
    render(<EvidenceDonut pct={72} />);
    expect(screen.getByText("72%")).toBeInTheDocument();
  });

  it("renders an SVG", () => {
    const { container } = render(<EvidenceDonut pct={50} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("clamps pct to 0–100", () => {
    render(<EvidenceDonut pct={120} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
