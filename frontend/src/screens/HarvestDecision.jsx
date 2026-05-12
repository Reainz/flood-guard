import React from "react";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { useCountUp } from "../hooks/useCountUp.js";

import { DataBanner, ScreenHeader } from "../components/SharedUI.jsx";
import { getFloodStatus, postHarvestDecision } from "../services/api.js";
import { LossBarChart } from "../components/charts/LossBarChart.jsx";
import { CropStageTimeline } from "../components/charts/CropStageTimeline.jsx";

const initialForm = {
  planting_date: "2026-02-03",
  crop_type: "rice",
  field_area_ha: 2.4,
  elevation: "medium",
  days_to_flood: 3,
  predicted_flood_depth_cm: 65,
  predicted_flood_duration_days: 5,
};

const scenarioCfgs = [
  { label: "Harvest now",         bg: "rgba(0,201,123,0.08)",   border: "#00C97B", tc: "#00C97B", sc: "rgba(0,201,123,0.6)" },
  { label: "Wait — flood arrives", bg: "rgba(245,158,11,0.08)", border: "#F59E0B", tc: "#F59E0B", sc: "rgba(245,158,11,0.6)" },
  { label: "Harvest after flood",  bg: "rgba(59,130,246,0.08)", border: "#3B82F6", tc: "#3B82F6", sc: "rgba(59,130,246,0.6)" },
];

function scenarioLabel(label, t) {
  if (label === "harvest_now") return t("harvest.scenarioLabels.harvest_now");
  if (label === "wait") return t("harvest.scenarioLabels.wait");
  return t("harvest.scenarioLabels.harvest_after");
}

