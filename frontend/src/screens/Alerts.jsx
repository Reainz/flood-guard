import React from "react";
import { useEffect, useState } from "react";
import { AlertTriangle, CloudRain, Home, Leaf, Sprout } from "lucide-react";

import { DataBanner, ScreenHeader, SkeletonBlock } from "../components/SharedUI.jsx";
import { getAlertStatus } from "../services/api.js";
import { RainfallMiniChart } from "../components/charts/RainfallMiniChart.jsx";

const DEMO_RAINFALL = [
  { label: "T2", mm: 40 }, { label: "T3", mm: 55 },
  { label: "T4", mm: 70 }, { label: "T5", mm: 90 },
  { label: "T6", mm: 100}, { label: "T7", mm: 65 },
  { label: "CN", mm: 45 },
];

const tierConfig = {
  WATCH:    { color: "var(--blue)",  dimColor: "var(--blue-dim)",  sevBg: "var(--blue)",  icon: CloudRain },
  WARNING:  { color: "var(--amber)", dimColor: "var(--amber-dim)", sevBg: "var(--amber)", icon: AlertTriangle },
  CRITICAL: { color: "var(--red)",   dimColor: "var(--red-dim)",   sevBg: "var(--red)",   icon: AlertTriangle },
};

const cropTips = [
  { key: "rice", icon: Sprout, bg: "var(--amber-dim)", color: "var(--amber)" },
  { key: "vegetables", icon: Leaf, bg: "var(--red-dim)", color: "var(--red)" },
  { key: "safety", icon: Home, bg: "var(--blue-dim)", color: "var(--blue)" },
];


export function Alerts({ t }) {
  const [state, setState] = useState({ loading: true, payload: null, error: null });

  useEffect(() => {
    let mounted = true;
    getAlertStatus()
      .then((payload) => mounted && setState({ loading: false, payload, error: null }))
      .catch((error) => mounted && setState({ loading: false, payload: null, error }));
    return () => { mounted = false; };
  }, []);

  if (state.loading) return <AlertsSkeleton t={t} />;
  if (state.error && !state.payload) {
    return <DataBanner tone="error">{t("common.loadError")}</DataBanner>;
  }

  const { data, fromCache, updatedAt } = state.payload;
  const tier = data.tier || "WARNING";
  const cfg = tierConfig[tier] || tierConfig.WARNING;
  const TierIcon = cfg.icon;
  // Always use localized keys for the UI, ignoring backend SMS strings
  const alertTitle = t(`alerts.demo.${tier}.title`);
  const alertMessage = t(`alerts.demo.${tier}.message`);
  const alertAction = t(`alerts.demo.${tier}.action`);
  const rainfallTier = data.rainfall_tier || "WATCH";
  const rainfallCfg = rainfallTier === "WARNING" ? tierConfig.WARNING : tierConfig.WATCH;
  const rainfallSeries =
    data.rainfall_forecast && data.rainfall_forecast.length > 0
      ? data.rainfall_forecast.map((d) => ({ label: d.label, mm: Number(d.mm) }))
      : DEMO_RAINFALL;

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={t("alerts.eyebrow")}
        title={t("alerts.title")}
        description={t("alerts.description")}
      />

      {fromCache && <DataBanner>{t("common.staleData", { time: formatDateTime(updatedAt) })}</DataBanner>}
      {state.payload.demo && <DataBanner tone="info">{t("common.demoData")}</DataBanner>}

      {/* Primary active alert card */}
      <div className="alert-card">
        <div className="alert-sev-bar" style={{ background: cfg.sevBg }} />
        <div className="alert-card-header">
          <div className={`alert-icon-pulse ${tier.toLowerCase()}`}>
            <TierIcon size={24} aria-hidden="true" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.2px", color: cfg.color }}>{alertTitle}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>
              {data.station} · {t("alerts.activeTier")}: {t(`tier.${tier}`)} · {fromCache ? formatDateTime(updatedAt) : t("common.live")}
            </div>
          </div>
          <span className={`chip chip-${tier === "CRITICAL" ? "red" : tier === "WARNING" ? "amber" : "blue"}`}>
            {t(`tier.${tier}`)}
          </span>
        </div>
        <div className="alert-card-body">
          <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6, marginBottom: 14 }}>
            {alertMessage}
          </p>

          {/* Crop-specific tips */}
          <div className="section-title">{t("alerts.cropTips")}</div>
          {cropTips.map((tip) => {
            const TipIcon = tip.icon;
            return (
              <div className="tip-item" key={tip.key}>
                <div className="tip-icon" style={{ background: tip.bg, color: tip.color }}>
                  <TipIcon size={18} aria-hidden="true" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, marginBottom: 2 }}>
                    {t(`alerts.tips.${tip.key}.strong`)}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>
                    {t(`alerts.tips.${tip.key}.text`)}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Action required */}
          <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border2)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: cfg.color, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("alerts.actions")}
            </div>
            <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{alertAction}</p>
          </div>
        </div>
      </div>

      {/* 7-day rainfall watch card */}
      <div className="alert-card">
        <div className="alert-sev-bar" style={{ background: rainfallCfg.sevBg }} />
        <div className="alert-card-header">
          <div className="inline-icon blue"><CloudRain size={20} aria-hidden="true" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t("alerts.rainfallWatch")}</div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{t("alerts.rainfallSource")}</div>
          </div>
          <span className={`chip chip-${rainfallTier === "WARNING" ? "amber" : "blue"}`}>
            {t(`tier.${rainfallTier}`)}
          </span>
        </div>
        <div className="alert-card-body">
          <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{t("alerts.rainfallDesc")}</p>
          <div style={{ marginTop: 12 }}>
            <RainfallMiniChart data={rainfallSeries} threshold={85} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsSkeleton({ t }) {
  return (
    <div className="screen-stack" aria-label={t("common.loading")}>
      <SkeletonBlock className="header" />
      <SkeletonBlock className="large" />
      <SkeletonBlock />
      <SkeletonBlock />
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}
