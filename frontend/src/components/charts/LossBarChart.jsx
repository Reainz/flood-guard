import React from "react";

export function LossBarChart({ scenarios }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
      {scenarios.map((s) => (
        <div key={s.label}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: s.is_recommended ? s.color : "var(--text2)" }}>
              {s.labelShort}
              {s.is_recommended && (
                <span style={{ marginLeft: 6, fontSize: 10, color: s.color }}>✓ Recommended</span>
              )}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.loss_pct}%</span>
          </div>
          <div style={{ height: 12, borderRadius: 6, background: "var(--surface3)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, Math.max(0, s.loss_pct))}%`,
                background: s.color,
                borderRadius: 6,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
