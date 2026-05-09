import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CropStageTimeline } from "../CropStageTimeline.jsx";

const STAGES = ["seedling", "tillering", "panicle_initiation", "booting", "heading", "grain_filling", "maturity"];

describe("CropStageTimeline", () => {
  it("renders all 7 stage dots", () => {
    const { container } = render(<CropStageTimeline currentStage="grain_filling" stages={STAGES} />);
    const dots = container.querySelectorAll(".stage-dot");
    expect(dots).toHaveLength(7);
  });

  it("marks the active stage", () => {
    render(<CropStageTimeline currentStage="grain_filling" stages={STAGES} />);
    expect(screen.getByText("grain_filling").closest(".stage-dot-wrap")).toHaveClass("active");
  });

  it("marks past stages as completed", () => {
    const { container } = render(<CropStageTimeline currentStage="heading" stages={STAGES} />);
    const completed = container.querySelectorAll(".stage-dot.completed");
    expect(completed.length).toBeGreaterThan(0);
  });
});
