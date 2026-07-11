import React from "react";
import { useState } from "react";
import { Check, Leaf, LocateFixed, Sprout } from "lucide-react";

import { WizardActions, WizardProgress } from "../components/SharedUI.jsx";

const STEP_KEYS = ["language", "field", "done"];

const LANGUAGE_OPTIONS = [
  { code: "vi", native: "Tiếng Việt" },
  { code: "en", native: "English" },
  { code: "mm", native: "မြန်မာဘာသာ" },
];

const CROPS = ["rice", "vegetables", "fruit_trees", "maize"];

/** First-run flow: pick a language, register the field once, land in the app.
 *  Rendered by App.jsx in place of the main shell until `services/profile.js`
 *  reports the farmer has been onboarded. */
export function Onboarding({ t, lang, setLang, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    farmerName: "",
    province: "",
    lat: null,
    lon: null,
    fieldArea: 2.4,
    cropType: "rice",
    plantingDate: "",
  });
  const [geoStatus, setGeoStatus] = useState("idle");

  function set(name, value) {
    setAnswers((current) => ({ ...current, [name]: value }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { setGeoStatus("unavailable"); return; }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAnswers((current) => ({
          ...current,
          lat: Number(pos.coords.latitude.toFixed(6)),
          lon: Number(pos.coords.longitude.toFixed(6)),
        }));
        setGeoStatus("ready");
      },
      (err) => setGeoStatus(err.code === 1 ? "denied" : "fallback"),
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }

  function finish(profile) {
    onComplete(profile);
  }

  function next() {
    if (step < STEP_KEYS.length - 1) setStep(step + 1);
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="onboarding-logo">
          <img src="/logo.svg" alt="" width={40} height={40} />
          <span className="onboarding-logo-name">Flood<span>Guard</span></span>
        </div>

        <WizardProgress
          stepLabel={t(`onboarding.steps.${STEP_KEYS[step]}`)}
          stepIndex={step}
          totalSteps={STEP_KEYS.length}
          countLabel={t("onboarding.stepCount", { step: step + 1, total: STEP_KEYS.length })}
        />

        <div className="wizard-step" key={step}>
          {step === 0 && (
            <LanguageStep t={t} lang={lang} setLang={setLang} />
          )}
          {step === 1 && (
            <FieldStep
              t={t}
              answers={answers}
              set={set}
              geoStatus={geoStatus}
              useCurrentLocation={useCurrentLocation}
            />
          )}
          {step === 2 && <DoneStep t={t} answers={answers} />}
        </div>

        {step < STEP_KEYS.length - 1 ? (
          <WizardActions
            onBack={() => setStep(step - 1)}
            onNext={next}
            backLabel={t("onboarding.back")}
            nextLabel={t("onboarding.continue")}
            backDisabled={step === 0}
          />
        ) : (
          <div className="wizard-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              {t("onboarding.back")}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => finish(answers)}>
              <Sprout size={14} aria-hidden="true" />
              {t("onboarding.enter")}
            </button>
          </div>
        )}

        {step === 1 && (
          <button
            type="button"
            className="onboarding-skip"
            onClick={() => finish({ ...answers, skipped: true })}
          >
            {t("onboarding.skip")}
          </button>
        )}
      </div>
    </div>
  );
}

function LanguageStep({ t, lang, setLang }) {
  return (
    <fieldset className="wizard-fieldset">
      <legend className="section-title">{t("onboarding.languageQuestion")}</legend>
      <div className="lang-choice-grid" role="radiogroup" aria-label={t("onboarding.languageQuestion")}>
        {LANGUAGE_OPTIONS.map((option) => (
          <button
            key={option.code}
            type="button"
            role="radio"
            aria-checked={lang === option.code}
            className={`lang-choice-card${lang === option.code ? " selected" : ""}`}
            onClick={() => setLang(option.code)}
          >
            <span className="lang-choice-native">{option.native}</span>
            {lang === option.code && (
              <span className="lang-choice-check" aria-hidden="true"><Check size={12} /></span>
            )}
          </button>
        ))}
      </div>
      <p className="onboarding-tagline">
        <Leaf size={16} aria-hidden="true" />
        {t("onboarding.tagline")}
      </p>
    </fieldset>
  );
}

function FieldStep({ t, answers, set, geoStatus, useCurrentLocation }) {
  return (
    <fieldset className="wizard-fieldset">
      <legend className="section-title">{t("onboarding.fieldQuestion")}</legend>

      <div className="field-row">
        <label htmlFor="onboarding-name">{t("onboarding.farmerName")}</label>
        <input
          id="onboarding-name"
          type="text"
          placeholder={t("onboarding.farmerNamePlaceholder")}
          value={answers.farmerName}
          onChange={(e) => set("farmerName", e.target.value)}
        />
      </div>

      <div className="field-row">
        <label htmlFor="onboarding-province">{t("onboarding.province")}</label>
        <input
          id="onboarding-province"
          type="text"
          placeholder={t("onboarding.provincePlaceholder")}
          value={answers.province}
          onChange={(e) => set("province", e.target.value)}
        />
      </div>

      <button type="button" className="btn btn-ghost btn-full onboarding-locate-btn" onClick={useCurrentLocation}>
        <LocateFixed size={14} aria-hidden="true" />
        {geoStatus === "loading" ? t("onboarding.locating") : t("onboarding.useLocation")}
      </button>
      {geoStatus === "ready" && <p className="onboarding-geo-note ok">{t("onboarding.locationCaptured")}</p>}
      {(geoStatus === "denied" || geoStatus === "unavailable") && (
        <p className="onboarding-geo-note">{t("onboarding.locationSkip")}</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
        <div className="field-row">
          <label htmlFor="onboarding-crop">{t("onboarding.crop")}</label>
          <select id="onboarding-crop" value={answers.cropType} onChange={(e) => set("cropType", e.target.value)}>
            {CROPS.map((crop) => (
              <option key={crop} value={crop}>{t(`crops.${crop}`)}</option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="onboarding-area">{t("onboarding.area")}</label>
          <input
            id="onboarding-area"
            type="number"
            min="0.1" max="100" step="0.1"
            value={answers.fieldArea}
            onChange={(e) => set("fieldArea", e.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <label htmlFor="onboarding-planting-date">{t("onboarding.plantingDate")}</label>
        <input
          id="onboarding-planting-date"
          className="date-picker-input"
          type="date"
          value={answers.plantingDate}
          onChange={(e) => set("plantingDate", e.target.value)}
        />
      </div>
    </fieldset>
  );
}

function DoneStep({ t, answers }) {
  return (
    <fieldset className="wizard-fieldset">
      <legend className="section-title">{t("onboarding.doneTitle")}</legend>
      <p className="onboarding-tagline">{t("onboarding.doneBody")}</p>
      <div className="onboarding-summary">
        <div className="onboarding-summary-row">
          <span>{t("onboarding.crop")}</span>
          <strong>{t(`crops.${answers.cropType}`)}</strong>
        </div>
        <div className="onboarding-summary-row">
          <span>{t("onboarding.area")}</span>
          <strong>{Number(answers.fieldArea).toFixed(1)} ha</strong>
        </div>
        <div className="onboarding-summary-row">
          <span>{t("onboarding.province")}</span>
          <strong>{answers.province || t("onboarding.notSet")}</strong>
        </div>
      </div>
    </fieldset>
  );
}