export function HarvestDecision({ t }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ loading: false, payload: null, error: null });
  const [prefillState, setPrefillState] = useState({ loading: true, fromCache: false, updatedAt: null, error: false });
  const plantingDateRef = React.useRef(null);

  useEffect(() => {
    let mounted = true;
    getFloodStatus()
      .then((payload) => {
        if (!mounted) return;
        setForm((current) => ({
          ...current,
          days_to_flood: payload.data.prediction.hours_to_arrival < 24
            ? 1
            : Math.min(10, Math.max(1, Math.round(payload.data.prediction.hours_to_arrival / 24))),
          predicted_flood_depth_cm: Math.min(150, Math.max(10, Math.round(payload.data.prediction.predicted_depth_cm))),
          predicted_flood_duration_days: Math.min(14, Math.max(1, payload.data.prediction.predicted_duration_days)),
        }));
        setPrefillState({ loading: false, fromCache: payload.fromCache || payload.data.cached, updatedAt: payload.updatedAt, error: false });
      })
      .catch(() => mounted && setPrefillState({ loading: false, fromCache: false, updatedAt: null, error: true }));
    return () => { mounted = false; };
  }, []);

  const data = state.payload?.data;

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => { const next = { ...current }; delete next[name]; return next; });
  }

  function openPlantingDatePicker() {
    const input = plantingDateRef.current;
    if (!input) return;

    input.focus({ preventScroll: true });
    if (typeof input.showPicker !== "function") return;

    try {
      input.showPicker();
    } catch {
      // Browsers can reject showPicker() outside trusted pointer/keyboard events.
    }
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validateHarvest(form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const payload = await postHarvestDecision({
        ...form,
        field_area_ha: Number(form.field_area_ha),
        days_to_flood: Number(form.days_to_flood),
        predicted_flood_depth_cm: Number(form.predicted_flood_depth_cm),
        predicted_flood_duration_days: Number(form.predicted_flood_duration_days),
      });
      setState({ loading: false, payload, error: null });
    } catch (error) {
      setState((current) => ({ loading: false, payload: current.payload, error }));
    }
  }

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={t("harvest.eyebrow")}
        title={t("harvest.title")}
        description={t("harvest.description")}
      />

      {/* Banners */}
      {state.payload?.fromCache && <DataBanner>{t("common.staleData", { time: formatDateTime(state.payload.updatedAt) })}</DataBanner>}
      {state.payload?.demo && <DataBanner tone="info">{t("common.demoData")}</DataBanner>}
      {state.error && data && <DataBanner tone="error">{t("harvest.lastResultKept")}</DataBanner>}
      {state.error && !data && <DataBanner tone="error">{t("common.loadError")}</DataBanner>}
      {prefillState.loading && <DataBanner>{t("harvest.prefillLoading")}</DataBanner>}
      {prefillState.error && <DataBanner>{t("harvest.prefillFailed")}</DataBanner>}
      {!prefillState.loading && !prefillState.error && !prefillState.fromCache && (
        <DataBanner tone="info">{t("harvest.prefillReady")}</DataBanner>
      )}

      {/* Inputs */}
      <div className="card">
        <div className="section-title">{t("harvest.cropDetails")} &amp; {t("harvest.fieldDetails")}</div>

        <div className="field-row">
          <label htmlFor="harvest-crop">{t("harvest.crop")}</label>
          <select
            id="harvest-crop"
            value={form.crop_type}
            onChange={(e) => update("crop_type", e.target.value)}
          >
            <option value="rice">{t("crops.rice")}</option>
            <option value="vegetables">{t("crops.vegetable")}</option>
            <option value="fruit_trees">{t("crops.others")}</option>
          </select>
        </div>

        <div className="field-row">
          <label htmlFor="harvest-planting-date" onClick={openPlantingDatePicker}>
            {t("harvest.plantingDate")}
          </label>
          <input
            id="harvest-planting-date"
            ref={plantingDateRef}
            className="date-picker-input"
            type="date"
            value={form.planting_date}
            onClick={openPlantingDatePicker}
            onChange={(e) => update("planting_date", e.target.value)}
          />
          {errors.planting_date && <small className="field-error">{errors.planting_date}</small>}
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "14px 0" }} />
        <div className="section-title">{t("harvest.floodDetails")}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 4 }}>
              {t("harvest.depth")}
            </label>
            <div className="damage-slider-row">
              <input
                type="range"
                min="10" max="150" step="10"
                value={form.predicted_flood_depth_cm}
                onChange={(e) => update("predicted_flood_depth_cm", e.target.value)}
                style={{ flex: 1 }}
              />
              <span className="damage-pct">{form.predicted_flood_depth_cm}cm</span>
            </div>
            {errors.predicted_flood_depth_cm && <small className="field-error">{errors.predicted_flood_depth_cm}</small>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 4 }}>
              {t("harvest.duration")}
            </label>
            <div className="damage-slider-row">
              <input
                type="range"
                min="1" max="14" step="1"
                value={form.predicted_flood_duration_days}
                onChange={(e) => update("predicted_flood_duration_days", e.target.value)}
                style={{ flex: 1 }}
              />
              <span className="damage-pct">{form.predicted_flood_duration_days}d</span>
            </div>
            {errors.predicted_flood_duration_days && <small className="field-error">{errors.predicted_flood_duration_days}</small>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 4 }}>
              {t("harvest.area")}
            </label>
            <input
              type="number"
              min="0.1" max="100" step="0.1"
              value={form.field_area_ha}
              onChange={(e) => update("field_area_ha", e.target.value)}
            />
            {errors.field_area_ha && <small className="field-error">{errors.field_area_ha}</small>}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-full"
          style={{ marginTop: 14 }}
          disabled={state.loading}
          onClick={submit}
        >
          {state.loading ? t("common.loading") : t("harvest.submit")}
        </button>
      </div>

      {/* Results */}
      {data && <HarvestResult data={data} t={t} />}

      {/* Export hint */}
      <div className="card" style={{ background: "rgba(59,130,246,0.05)", borderColor: "rgba(59,130,246,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="inline-icon blue"><FileText size={20} aria-hidden="true" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--blue)" }}>{t("harvest.saveReport")}</div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{t("harvest.exportPdfDesc")}</div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: "7px 12px", flexShrink: 0 }}
            onClick={() => alert(t("harvest.pdfComingSoon"))}
          >
            {t("harvest.exportPdf")}
          </button>
        </div>
      </div>
    </div>
  );
}

