import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { MockNotice, ScreenHeader } from "../components/SharedUI.jsx";
import { YieldRangeChart } from "../components/charts/YieldRangeChart.jsx";
import { useCountUp } from "../hooks/useCountUp.js";
import {
  PLOTS,
  PLOT_YIELD_MAX,
  PROJECTION_FROM_WEEK,
  SUMMARY,
  TRAJECTORY,
} from "../mocks/yieldPrediction.js";

export function YieldPrediction({ t }) {
  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={t("yield.eyebrow")}
        title={t("yield.title")}
        description={t("yield.description")}
      />

      <MockNotice>{t("common.placeholderScreen")}</MockNotice>

      <div className="yield-summary-grid">
        <SummaryTile
          label={t("yield.perHectare")}
          value={SUMMARY.yieldPerHa}
          unit={t("yield.tonnesPerHa")}
          decimals={1}
        />
        <SummaryTile
          label={t("yield.totalHarvest")}
          value={SUMMARY.totalTonnes}
          unit={t("yield.tonnes")}
          decimals={1}
          meta={t("yield.overArea", { area: SUMMARY.fieldAreaHa })}
        />
        <SummaryTile
          label={t("yield.vsLastSeason")}
          value={SUMMARY.vsLastSeasonPct}
          unit="%"
          decimals={0}
          trend={SUMMARY.vsLastSeasonPct}
        />
      </div>

      <div className="card">
        <div className="section-title">{t("yield.trajectoryTitle")}</div>
        <p className="muted-line">{t("yield.trajectoryDesc")}</p>
        <YieldRangeChart
          data={TRAJECTORY}
          projectionFromWeek={PROJECTION_FROM_WEEK}
          yMax={8}
          xAxisLabel={t("yield.weekAxis")}
          yAxisLabel={t("yield.tonnesPerHa")}
          ariaLabel={t("yield.trajectoryAria")}
        />
        <div className="legend-row">
          <span className="legend-item">
            <i className="legend-line" style={{ background: "var(--green)" }} />
            {t("yield.legendObserved")}
          </span>
          <span className="legend-item">
            <i className="legend-line legend-line-dashed" />
            {t("yield.legendProjected")}
          </span>
          <span className="legend-item">
            <i className="legend-swatch legend-swatch-band" />
            {t("yield.legendBand", { pct: SUMMARY.confidence })}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="section-title">{t("yield.byPlotTitle")}</div>
        <ol className="plot-list">
          {PLOTS.map((plot) => {
            const Trend = plot.trendPct >= 0 ? TrendingUp : TrendingDown;
            const trendColor = plot.trendPct >= 0 ? "var(--green)" : "var(--red)";
            return (
              <li className="plot-row" key={plot.id}>
                <span className="plot-badge">{plot.id}</span>
                <div className="plot-main">
                  <div className="plot-head">
                    <strong>{t(`yield.plots.${plot.nameKey}`)}</strong>
                    <span className="plot-area">{t("yield.hectares", { area: plot.areaHa })}</span>
                  </div>
                  <span className="plot-bar" aria-hidden="true">
                    <span
                      className="plot-bar-fill"
                      style={{ width: `${(plot.yieldPerHa / PLOT_YIELD_MAX) * 100}%` }}
                    />
                  </span>
                </div>
                <div className="plot-figures">
                  <strong>{plot.yieldPerHa.toFixed(1)}</strong>
                  <small style={{ color: trendColor }}>
                    <Trend size={11} aria-hidden="true" />
                    {Math.abs(plot.trendPct)}%
                  </small>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="plot-footnote">{t("yield.byPlotFootnote")}</p>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, unit, decimals, meta, trend }) {
  // useCountUp only steps through integers, so animate a scaled copy and divide back.
  const scale = 10 ** decimals;
  const animated = useCountUp(Math.round(value * scale), 700) / scale;
  const Trend = trend === undefined ? null : trend >= 0 ? TrendingUp : TrendingDown;
  const trendColor = trend === undefined ? undefined : trend >= 0 ? "var(--green)" : "var(--red)";

  return (
    <div className="stat-card yield-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-num yield-tile-num" style={{ color: trendColor }}>
        {Trend && <Trend size={18} aria-hidden="true" />}
        {trend !== undefined && trend >= 0 ? "+" : ""}
        {animated.toFixed(decimals)}
        <span className="yield-tile-unit">{unit}</span>
      </div>
      {meta && <div className="stat-label">{meta}</div>}
    </div>
  );
}
