import React from "react";
import { useEffect, useRef, useState, Suspense, lazy } from "react";

import { DataBanner, FreshnessChips, SkeletonBlock } from "../components/SharedUI.jsx";
import { getFloodStatus } from "../services/api.js";
import { FloodRiskGauge } from "../components/charts/FloodRiskGauge.jsx";

const LeafletMap = lazy(() => import("../components/map/LeafletMap.jsx"));

const RIVER_MAX_M = 5;

const riskConfig = {
  LOW:      { tone: "low",      emoji: "🟢", alertLabel: "Rủi ro thấp — theo dõi thông thường" },
  MODERATE: { tone: "moderate", emoji: "⚠️", alertLabel: "Cảnh báo lũ — mức trung bình" },
  HIGH:     { tone: "high",     emoji: "🔴", alertLabel: "Cảnh báo lũ — mức cao" },
  CRITICAL: { tone: "critical", emoji: "🚨", alertLabel: "Khẩn cấp — lũ sắp đến" },
};

function riverFillClass(status) {
  if (status === "DANGER") return "river-fill-red";
  if (status === "ALERT") return "river-fill-amber";
  return "river-fill-green";
}

function riskChipClass(level) {
  if (level === "CRITICAL" || level === "HIGH") return "chip chip-red";
  if (level === "MODERATE") return "chip chip-amber";
  return "chip chip-green";
}

function pad(n) {
  return String(n).padStart(2, "0");
}

export function Dashboard({ t }) {
  const [state, setState] = useState({ loading: true, payload: null, error: null });

  useEffect(() => {
    let mounted = true;
    getFloodStatus()
      .then((payload) => mounted && setState({ loading: false, payload, error: null }))
      .catch((error) => mounted && setState({ loading: false, payload: null, error }));
    return () => { mounted = false; };
  }, []);

  if (state.loading) return <DashboardSkeleton t={t} />;
  if (state.error && !state.payload) {
    return <DataBanner tone="error">{t("common.loadError")}</DataBanner>;
  }

  const { data, fromCache, updatedAt } = state.payload;
  const risk = data.prediction.risk_level;
  const cfg = riskConfig[risk] || riskConfig.MODERATE;
  const forecast = data.forecast.slice(0, 5);
  const explanation = state.payload.demo ? t("dashboard.demoExplanation") : data.prediction.explanation;
  const riverPct = Math.min(100, (data.river.current_level_m / RIVER_MAX_M) * 100);
  const actionKey = { LOW: "dashboard.actionLow", MODERATE: "dashboard.actionModerate", HIGH: "dashboard.actionHigh", CRITICAL: "dashboard.actionCritical" }[risk];

  return (
    <div className="screen-stack">
      {fromCache && <DataBanner>{t("common.staleData", { time: formatDateTime(updatedAt) })}</DataBanner>}
      {state.payload.demo && <DataBanner tone="info">{t("common.demoData")}</DataBanner>}

      {/* Flood Alert Bar */}
      <div className={`flood-alert-bar${risk === "CRITICAL" ? " critical" : risk === "LOW" ? " low" : ""}`}>
        <div className={`alert-icon${risk === "CRITICAL" ? " critical" : risk === "LOW" ? " low" : ""}`}>
          {cfg.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div className={`alert-title${risk === "CRITICAL" ? " critical" : risk === "LOW" ? " low" : ""}`}>
            {cfg.alertLabel}
          </div>
          <div className="alert-sub">
            {data.river.station} · {t(`river.trendValue.${data.river.trend}`)} ·{" "}
            {t("dashboard.arrival")}: {data.prediction.hours_to_arrival}h
          </div>
        </div>
        <span className={riskChipClass(risk)}>{t(`risk.${risk}`)}</span>
      </div>

      {/* Countdown + Gauge */}
      <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div className="section-title">{t("dashboard.arrival")}</div>
          <Countdown hours={data.prediction.hours_to_arrival} />
        </div>
        <FloodRiskGauge
          riskLevel={risk}
          pct={{ LOW: 18, MODERATE: 50, HIGH: 78, CRITICAL: 96 }[risk] ?? 50}
        />
      </div>

      {/* River Level Monitoring */}
      <div className="card">
        <div className="section-title">River level monitoring</div>
        <div className="river-entry">
          <div className="river-header">
            <span className="river-name">{data.river.station}</span>
            <span className={`chip ${data.river.status === "DANGER" ? "chip-red" : data.river.status === "ALERT" ? "chip-amber" : "chip-green"}`}>
              {data.river.current_level_m} m · {t(`river.trendValue.${data.river.trend}`)}
            </span>
          </div>
          <div className="river-bar">
            <div
              className={`river-fill ${riverFillClass(data.river.status)}`}
              style={{ width: `${riverPct}%` }}
            />
          </div>
          <div className="river-scale">
            <span>0 m</span>
            <span>{t("river.alertLevel")} {data.river.alert_level_m} m</span>
            <span>{RIVER_MAX_M} m</span>
          </div>
        </div>
        {data.river.rise_rate_cm_per_hr > 0 && (
          <div className="river-entry" style={{ marginTop: 8 }}>
            <div className="river-header">
              <span className="river-name" style={{ fontSize: 12, color: "var(--text2)" }}>
                Tốc độ dâng: {data.river.rise_rate_cm_per_hr} cm/h
              </span>
              <span className="chip chip-amber">{t(`river.status.${data.river.status}`)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <Suspense fallback={<div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 12 }}>Loading map…</div>}>
          <LeafletMap
            lat={10.52}
            lon={105.12}
            riskLevel={risk}
            stationName={data.river.station}
          />
        </Suspense>
        <div className="map-legend" style={{ padding: "8px 14px" }}>
          <div className="map-legend-item">
            <div className="map-legend-sq" style={{ background: "rgba(239,68,68,0.3)" }} />
            Flood risk zone
          </div>
          <div className="map-legend-item">
            <div className="map-legend-dot" style={{ background: "var(--green)" }} />
            Your field
          </div>
        </div>
      </div>

      {/* Field Overview */}
      <div className="card">
        <div className="section-title">Field overview</div>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Crop type</div>
            <div className="stat-num" style={{ fontSize: 16, color: "var(--green)" }}>Rice</div>
            <div className="stat-label">Winter-spring, grain filling</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Field area</div>
            <div className="stat-num">2.4 <span style={{ fontSize: 14, fontWeight: 500 }}>ha</span></div>
            <div className="stat-label">Registered field</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t("dashboard.depth")}</div>
            <div className="stat-num" style={{ color: "var(--amber)" }}>
              {Math.round(data.prediction.predicted_depth_cm)} <span style={{ fontSize: 14, fontWeight: 500 }}>cm</span>
            </div>
            <div className="stat-label">Predicted flood depth</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Risk level</div>
            <div className="stat-num" style={{ fontSize: 16, color: risk === "LOW" ? "var(--green)" : risk === "MODERATE" ? "var(--amber)" : "var(--red)" }}>
              {t(`risk.${risk}`)}
            </div>
            <div className="stat-label">{t("river.updated")}: {formatDateTime(data.river.updated)}</div>
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="card">
        <div className="section-title">{t("dashboard.forecast")}</div>
        <div className="forecast-list">
          {forecast.map((item) => (
            <div className="forecast-row" key={item.time}>
              <span>{formatDateTime(item.time)}</span>
              <strong>{item.rain_mm} mm</strong>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Card */}
      <div className="cta-card">
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
          {t(actionKey)}
        </div>
        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
          {explanation}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: "var(--text2)" }}>{t("dashboard.locationSummary")}</span>
        </div>
        <FreshnessChips freshness={data.source_freshness} t={t} />
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 10 }}>
          {t("common.dataSources")}: {data.data_sources.join(" | ")}
        </div>
      </div>
    </div>
  );
}

