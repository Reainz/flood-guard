import React from "react";

const STAGE_LABELS_VI = {
  seedling:           "Mạ",
  tillering:          "Đẻ nhánh",
  panicle_initiation: "Làm đòng",
  booting:            "Trỗ bông",
  heading:            "Trỗ",
  grain_filling:      "Vào chắc",
  maturity:           "Chín",
};

export function CropStageTimeline({ currentStage, stages }) {
  const activeIdx = stages.indexOf(currentStage);

  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "flex-start", minWidth: 340, position: "relative" }}>
        <div style={{
          position: "absolute",
          top: 10,
          height: 2,
          background: "var(--border2)",
          zIndex: 0,
          width: `calc(100% - ${100 / stages.length}%)`,
          marginLeft: `calc(${50 / stages.length}%)`,
        }} />
        {stages.map((stage, i) => {
          const isPast   = i < activeIdx;
          const isActive = i === activeIdx;
          const dotColor = isPast ? "var(--green)" : isActive ? "var(--blue)" : "var(--surface3)";
          const dotBorder = isActive ? "2px solid var(--blue)" : isPast ? "2px solid var(--green)" : "2px solid var(--border2)";
          return (
            <div
              key={stage}
              className={`stage-dot-wrap${isActive ? " active" : ""}`}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}
            >
              <div
                className={`stage-dot${isPast ? " completed" : ""}${isActive ? " active" : ""}`}
                style={{
                  width: isActive ? 20 : 14,
                  height: isActive ? 20 : 14,
                  borderRadius: "50%",
                  background: dotColor,
                  border: dotBorder,
                  transition: "all 0.3s ease",
                  flexShrink: 0,
                }}
              />
              <div style={{
                fontSize: 9,
                marginTop: 4,
                color: isActive ? "var(--blue)" : isPast ? "var(--green)" : "var(--text3)",
                fontWeight: isActive ? 700 : 400,
                textAlign: "center",
                lineHeight: 1.2,
              }}>
                {stage}
              </div>
              <div style={{ fontSize: 8, color: "var(--text3)", textAlign: "center", lineHeight: 1.1, marginTop: 1 }}>
                {STAGE_LABELS_VI[stage] || ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
