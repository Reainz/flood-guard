import React from "react";
import { CalendarCheck, Droplets, RefreshCw, Sprout } from "lucide-react";

import { MockNotice, ScreenHeader } from "../components/SharedUI.jsx";
import { ConfidenceMeter } from "../components/charts/ConfidenceMeter.jsx";
import { CropStageTimeline } from "../components/charts/CropStageTimeline.jsx";
import { HarvestWindowBar } from "../components/charts/HarvestWindowBar.jsx";
import { useMockDelay } from "../hooks/useMockDelay.js";
import { FACTORS, RECALC_MS, STAGES, TIMING } from "../mocks/harvestTiming.js";

const FACTOR_ICONS = {
  grain_moisture: Droplets,
  forecast_rainfall: CalendarCheck,
  stage_maturity: Sprout,
};

export function HarvestTiming({ t }) {
  const { phase, start } = useMockDelay(RECALC_MS);
  const recalculating = phase === "running";

  const windowLabel = t("timing.windowShort", {
    from: TIMING.windowStartDay,
    to: TIMING.windowEndDay,
  });

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={t("timing.eyebrow")}
        title={t("timing.title")}
        description={t("timing.description")}
      />

      <MockNotice>{t("common.placeholderScreen")}</MockNotice>

      <div className="card">
        <div className="section-title">{t("timing.windowTitle")}</div>
        <HarvestWindowBar
          trackStartDay={TIMING.trackStartDay}
          trackDays={TIMING.trackDays}
          todayDay={TIMING.todayDay}
          windowStartDay={TIMING.windowStartDay}
          windowEndDay={TIMING.windowEndDay}
          floodRiskStartDay={TIMING.floodRiskStartDay}
          floodRiskEndDay={TIMING.floodRiskEndDay}
          windowLabel={windowLabel}
          todayLabel={t("timing.today")}
          floodRiskLabel={t("timing.floodOverlap")}
          ariaLabel={t("timing.windowAria", {
            from: TIMING.windowStartDay,
            to: TIMING.windowEndDay,
          })}
        />
        <div className="legend-row">
          <span className="legend-item">
            <i className="legend-swatch" style={{ background: "var(--green)" }} />
            {t("timing.legendWindow")}
          </span>
          <span className="legend-item">
            <i className="legend-swatch legend-swatch-hatch" />
            {t("timing.legendFlood")}
          </span>
        </div>
      </div>

      <div className="card rec-highlight">
        <div className="rec-highlight-head">
          <div>
            <p className="eyebrow">{t("timing.recommendation")}</p>
            <h3 className="rec-highlight-title">
              {t("timing.windowLong", {
                from: TIMING.windowStartDay,
                to: TIMING.windowEndDay,
                month: t("months.march"),
              })}
            </h3>
          </div>
          <ConfidenceMeter
            value={TIMING.confidence}
            size={92}
            caption={t("timing.confidenceCaption")}
            ariaLabel={t("timing.confidenceAria", { pct: TIMING.confidence })}
          />
        </div>

        <p className="rec-highlight-body">{t("timing.rationale")}</p>

        <div className="factor-list">
          {FACTORS.map((factor) => {
            const Icon = FACTOR_ICONS[factor.key];
            return (
              <div className="factor-row" key={factor.key}>
                <span className="factor-icon" style={{ color: factor.color }}>
                  <Icon size={15} aria-hidden="true" />
                </span>
                <span className="factor-name">{t(`timing.factors.${factor.key}`)}</span>
                <span className="factor-bar" aria-hidden="true">
                  <span
                    className="factor-bar-fill"
                    style={{ width: `${factor.score}%`, background: factor.color }}
                  />
                </span>
                <span className="factor-value">{factor.valueLabel}</span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-full recalc-btn"
          onClick={start}
          disabled={recalculating}
        >
          <RefreshCw
            size={14}
            className={recalculating ? "recalc-spin" : undefined}
            aria-hidden="true"
          />
          {recalculating ? t("timing.recalculating") : t("timing.recalculate")}
        </button>
      </div>

      <div className="card">
        <div className="section-title">{t("timing.stageTitle")}</div>
        <p className="muted-line">{t("timing.stageDesc")}</p>
        <CropStageTimeline currentStage={TIMING.currentStage} stages={STAGES} t={t} />
      </div>
    </div>
  );
}