function Countdown({ hours }) {
  const totalMins0 = Math.max(0, Math.round(hours * 60));
  const [time, setTime] = useState(() => ({ h: Math.floor(totalMins0 / 60), m: totalMins0 % 60 }));
  const ref = useRef(time);

  useEffect(() => {
    const totalMins = Math.max(0, Math.round(hours * 60));
    const t = { h: Math.floor(totalMins / 60), m: totalMins % 60 };
    ref.current = t;
    setTime({ ...t });
    const id = setInterval(() => {
      const cur = ref.current;
      const mins = cur.h * 60 + cur.m;
      if (mins <= 0) { clearInterval(id); return; }
      const next = mins - 1;
      ref.current = { h: Math.floor(next / 60), m: next % 60 };
      setTime({ ...ref.current });
    }, 60000);
    return () => clearInterval(id);
  }, [hours]);

  return (
    <div className="countdown-row">
      <div className="countdown-box">
        <div className="countdown-num">{pad(time.h)}</div>
        <div className="countdown-unit">hours</div>
      </div>
      <div className="countdown-box">
        <div className="countdown-num">{pad(time.m)}</div>
        <div className="countdown-unit">minutes</div>
      </div>
    </div>
  );
}

function DashboardSkeleton({ t }) {
  return (
    <div className="screen-stack" aria-label={t("common.loading")}>
      <SkeletonBlock className="header" />
      <SkeletonBlock className="large" />
      <div className="metric-grid">
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
      </div>
      <SkeletonBlock />
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
