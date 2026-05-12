import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

vi.mock("leaflet", () => ({
  default: {
    map: () => ({ setView: () => ({ remove: vi.fn() }), remove: vi.fn() }),
    tileLayer: () => ({ addTo: vi.fn() }),
    circle: () => ({ addTo: vi.fn() }),
    marker: () => ({ bindPopup: () => ({ addTo: vi.fn() }) }),
    divIcon: () => ({}),
  },
}));

import LeafletMap from "../LeafletMap.jsx";

describe("LeafletMap", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders a container div", () => {
    const { container } = render(
      <LeafletMap lat={10.52} lon={105.12} riskLevel="LOW" stationName="Tân Châu" />
    );
    expect(container.querySelector("div")).not.toBeNull();
  });
});
