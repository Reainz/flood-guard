import React from "react";
import { useEffect, useState } from "react";

import { DataBanner, FreshnessChips, SkeletonBlock } from "../components/SharedUI.jsx";
import { dispatchAlert, getAlertStatus } from "../services/api.js";

const tierConfig = {
  WATCH:    { color: "var(--blue)",  dimColor: "var(--blue-dim)",  sevBg: "var(--blue)",  emoji: "🔵", label: "Watch" },
  WARNING:  { color: "var(--amber)", dimColor: "var(--amber-dim)", sevBg: "var(--amber)", emoji: "⚠️", label: "Warning" },
  CRITICAL: { color: "var(--red)",   dimColor: "var(--red-dim)",   sevBg: "var(--red)",   emoji: "🚨", label: "Critical" },
};

const cropTips = [
  { icon: "🌾", bg: "var(--amber-dim)", color: "var(--amber)", strong: "Rice (grain-filling):", text: " Assess harvest readiness immediately. If panicles are 80%+ filled, emergency harvest may be preferable to flood damage." },
  { icon: "🥬", bg: "var(--red-dim)",   color: "var(--red)",   strong: "Vegetables:",           text: " Harvest all mature produce immediately. Move seedlings to elevated ground or raised beds." },
  { icon: "🏠", bg: "var(--blue-dim)",  color: "var(--blue)",  strong: "Safety:",               text: " Prepare emergency kit. Know evacuation route to nearest shelter (Tân Châu Community Center, 2.3 km NE)." },
];

