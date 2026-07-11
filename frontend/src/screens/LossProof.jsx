import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, ClipboardCheck } from "lucide-react";

import { ChecklistItem, DataBanner, ScreenHeader, WizardActions, WizardProgress } from "../components/SharedUI.jsx";
import { EvidenceDonut } from "../components/charts/EvidenceDonut.jsx";
import { apiUrl, postLossReport } from "../services/api.js";
import { getProfile } from "../services/profile.js";

const STEP_KEYS = ["photos", "details", "review"];

const maxPhotoBytes = 5 * 1024 * 1024;
const acceptedPhotoTypes = ["image/jpeg", "image/png"];

const PHOTO_SLOTS = [
  { key: "before", labelKey: "proof.beforeFlood",     hintKey: "proof.slotHints.before", required: true  },
  { key: "after",  labelKey: "proof.afterFlood",      hintKey: "proof.slotHints.after",  required: true  },
  { key: "crop",   labelKey: "proof.cropCloseup",     hintKey: "proof.slotHints.crop",   required: false },
  { key: "water",  labelKey: "proof.waterDepthPhoto", hintKey: "proof.slotHints.water",  required: false },
];

const RATE_HIGH = 4600000;
const RATE_MID  = 2000000;

function buildInitialForm() {
  const profile = getProfile();
  return {
    farmer_name: profile.farmerName || "",
    field_id: profile.fieldId || "",
    crop_type: profile.cropType || "rice",
    area_ha: profile.fieldArea || 2.4,
    loss_pct: 65,
    flood_duration: "2-5days",
    lat: profile.lat ?? 10.52,
    lon: profile.lon ?? 105.12,
  };
}

function computeComp(area, loss) {
  const rate = loss >= 70 ? RATE_HIGH : loss >= 30 ? RATE_MID : 0;
  return (area * (loss / 100) * rate / 1000000).toFixed(1);
}

