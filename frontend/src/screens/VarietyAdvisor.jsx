import React from "react";
import { useState } from "react";
import { Check, RotateCcw, Sprout } from "lucide-react";

import { MockNotice, ScreenHeader, SkeletonBlock, WizardActions, WizardProgress } from "../components/SharedUI.jsx";
import { ConfidenceMeter } from "../components/charts/ConfidenceMeter.jsx";
import { useMockDelay } from "../hooks/useMockDelay.js";
import {
  DEFAULT_ANSWERS,
  MATCH_MS,
  PRIORITIES,
  RECOMMENDATION,
  REGIONS,
  RUNNERS_UP,
  SEASONS,
  SOIL_TYPES,
  STEP_KEYS,
} from "../mocks/variety.js";

/** Distinct fill per soil card so the four read apart at a glance. */
const SOIL_TINT = {
  alluvial: "var(--green)",
  acid_sulfate: "var(--amber)",
  saline: "var(--blue)",
  sandy: "var(--yellow-dark)",
};

export function VarietyAdvisor({ t }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(DEFAULT_ANSWERS);
  const { phase, start, reset } = useMockDelay(MATCH_MS);

  const showResult = phase !== "idle";

  function set(name, value) {
    setAnswers((current) => ({ ...current, [name]: value }));
  }

  function next() {
    if (step < STEP_KEYS.length - 1) setStep(step + 1);
    else start();
  }

  function restart() {
    reset();
    setStep(0);
    setAnswers(DEFAULT_ANSWERS);
  }

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={t("variety.eyebrow")}
        title={t("variety.title")}
        description={t("variety.description")}
      />

      <MockNotice>{t("common.placeholderScreen")}</MockNotice>

      {!showResult && (
        <div className="card">
          <WizardProgress
            stepLabel={t(`variety.steps.${STEP_KEYS[step]}`)}
            stepIndex={step}
            totalSteps={STEP_KEYS.length}
            countLabel={t("variety.stepCount", { step: step + 1, total: STEP_KEYS.length })}
          />

          <div className="wizard-step" key={step}>
            {step === 0 && <SoilStep answers={answers} set={set} t={t} />}
            {step === 1 && <ContextStep answers={answers} set={set} t={t} />}
            {step === 2 && <PriorityStep answers={answers} set={set} t={t} />}
          </div>

          <WizardActions
            onBack={() => setStep(step - 1)}
            onNext={next}
            backLabel={t("variety.back")}
            nextLabel={step === STEP_KEYS.length - 1 ? t("variety.findVariety") : t("variety.next")}
            backDisabled={step === 0}
          />
        </div>
      )}

      {phase === "running" && (
        <div className="card" aria-live="polite">
          <span className="analysis-label">{t("variety.matching")}</span>
          <SkeletonBlock className="large" />
        </div>
      )}

      {phase === "done" && <VarietyResult t={t} onRestart={restart} />}
    </div>
  );
}