const rainfallHeights = [40, 55, 70, 90, 100, 65, 45];
const rainfallLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function Alerts({ t }) {
  const [state, setState] = useState({ loading: true, payload: null, error: null });
  const [dispatchState, setDispatchState] = useState({ loading: false, payload: null, error: null });

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
  const alertTitle = data.title || t(`alerts.demo.${tier}.title`);
  const alertMessage = data.message || t(`alerts.demo.${tier}.message`);
  const alertAction = data.action_required || t(`alerts.demo.${tier}.action`);

  async function sendSimulation() {
    setDispatchState({ loading: true, payload: null, error: null });
    try {
      const payload = await dispatchAlert({
        alert_id: data.alert_id,
        tier: data.tier,
        farmer_name: "Demo Farmer",
        phone: "+84901234567",
        channel: "sms",
      });
      setDispatchState({ loading: false, payload, error: null });
    } catch (error) {
      setDispatchState({ loading: false, payload: null, error });
    }
  }

  const dispatchData = dispatchState.payload?.data;

  return (
    <div className="screen-stack">
      {fromCache && <DataBanner>{t("common.staleData", { time: formatDateTime(updatedAt) })}</DataBanner>}
      {state.payload.demo && <DataBanner tone="info">{t("common.demoData")}</DataBanner>}

      {/* Primary active alert card */}
      <div className="alert-card">
        <div className="alert-sev-bar" style={{ background: cfg.sevBg }} />
        <div className="alert-card-header">
          <div style={{ fontSize: 22 }}>{cfg.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{alertTitle}</div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
              {data.station} · {t("alerts.activeTier")}: {t(`tier.${tier}`)} · {fromCache ? formatDateTime(updatedAt) : "Live"}
            </div>
          </div>
          <span className={`chip chip-${tier === "CRITICAL" ? "red" : tier === "WARNING" ? "amber" : "blue"}`}>
            {t(`tier.${tier}`)}
          </span>
        </div>
        <div className="alert-card-body">
          <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, marginBottom: 12 }}>
            {alertMessage}
          </p>

          {/* Trigger reasons */}
          {data.trigger_reasons && data.trigger_reasons.length > 0 && (
            <>
              <div className="section-title">{t("alerts.reasons")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {data.trigger_reasons.map((reason) => (
                  <span key={reason} className="source-chip">{reason}</span>
                ))}
              </div>
            </>
          )}

          {/* Crop-specific tips */}
          <div className="section-title">Crop-specific recommendations</div>
          {cropTips.map((tip) => (
            <div className="tip-item" key={tip.icon}>
              <div className="tip-icon" style={{ background: tip.bg, color: tip.color }}>{tip.icon}</div>
              <div>
                <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 12 }}>{tip.strong}</span>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>{tip.text}</span>
              </div>
            </div>
          ))}

          {/* Action required */}
          <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border2)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: cfg.color, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("alerts.actions")}
            </div>
            <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{alertAction}</p>
          </div>

          {/* SMS preview */}
          <div className="section-title" style={{ marginTop: 14 }}>SMS alert preview</div>
          <div className="sms-preview">
            [FLOODGUARD] CANH BAO LU 72 GIO<br />
            Song Mekong tai Tan Chau: 3.8m, dang tang<br />
            Du kien nuoc ve: 68-74 gio<br />
            Ruong lua (tro hat): XEM QUYET DINH THU HOACH<br />
            Chi tiet: floodguard.vn/alert/2605<br />
            Thu hoi ho tro: *1800 hoac app
          </div>
        </div>
      </div>

      {/* 7-day rainfall watch card */}
      <div className="alert-card">
        <div className="alert-sev-bar" style={{ background: "var(--blue)" }} />
        <div className="alert-card-header">
          <div style={{ fontSize: 22 }}>🔵</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>7-day rainfall watch</div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
              Regional forecast · NCHMF data
            </div>
          </div>
          <span className="chip chip-blue">Watch</span>
        </div>
        <div className="alert-card-body">
          <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
            Above-average rainfall expected across the Upper Mekong basin for the next 7 days
            (180–220mm vs seasonal avg 130mm). Combined with upstream dam releases, this significantly
            increases flood probability in the Delta through the next fortnight.
          </p>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 6 }}>7-day rainfall forecast</div>
            <div className="rainfall-chart">
              {rainfallHeights.map((h, i) => (
                <div
                  key={i}
                  className="rainfall-bar"
                  style={{
                    height: `${h}%`,
                    background: h >= 85 ? "rgba(59,130,246,0.4)" : "var(--blue-dim)",
                    borderColor: h >= 85 ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.2)",
                  }}
                />
              ))}
            </div>
            <div className="rainfall-labels">
              {rainfallLabels.map((l) => <div key={l}>{l}</div>)}
            </div>
          </div>
        </div>
      </div>

      {/* Data sources */}
      <div className="card">
        <div className="section-title">Alert data sources</div>
        <div className="sources-table">
          <div className="sources-row">
            <span>River levels</span>
            <span className="chip chip-green">NCHMF Live · 15 min refresh</span>
          </div>
          <div className="sources-row">
            <span>Rainfall forecast</span>
            <span className="chip chip-green">Mekong River Commission</span>
          </div>
          <div className="sources-row">
            <span>Flood extent model</span>
            <span className="chip chip-green">Copernicus EMS Satellite</span>
          </div>
          <div className="sources-row">
            <span>Crop damage curves</span>
            <span className="chip chip-green">IRRI Field Research Data</span>
          </div>
        </div>
        <FreshnessChips freshness={data.source_freshness} t={t} />
      </div>

      {/* SMS Dispatch */}
      <div className="card" style={{ borderColor: "rgba(0,201,123,0.2)" }}>
        <div className="section-title">{t("alerts.dispatch")}</div>
        <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>{t("alerts.dispatchMode")}</p>
        <button
          type="button"
          className="primary-action"
          onClick={sendSimulation}
          disabled={dispatchState.loading}
        >
          {dispatchState.loading ? t("common.loading") : t("alerts.dispatch")}
        </button>
        {dispatchData && (
          <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border2)" }}>
            <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
              {t(`alerts.status.${dispatchData.dispatch_status}`)} ·{" "}
              {dispatchData.sms_sent ? t("common.ready") : t("alerts.status.simulated")}
            </div>
            {dispatchState.payload?.demo && (
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{t("alerts.demoDispatchDetail")}</div>
            )}
          </div>
        )}
        {dispatchState.error && <DataBanner tone="error">{t("alerts.dispatchFailed")}</DataBanner>}
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