function HarvestResult({ data, t }) {
  const scenarios = data.scenarios || [];
  const compensation = formatMillion(data.compensation.compensation_million_vnd);

  return (
    <div className="screen-stack">
      {/* Scenario comparison */}
      <div className="card">
        <div className="section-title">{t("harvest.scenarioComparison")}</div>
        <div className="scenario-grid">
          {scenarios.map((scenario, i) => {
            const lossPct = Math.round(scenario.loss_pct);
            const cfg = scenarioCfgs[i] || scenarioCfgs[0];
            return <ScenarioCard key={scenario.label} scenario={scenario} lossPct={lossPct} cfg={cfg} t={t} />;
          })}
        </div>

        {/* Recommendation panel */}
        {scenarios.find((s) => s.is_recommended) && (() => {
          const best = scenarios.find((s) => s.is_recommended);
          const bestIdx = scenarios.indexOf(best);
          const cfg = scenarioCfgs[bestIdx] || scenarioCfgs[0];
          return (
            <div className="rec-panel" style={{ background: cfg.bg, borderColor: cfg.border }}>
              <div className="rec-title" style={{ color: cfg.tc }}>
                {t("harvest.recommended")}: {scenarioLabel(best.label, t)}
              </div>
              <div className="rec-body" style={{ color: cfg.sc }}>
                {best.reasoning || t(`harvest.scenarioReasoning.${best.label}`)}
              </div>
            </div>
          );
        })()}

        <LossBarChart
          scenarios={scenarios.map((s, i) => ({
            label: s.label,
            labelShort: t(`harvest.scenarioLabels.${s.label}`),
            loss_pct: Math.round(s.loss_pct),
            is_recommended: s.is_recommended,
            color: scenarioCfgs[i]?.tc || "#00C97B",
          }))}
          recommendedLabel={t("harvest.cropLossRecommended")}
        />
      </div>

      {/* Growth stage + Compensation */}
      <div className="card">
        <div className="section-title">{t("harvest.stage")} &amp; {t("harvest.compensation")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="stat-card">
            <div className="stat-label">{t("harvest.stage")}</div>
            <div className="stat-num" style={{ fontSize: 15 }}>{data.growth_stage_vi || t("harvest.demoGrowthStage")}</div>
            <div className="stat-label">{t("harvest.daysToHarvest")}: {data.days_to_harvest}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t("harvest.compensation")}</div>
            <div className="stat-num" style={{ color: "var(--green)", fontSize: 20 }}>
              {compensation} <span style={{ fontSize: 13, fontWeight: 500 }}>{t("common.millionVnd")}</span>
            </div>
            <div className="stat-label">{data.compensation.legal_basis || t("harvest.demoLegalBasis")}</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>{t("harvest.growthStageProgress")}</div>
          <CropStageTimeline
            currentStage={data.growth_stage || "grain_filling"}
            stages={["seedling", "tillering", "panicle_initiation", "booting", "heading", "grain_filling", "maturity"]}
          />
        </div>
      </div>

      {/* Action steps */}
      {scenarios.find((s) => s.is_recommended) && (() => {
        const best = scenarios.find((s) => s.is_recommended);
        const steps = (best.action_steps || []).filter(Boolean);
        if (!steps.length) return null;
        return (
          <div className="card">
            <div className="section-title">{t("harvest.actionSteps")}</div>
            {steps.map((step, i) => (
              <div className="step-item" key={i}>
                <div className="step-num-circle">{i + 1}</div>
                <div className="step-text">{step}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Legal basis */}
      <div className="card" style={{ borderColor: "rgba(59,130,246,0.2)" }}>
        <div className="section-title">{t("harvest.legalBasis")}</div>
        <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, marginBottom: 6 }}>
          {data.compensation.legal_basis || t("harvest.demoLegalBasis")}
        </p>
        <p style={{ fontSize: 11, color: "var(--text3)" }}>
          {t("harvest.deadline")}: {data.compensation.submit_deadline_note || t("harvest.demoDeadline")}
        </p>
        <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
          {t("common.dataSources")}: {data.data_sources.join(" | ")}
        </p>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, lossPct, cfg, t }) {
  const animated = useCountUp(lossPct, 600);
  return (
    <div
      className={`scenario-card${scenario.is_recommended ? " winner" : ""}`}
      style={{
        background: cfg.bg,
        borderColor: scenario.is_recommended ? cfg.border : "rgba(255,255,255,0.07)",
      }}
    >
      <div className="sc-title" style={{ color: cfg.sc }}>{scenarioLabel(scenario.label, t)}</div>
      <div className="sc-loss" style={{ color: cfg.tc }}>{animated}%</div>
      <div className="sc-sub" style={{ color: cfg.sc }}>{t("harvest.cropLoss")}</div>
      {scenario.is_recommended && (
        <div className="sc-badge" style={{ background: cfg.bg, color: cfg.tc, border: `1px solid ${cfg.border}` }}>
          {t("harvest.recommended")}
        </div>
      )}
    </div>
  );
}

function validateHarvest(form, t) {
  const errors = {};
  const plantingDate = new Date(form.planting_date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (!form.planting_date) {
    errors.planting_date = t("harvest.validation.plantingDateRequired");
  } else if (Number.isNaN(plantingDate.getTime()) || plantingDate > today) {
    errors.planting_date = t("harvest.validation.plantingDateFuture");
  }
  if (!isInRange(form.field_area_ha, 0.1, 100)) errors.field_area_ha = t("harvest.validation.area");
  if (!isInRange(form.days_to_flood, 1, 21)) errors.days_to_flood = t("harvest.validation.daysToFlood");
  if (!isInRange(form.predicted_flood_depth_cm, 10, 200)) errors.predicted_flood_depth_cm = t("harvest.validation.depth");
  if (!isInRange(form.predicted_flood_duration_days, 1, 30)) errors.predicted_flood_duration_days = t("harvest.validation.duration");
  return errors;
}

function isInRange(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

function formatMillion(value) {
  return Number(value).toFixed(1);
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}