function SoilStep({ answers, set, t }) {
  return (
    <fieldset className="wizard-fieldset">
      <legend className="section-title">{t("variety.soilQuestion")}</legend>
      <div className="soil-grid">
        {SOIL_TYPES.map((soil) => (
          <label
            key={soil}
            className={`soil-card${answers.soil === soil ? " selected" : ""}`}
            style={{ "--soil-tint": SOIL_TINT[soil] }}
          >
            <input
              type="radio"
              name="soil"
              value={soil}
              checked={answers.soil === soil}
              onChange={() => set("soil", soil)}
            />
            <SoilGlyph tint={SOIL_TINT[soil]} />
            <span className="soil-card-name">{t(`variety.soils.${soil}`)}</span>
            <span className="soil-card-hint">{t(`variety.soilHints.${soil}`)}</span>
            {answers.soil === soil && (
              <span className="soil-card-check" aria-hidden="true">
                <Check size={12} />
              </span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ContextStep({ answers, set, t }) {
  return (
    <fieldset className="wizard-fieldset">
      <legend className="section-title">{t("variety.contextQuestion")}</legend>

      <div className="field-row">
        <label htmlFor="variety-region">{t("variety.region")}</label>
        <select id="variety-region" value={answers.region} onChange={(e) => set("region", e.target.value)}>
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {t(`variety.regions.${region}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <label htmlFor="variety-season">{t("variety.season")}</label>
        <select id="variety-season" value={answers.season} onChange={(e) => set("season", e.target.value)}>
          {SEASONS.map((season) => (
            <option key={season} value={season}>
              {t(`variety.seasons.${season}`)}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}

function PriorityStep({ answers, set, t }) {
  return (
    <fieldset className="wizard-fieldset">
      <legend className="section-title">{t("variety.priorityQuestion")}</legend>
      <p className="muted-line">{t("variety.priorityHint")}</p>
      <div className="priority-group" role="radiogroup" aria-label={t("variety.priorityQuestion")}>
        {PRIORITIES.map((priority) => (
          <button
            key={priority}
            type="button"
            role="radio"
            aria-checked={answers.priority === priority}
            className={`priority-option${answers.priority === priority ? " selected" : ""}`}
            onClick={() => set("priority", priority)}
          >
            {t(`variety.priorities.${priority}`)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function VarietyResult({ t, onRestart }) {
  return (
    <>
      <div className="card variety-result">
        <div className="variety-result-head">
          <div className="variety-result-title">
            <span className="inline-icon green">
              <Sprout size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">{t("variety.recommended")}</p>
              <h3>{RECOMMENDATION.varietyName}</h3>
              <p className="result-sub">
                {t("variety.maturity", { days: RECOMMENDATION.maturityDays })}
              </p>
            </div>
          </div>
          <ConfidenceMeter
            value={RECOMMENDATION.matchScore}
            size={92}
            caption={t("variety.matchCaption")}
            ariaLabel={t("variety.matchAria", { pct: RECOMMENDATION.matchScore })}
          />
        </div>

        <p className="result-body">{t("variety.varietyDescription")}</p>

        <div className="factor-list">
          {RECOMMENDATION.attributes.map((attribute) => (
            <div className="factor-row" key={attribute.key}>
              <span className="factor-name factor-name-wide">
                {t(`variety.attributes.${attribute.key}`)}
              </span>
              <span className="factor-bar" aria-hidden="true">
                <span
                  className="factor-bar-fill"
                  style={{ width: `${attribute.score}%`, background: "var(--green)" }}
                />
              </span>
              <span className="factor-value">{attribute.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title">{t("variety.alternatives")}</div>
        {RUNNERS_UP.map((variety) => (
          <div className="runner-up-row" key={variety.varietyName}>
            <div>
              <strong>{variety.varietyName}</strong>
              <small>{t("variety.maturity", { days: variety.maturityDays })}</small>
            </div>
            <span className="chip chip-green">{t("variety.matchPct", { pct: variety.matchScore })}</span>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-ghost btn-full" onClick={onRestart}>
        <RotateCcw size={14} aria-hidden="true" />
        {t("variety.startOver")}
      </button>
    </>
  );
}

/** Abstract soil-profile glyph: topsoil band over a subsoil wash. */
function SoilGlyph({ tint }) {
  return (
    <svg className="soil-glyph" viewBox="0 0 48 32" aria-hidden="true">
      <rect x="0" y="0" width="48" height="32" rx="6" fill="var(--surface2)" />
      <rect x="0" y="6" width="48" height="9" fill={tint} opacity="0.85" />
      <rect x="0" y="15" width="48" height="7" fill={tint} opacity="0.45" />
      <rect x="0" y="22" width="48" height="10" fill={tint} opacity="0.2" />
      <circle cx="12" cy="10" r="1.6" fill="var(--surface)" opacity="0.6" />
      <circle cx="30" cy="11" r="1.2" fill="var(--surface)" opacity="0.5" />
      <circle cx="39" cy="9" r="1.8" fill="var(--surface)" opacity="0.45" />
    </svg>
  );
}
