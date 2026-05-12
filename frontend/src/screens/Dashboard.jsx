import React from "react";
import { useEffect, useRef, useState, Suspense, lazy } from "react";
import { CloudRain } from "lucide-react";

import { DataBanner, ScreenHeader, SkeletonBlock } from "../components/SharedUI.jsx";
import { getFloodStatus } from "../services/api.js";
import { FloodRiskGauge } from "../components/charts/FloodRiskGauge.jsx";

const LeafletMap = lazy(() => import("../components/map/LeafletMap.jsx"));

const RIVER_MAX_M = 5;

function riverFillClass(status) {
  if (status === "DANGER") return "river-fill-red";
  if (status === "ALERT") return "river-fill-amber";
  return "river-fill-green";
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
  const forecast = data.forecast.slice(0, 5);
  const riverPct = Math.min(100, (data.river.current_level_m / RIVER_MAX_M) * 100);

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.title")}
        description={t("dashboard.description")}
      />

      {fromCache && <DataBanner>{t("common.staleData", { time: formatDateTime(updatedAt) })}</DataBanner>}
      {state.payload.demo && <DataBanner tone="info">{t("common.demoData")}</DataBanner>}

      {/* Countdown + Gauge */}
      <div className="card">
        <div className="flood-summary-card">
          <div className="countdown-block">
            <div className="countdown-caption">
              <span className="pulse-dot" aria-hidden="true" />
              {t("dashboard.arrival")}
            </div>
            <Countdown hours={data.prediction.hours_to_arrival} t={t} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>
                {t("dashboard.depth")}
              </div>
              <div className="depth-meter" aria-hidden="true">
                <div
                  className="depth-meter-fill"
                  style={{ width: `${Math.min(100, Math.round(data.prediction.predicted_depth_cm / 1.5))}%` }}
                />
              </div>
              <div className="depth-meter-scale">
                <span>0 cm</span>
                <strong style={{ color: "var(--blue)", fontWeight: 700 }}>
                  {Math.round(data.prediction.predicted_depth_cm)} cm
                </strong>
                <span>150 cm</span>
              </div>
            </div>
          </div>
          <FloodRiskGauge
            riskLevel={risk}
            pct={{ LOW: 18, MODERATE: 50, HIGH: 78, CRITICAL: 96 }[risk] ?? 50}
            label={t("dashboard.floodRiskGauge")}
            t={t}
          />
        </div>
      </div>

      {/* River Level Monitoring */}
      <div className="card">
        <div className="section-title section-blue">{t("dashboard.riverMonitoring")}</div>
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
                {t("dashboard.riseRate", { rate: data.river.rise_rate_cm_per_hr })}
              </span>
              <span className="chip chip-amber">{t(`river.status.${data.river.status}`)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="map-overlay-wrap">
          <Suspense fallback={<div className="map-loading">{t("dashboard.mapLoading")}</div>}>
            <LeafletMap
              lat={parseFloat(localStorage.getItem("fg_field_lat") || "10.52")}
              lon={parseFloat(localStorage.getItem("fg_field_lon") || "105.12")}
              riskLevel={risk}
              stationName={data.river.station}
            />
          </Suspense>
          <div className="map-legend-overlay">
            <div className="map-legend-item">
              <div className="map-legend-sq" style={{ background: "rgba(239,68,68,0.35)", border: "1.5px solid rgba(220,38,38,0.6)" }} />
              {t("dashboard.mapLegendFlood")}
            </div>
            <div className="map-legend-item">
              <div className="map-legend-dot" style={{ background: "var(--green)" }} />
              {t("dashboard.mapLegendField")}
            </div>
          </div>
        </div>
      </div>

      {/* Field Overview */}
      <div className="card">
        <div className="section-title section-amber">{t("dashboard.fieldOverview")}</div>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">{t("dashboard.cropTypeLabel")}</div>
            <div className="stat-value-slot">
              <div className="stat-num" style={{ color: "var(--green)" }}>
                {t("crops.rice")}
              </div>
            </div>
            <div className="stat-footer">{t("dashboard.registeredField")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t("dashboard.fieldAreaLabel")}</div>
            <div className="stat-value-slot">
              <div className="stat-num">
                2.4
                <span className="stat-unit">ha</span>
              </div>
            </div>
            <div className="stat-footer">{t("dashboard.registeredField")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t("dashboard.predictedDepthLabel")}</div>
            <div className="stat-value-slot">
              <div className="stat-num" style={{ color: "var(--amber)" }}>
                {Math.round(data.prediction.predicted_depth_cm)}
                <span className="stat-unit">cm</span>
              </div>
            </div>
            <div className="stat-footer">{t("dashboard.depthStatFootnote")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t("dashboard.riskLevelLabel")}</div>
            <div className="stat-value-slot">
              <div
                className="stat-num"
                style={{
                  color: risk === "LOW" ? "var(--green)" : risk === "MODERATE" ? "var(--amber)" : "var(--red)",
                }}
              >
                {t(`risk.${risk}`)}
              </div>
            </div>
            <div className="stat-footer">
              {t("river.updated")}: {formatDateTime(data.river.updated)}
            </div>
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="card">
        <div className="section-title section-blue">{t("dashboard.forecast")}</div>
        <div className="forecast-list">
          {forecast.map((item) => (
            <div className="forecast-row" key={item.time}>
              <span>
                <CloudRain size={16} aria-hidden="true" />
                <span className="forecast-time">{formatTime(item.time)}</span>
                <span className="forecast-date">{formatDate(item.time)}</span>
              </span>
              <strong>{item.rain_mm} mm</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Countdown({ hours, t }) {
  const totalMins0 = Math.max(0, Math.round(hours * 60));
  const [time, setTime] = useState(() => ({ h: Math.floor(totalMins0 / 60), m: totalMins0 % 60 }));
  const ref = useRef(time);

  useEffect(() => {
    const totalMins = Math.max(0, Math.round(hours * 60));
    const next = { h: Math.floor(totalMins / 60), m: totalMins % 60 };
    ref.current = next;
    setTime({ ...next });
    const id = setInterval(() => {
      const cur = ref.current;
      const mins = cur.h * 60 + cur.m;
      if (mins <= 0) { clearInterval(id); return; }
      const stepped = mins - 1;
      ref.current = { h: Math.floor(stepped / 60), m: stepped % 60 };
      setTime({ ...ref.current });
    }, 60000);
    return () => clearInterval(id);
  }, [hours]);

  const hourLabel = t ? t("countdown.hours") : "Hours";
  const minLabel  = t ? t("countdown.minutes") : "Minutes";

  return (
    <div className="countdown-row" aria-label={`${time.h} ${hourLabel} ${time.m} ${minLabel}`}>
      <div className="countdown-box">
        <div className="countdown-num">{pad(time.h)}</div>
        <div className="countdown-unit">{hourLabel}</div>
      </div>
      <div className="countdown-colon" aria-hidden="true">:</div>
      <div className="countdown-box">
        <div className="countdown-num">{pad(time.m)}</div>
        <div className="countdown-unit">{minLabel}</div>
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

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}
