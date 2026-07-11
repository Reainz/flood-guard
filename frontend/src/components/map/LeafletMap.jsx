import { useEffect, useRef } from "react";

let L;

async function getLeaflet() {
  if (L) return L;
  L = await import("leaflet");
  await import("leaflet/dist/leaflet.css");
  return L;
}

const RISK_COLORS = { LOW: "#00C97B", MODERATE: "#D97706", HIGH: "#DC2626", CRITICAL: "#7F1D1D" };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}

export default function LeafletMap({ lat, lon, riskLevel, stationName, label = "Your field" }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getLeaflet().then((leaflet) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = leaflet.map(containerRef.current, { zoomControl: false })
                         .setView([lat, lon], 12);
      leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      const color = RISK_COLORS[riskLevel] || RISK_COLORS.MODERATE;
      leaflet.circle([lat, lon], { radius: 2500, color, fillColor: color, fillOpacity: 0.18, weight: 2 }).addTo(map);

      const icon = leaflet.divIcon({
        html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
        iconSize: [12, 12],
        className: "",
      });
      leaflet.marker([lat, lon], { icon })
             .bindPopup(`<strong>${escapeHtml(label)}</strong><br>${escapeHtml(stationName || "")}`)
             .addTo(map);

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [lat, lon, riskLevel, stationName, label]);

  return <div ref={containerRef} style={{ height: 200, borderRadius: 12, overflow: "hidden" }} />;
}