export function LossProof({ t }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(buildInitialForm);
  const [touched, setTouched] = useState({});
  const [slotFiles, setSlotFiles] = useState({ before: null, after: null, crop: null, water: null });
  const [slotPreviews, setSlotPreviews] = useState({ before: null, after: null, crop: null, water: null });
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [state, setState] = useState({ loading: false, payload: null, error: null });
  const [blockedReason, setBlockedReason] = useState(null);

  const refBefore = useRef(null);
  const refAfter  = useRef(null);
  const refCrop   = useRef(null);
  const refWater  = useRef(null);
  const slotRefs  = { before: refBefore, after: refAfter, crop: refCrop, water: refWater };

  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus("unavailable"); return; }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((c) => ({ ...c, lat: Number(pos.coords.latitude.toFixed(6)), lon: Number(pos.coords.longitude.toFixed(6)) }));
        setGpsStatus("ready");
      },
      (err) => setGpsStatus(err.code === 1 ? "denied" : "fallback"),
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }, []);

  useEffect(() => {
    const previews = slotPreviews;
    return () => { Object.values(previews).forEach(url => { if (url) URL.revokeObjectURL(url); }); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const photos = useMemo(
    () => PHOTO_SLOTS.map(s => slotFiles[s.key]).filter(Boolean),
    [slotFiles],
  );

  const photoStatus = useMemo(() => ({
    invalidType: photos.filter((p) => !acceptedPhotoTypes.includes(p.type)),
    tooLarge: photos.filter((p) => p.size > maxPhotoBytes),
  }), [photos]);

  const requiredSlotsReady = PHOTO_SLOTS
    .filter((slot) => slot.required)
    .every((slot) => {
      const file = slotFiles[slot.key];
      return file && acceptedPhotoTypes.includes(file.type) && file.size <= maxPhotoBytes;
    });
  const requiredSlotCount = PHOTO_SLOTS.filter((slot) => slot.required).length;
  const filledRequiredCount = PHOTO_SLOTS.filter((slot) => slot.required && slotFiles[slot.key]).length;

  // A GPS fix only counts as "done" when a real or fallback coordinate was
  // actually captured — `denied`/`unavailable` still let the farmer submit
  // (see validateProof), but showing a green check for them would be a false
  // positive since no location was recorded.
  const checklist = useMemo(() => ({
    gpsReady: ["ready", "fallback"].includes(gpsStatus),
    photoCountReady: photos.length >= 2 && photos.length <= 6,
    photoFilesReady: photos.length > 0 && photoStatus.invalidType.length === 0 && photoStatus.tooLarge.length === 0,
    reportReady: Boolean(state.payload?.data),
  }), [gpsStatus, photos, photoStatus, state.payload]);

  const data = state.payload?.data;

  const photoScore = Math.min(50, photos.length * 25);
  const fieldScore = form.farmer_name.trim() ? 32 : 20;
  const proofPct = Math.min(100, photoScore + fieldScore);
  const comp = computeComp(form.area_ha, form.loss_pct);

  const detailErrors = validateDetails(form, t);
  const detailsInvalid = Object.keys(detailErrors).length > 0;

  function fieldError(name) {
    return touched[name] ? detailErrors[name] : undefined;
  }

  function setSlotFile(key, file) {
    if (!file) {
      setSlotFiles(c => ({ ...c, [key]: null }));
      setSlotPreviews(c => {
        if (c[key]) URL.revokeObjectURL(c[key]);
        return { ...c, [key]: null };
      });
      return;
    }
    const preview = URL.createObjectURL(file);
    setSlotFiles(c => ({ ...c, [key]: file }));
    setSlotPreviews(c => {
      if (c[key]) URL.revokeObjectURL(c[key]);
      return { ...c, [key]: preview };
    });
  }

  function update(name, value) {
    setForm((c) => ({ ...c, [name]: value }));
    setTouched((c) => ({ ...c, [name]: true }));
  }

  function restart() {
    setStep(0);
    setForm(buildInitialForm());
    setTouched({});
    setSlotFiles({ before: null, after: null, crop: null, water: null });
    setSlotPreviews((current) => {
      Object.values(current).forEach((url) => { if (url) URL.revokeObjectURL(url); });
      return { before: null, after: null, crop: null, water: null };
    });
    setState({ loading: false, payload: null, error: null });
    setBlockedReason(null);
  }

  async function submit() {
    setTouched({ farmer_name: true, field_id: true, area_ha: true, loss_pct: true });
    const nextErrors = validateProof({ form, photos, photoStatus, gpsStatus, t });
    if (Object.keys(nextErrors).length > 0) {
      setBlockedReason(Object.values(nextErrors)[0]);
      return;
    }
    setBlockedReason(null);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    photos.forEach((p) => formData.append("photos", p));
    setState((c) => ({ ...c, loading: true, error: null }));
    try {
      const payload = await postLossReport(formData);
      setState({ loading: false, payload, error: null });
    } catch (error) {
      setState((c) => ({ loading: false, payload: c.payload, error }));
    }
  }

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={t("proof.eyebrow")}
        title={t("proof.title")}
        description={t("proof.description")}
      />

      {data ? (
        <ProofResult payload={state.payload} t={t} onRestart={restart} />
      ) : (
        <div className="card">
          <WizardProgress
            stepLabel={t(`proof.steps.${STEP_KEYS[step]}`)}
            stepIndex={step}
            totalSteps={STEP_KEYS.length}
            countLabel={t("proof.stepCount", { step: step + 1, total: STEP_KEYS.length })}
          />

          <div className="wizard-step" key={step}>
            {step === 0 && (
              <PhotosStep
                t={t}
                slotPreviews={slotPreviews}
                slotRefs={slotRefs}
                setSlotFile={setSlotFile}
                filledRequiredCount={filledRequiredCount}
                requiredSlotCount={requiredSlotCount}
                requiredSlotsReady={requiredSlotsReady}
              />
            )}
            {step === 1 && (
              <DetailsStep t={t} form={form} update={update} fieldError={fieldError} />
            )}
            {step === 2 && (
              <ReviewStep
                t={t}
                form={form}
                proofPct={proofPct}
                comp={comp}
                gpsStatus={gpsStatus}
                checklist={checklist}
                photos={photos}
                data={data}
                state={state}
              />
            )}
          </div>

          {step < 2 ? (
            <WizardActions
              onBack={() => setStep(step - 1)}
              onNext={() => setStep(step + 1)}
              backLabel={t("proof.back")}
              nextLabel={t("proof.next")}
              backDisabled={step === 0}
              nextDisabled={step === 0 ? !requiredSlotsReady : detailsInvalid}
            />
          ) : (
            <div className="wizard-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                {t("proof.back")}
              </button>
              <button type="button" className="btn btn-primary" onClick={submit} disabled={state.loading}>
                {state.loading ? t("common.loading") : t("proof.submit")}
              </button>
            </div>
          )}

          {blockedReason && <DataBanner tone="error">{blockedReason}</DataBanner>}
          {state.error && <DataBanner tone="error">{t("common.loadError")}</DataBanner>}
        </div>
      )}
    </div>
  );
}

function PhotosStep({ t, slotPreviews, slotRefs, setSlotFile, filledRequiredCount, requiredSlotCount, requiredSlotsReady }) {
  return (
    <fieldset className="wizard-fieldset">
      <legend className="section-title">{t("proof.photoEvidence")}</legend>
      <p style={{ fontSize: 12, color: "var(--text2)", marginTop: -4, marginBottom: 14, lineHeight: 1.6 }}>
        {t("proof.photoInstruction")}
      </p>
      <div className="photo-grid">
        {PHOTO_SLOTS.map(({ key, labelKey, hintKey, required }) => {
          const preview = slotPreviews[key];
          const inputRef = slotRefs[key];
          return (
            <div key={key} className="photo-upload-slot">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                style={{ display: "none" }}
                onChange={(e) => { if (e.target.files[0]) setSlotFile(key, e.target.files[0]); e.target.value = ""; }}
              />
              {preview ? (
                <div
                  className="photo-upload-filled"
                  onClick={() => inputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                  aria-label={t(labelKey)}
                >
                  <img src={preview} alt={t(labelKey)} className="photo-upload-img" />
                  <div className="photo-upload-check-badge">
                    <Check size={11} color="white" aria-hidden="true" />
                  </div>
                  <div className="photo-upload-overlay">
                    <span className="photo-upload-overlay-label">{t(labelKey)}</span>
                    <button
                      type="button"
                      className="photo-upload-change-btn"
                      onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                    >
                      {t("proof.changePhoto")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={`photo-upload-empty${required ? " slot-required" : ""}`}
                  onClick={() => inputRef.current?.click()}
                  aria-label={`${t(labelKey)} — ${required ? t("proof.requiredBadge") : t("proof.optionalBadge")}`}
                >
                  <Camera size={22} aria-hidden="true" />
                  <span className="photo-upload-label">{t(labelKey)}</span>
                  <span className="photo-upload-hint">{t(hintKey)}</span>
                  <span className={`photo-badge ${required ? "photo-badge-required" : "photo-badge-optional"}`}>
                    {required ? t("proof.requiredBadge") : t("proof.optionalBadge")}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className={`step-progress-note${requiredSlotsReady ? " ready" : ""}`}>
        {requiredSlotsReady ? <Check size={13} aria-hidden="true" /> : null}
        {t("proof.requiredPhotoProgress", { count: filledRequiredCount, total: requiredSlotCount })}
      </p>
      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
        {t("proof.photoGpsNote")}
      </div>
    </fieldset>
  );
}

function DetailsStep({ t, form, update, fieldError }) {
  return (
    <fieldset className="wizard-fieldset">
      <legend className="section-title">{t("proof.fieldDamageDetails")}</legend>

      <div className="field-row">
        <label>{t("proof.fieldId")}</label>
        <input
          type="text"
          placeholder={t("proof.fieldIdPlaceholder")}
          value={form.field_id}
          onChange={(e) => update("field_id", e.target.value)}
        />
        {fieldError("field_id") ? (
          <small className="field-error">{fieldError("field_id")}</small>
        ) : (
          <small>{t("proof.fieldIdHint")}</small>
        )}
      </div>

      <div className="field-row">
        <label>{t("proof.farmerName")}</label>
        <input type="text" value={form.farmer_name} onChange={(e) => update("farmer_name", e.target.value)} />
        {fieldError("farmer_name") && <small className="field-error">{fieldError("farmer_name")}</small>}
      </div>

      <div className="field-row">
        <label>{t("proof.crop")}</label>
        <select value={form.crop_type} onChange={(e) => update("crop_type", e.target.value)}>
          <option value="rice">{t("proof.cropOptions.riceWinter")}</option>
          <option value="maize">{t("crops.maize")}</option>
          <option value="vegetables">{t("crops.vegetables")}</option>
          <option value="fruit_trees">{t("crops.fruit_trees")}</option>
        </select>
      </div>

      <div className="field-row">
        <label>{t("proof.area")}</label>
        <div className="damage-slider-row">
          <input
            type="range" min="0" max="5" step="0.1"
            value={form.area_ha}
            onChange={(e) => update("area_ha", parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <span className="damage-pct" style={{ color: "var(--text)" }}>{Number(form.area_ha).toFixed(1)} ha</span>
        </div>
      </div>

      <div className="field-row">
        <label>{t("proof.lossPct")}</label>
        <div className="damage-slider-row">
          <input
            type="range" min="0" max="100" step="5"
            value={form.loss_pct}
            onChange={(e) => update("loss_pct", parseInt(e.target.value))}
            style={{ flex: 1 }}
          />
          <span className="damage-pct">{form.loss_pct}%</span>
        </div>
      </div>

      <div className="field-row">
        <label>{t("proof.floodDuration")}</label>
        <select value={form.flood_duration} onChange={(e) => update("flood_duration", e.target.value)}>
          <option value="<1day">{t("proof.durationOptions.<1day")}</option>
          <option value="2-5days">{t("proof.durationOptions.2-5days")}</option>
          <option value="6-10days">{t("proof.durationOptions.6-10days")}</option>
          <option value=">10days">{t("proof.durationOptions.>10days")}</option>
        </select>
      </div>
    </fieldset>
  );
}

function ReviewStep({ t, form, proofPct, comp, gpsStatus, checklist }) {
  return (
    <>
      {/* Legal context */}
      <div className="card" style={{ borderColor: "rgba(59,130,246,0.25)", background: "rgba(59,130,246,0.04)", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div className="inline-icon blue"><ClipboardCheck size={20} aria-hidden="true" /></div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)" }}>{t("proof.lossDocTitle")}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3, lineHeight: 1.5 }}>
              {t("proof.lossDocDesc")}
            </div>
          </div>
        </div>
      </div>

      {/* Proof score */}
      <div className="proof-status" style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 14 }}>
        <EvidenceDonut pct={proofPct} label={t("proof.evidenceCompleteness")} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t("proof.evidenceCompleteness")}</div>
          <div style={{ fontSize: 11, color: "var(--text2)" }}>
            {proofPct >= 100
              ? t("proof.evidenceComplete")
              : proofPct >= 80
              ? t("proof.evidenceNearComplete")
              : t("proof.evidenceIncomplete")}
          </div>
        </div>
      </div>

      {/* Compensation estimate */}
      <div className="card" style={{ borderColor: "rgba(0,201,123,0.2)", marginBottom: 14 }}>
        <div className="section-title">{t("proof.estCompensation")}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: "var(--green)", fontFamily: "var(--mono)" }}>
            {comp}M
          </span>
          <span style={{ fontSize: 14, color: "var(--text2)" }}>VND</span>
        </div>
        <details className="disclosure">
          <summary>{t("harvest.seeCalculation")}</summary>
          <div className="disclosure-body" style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
            {t("proof.compensationFormula", {
              area: Number(form.area_ha).toFixed(1),
              loss: form.loss_pct,
              rate: (form.loss_pct >= 70 ? RATE_HIGH : RATE_MID).toLocaleString(),
              band: form.loss_pct >= 70 ? ">=70%" : "30-70%",
            })}
            <br />
            {t("proof.rateApplied")}
          </div>
        </details>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>
          {t("proof.processingTime")}
        </div>
      </div>

      {/* Checklist */}
      <div className="card">
        <div className="section-title">{t("proof.evidenceChecklist")}</div>
        <div className="checklist-panel">
          <ChecklistItem done={checklist.gpsReady} label={t("proof.checklist.gps")} detail={t(`proof.gpsStatus.${gpsStatus}`)} />
          <ChecklistItem done={checklist.photoCountReady} label={t("proof.checklist.photoCount")} />
          <ChecklistItem done={checklist.photoFilesReady} label={t("proof.checklist.photoFiles")} detail={t("proof.photoRequirement")} />
        </div>
      </div>
    </>
  );
}

function ProofResult({ payload, t, onRestart }) {
  const data = payload.data;
  const compensation = Number(data.compensation.compensation_million_vnd).toFixed(1);
  return (
    <div className="screen-stack">
      {payload.fromCache && <DataBanner>{t("common.staleData", { time: formatDateTime(payload.updatedAt) })}</DataBanner>}
      {payload.demo && <DataBanner tone="info">{t("common.demoData")}</DataBanner>}
      <div className="card" style={{ borderColor: "rgba(0,201,123,0.25)", background: "rgba(0,201,123,0.04)" }}>
        <div className="section-title">{t("proof.reportId")}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--green)", marginBottom: 4 }}>{data.report_id}</div>
        <div style={{ fontSize: 12, color: "var(--text2)" }}>
          {t("proof.completeness")}: {data.evidence_completeness_pct}% ·{" "}
          {t("proof.photosAccepted")}: {data.photos_accepted} ·{" "}
          {t("proof.compensation")}: {compensation} {t("common.millionVnd")}
        </div>
      </div>
      <div className="card">
        <div className="section-title">{t("proof.documents")}</div>
        <div className="document-list">
          {(data.required_documents.length ? data.required_documents : [
            t("proof.demoDocuments.request"),
            t("proof.demoDocuments.damageRecord"),
            t("proof.demoDocuments.gpsPhotos"),
            t("proof.demoDocuments.landCertificate"),
          ]).map((doc) => <p key={doc}>{doc}</p>)}
        </div>
        {data.pdf_url ? (
          <a className="primary-link" href={apiUrl(data.pdf_url)} target="_blank" rel="noreferrer">{t("proof.openPdf")}</a>
        ) : (
          <p className="source-line">{t("proof.noPdf")}</p>
        )}
      </div>
      <button type="button" className="btn btn-ghost btn-full" onClick={onRestart}>
        {t("proof.newReport")}
      </button>
    </div>
  );
}

function validateDetails(form, t) {
  const errors = {};
  if (!form.farmer_name.trim()) errors.farmer_name = t("proof.validation.farmerName");
  if (!form.field_id.trim()) errors.field_id = t("proof.validation.fieldId");
  if (!(Number(form.area_ha) > 0)) errors.area_ha = t("proof.validation.area");
  if (!isInRange(form.loss_pct, 0, 100)) errors.loss_pct = t("proof.validation.lossPct");
  return errors;
}

function validateProof({ form, photos, photoStatus, gpsStatus, t }) {
  const errors = validateDetails(form, t);
  if (photos.length < 2 || photos.length > 6) {
    errors.photos = t("proof.validation.photoCount");
  } else if (photoStatus.invalidType.length > 0) {
    errors.photos = t("proof.validation.photoType");
  } else if (photoStatus.tooLarge.length > 0) {
    errors.photos = t("proof.validation.photoSize");
  }
  if (gpsStatus === "idle" || gpsStatus === "loading") errors.gps = t("proof.validation.gps");
  return errors;
}

function isInRange(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}
