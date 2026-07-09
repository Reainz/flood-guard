import React from "react";

// Fallback for callers that predate the `t` prop. Prefer passing `t`.
const STAGE_VI = {
  seedling:           "Mạ non",
  tillering:          "Đẻ nhánh",
  panicle_initiation: "Làm đòng",
  booting:            "Trỗ bông",
  heading:            "Trỗ",
  grain_filling:      "Vào chắc",
  maturity:           "Chín",
};

export function CropStageTimeline({ currentStage, stages, t }) {
  const activeIdx = stages.indexOf(currentStage);
  const stageLabel = (stage) => (t ? t(`stages.${stage}`) : STAGE_VI[stage] || stage);

  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      {/* 280px keeps all seven labels inside a card at a 360px viewport. */}
      <div style={{ display: "flex", alignItems: "flex-start", minWidth: 280, position: "relative" }}>
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
                  background: isPast ? "var(--green)" : isActive ? "var(--blue)" : "var(--surface3)",
                  border: isActive ? "2px solid var(--blue)" : isPast ? "2px solid var(--green)" : "2px solid var(--border2)",
                  transition: "all 0.3s ease",
                  flexShrink: 0,
                }}
              />
              <div style={{
                fontSize: isActive ? 10 : 9,
                marginTop: 5,
                color: isActive ? "var(--blue)" : isPast ? "var(--green)" : "var(--text3)",
                fontWeight: isActive ? 700 : 400,
                textAlign: "center",
                lineHeight: 1.2,
              }}>
                {stageLabel(stage)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
