import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardCheck, ImagePlus, MapPin, Waves, Wheat } from "lucide-react";

import { ChecklistItem, DataBanner, ScreenHeader } from "../components/SharedUI.jsx";
import { EvidenceDonut } from "../components/charts/EvidenceDonut.jsx";
import { apiUrl, postLossReport } from "../services/api.js";

const maxPhotoBytes = 5 * 1024 * 1024;
const acceptedPhotoTypes = ["image/jpeg", "image/png"];
const photoTypeOptions = ["before", "after", "field", "damage"];

const RATE_HIGH = 4600000;
const RATE_MID  = 2000000;

const initialForm = {
  farmer_name: "",
  field_id: "AG-TCPU-2024-00847",
  crop_type: "rice",
  area_ha: 2.4,
  loss_pct: 65,
  flood_duration: "2-5days",
  lat: 10.52,
  lon: 105.12,
};

function computeComp(area, loss) {
  const rate = loss >= 70 ? RATE_HIGH : loss >= 30 ? RATE_MID : 0;
  return (area * (loss / 100) * rate / 1000000).toFixed(1);
}

export function LossProof({ t }) {
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState([]);
  const [photoTypes, setPhotoTypes] = useState({});
  const [hasCropPhoto, setHasCropPhoto] = useState(false);
  const [hasWaterPhoto, setHasWaterPhoto] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ loading: false, payload: null, error: null });

  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus("unavailable"); return; }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((c) => ({ ...c, lat: Number(pos.coords.latitude.toFixed(6)), lon: Number(pos.coords.longitude.toFixed(6)) }));
        localStorage.setItem("fg_field_lat", pos.coords.latitude.toFixed(6));
        localStorage.setItem("fg_field_lon", pos.coords.longitude.toFixed(6));
        setGpsStatus("ready");
      },
      (err) => setGpsStatus(err.code === 1 ? "denied" : "fallback"),
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }, []);

  const photoStatus = useMemo(() => ({
    invalidType: photos.filter((p) => !acceptedPhotoTypes.includes(p.type)),
    tooLarge: photos.filter((p) => p.size > maxPhotoBytes),
  }), [photos]);

  const checklist = useMemo(() => ({
    gpsReady: ["ready", "fallback", "denied", "unavailable"].includes(gpsStatus),
    photoCountReady: photos.length >= 2 && photos.length <= 6,
    photoFilesReady: photos.length > 0 && photoStatus.invalidType.length === 0 && photoStatus.tooLarge.length === 0,
    reportReady: Boolean(state.payload?.data),
  }), [gpsStatus, photos, photoStatus, state.payload]);

  const data = state.payload?.data;

  const totalPhotos = 2 + (hasCropPhoto ? 1 : 0) + (hasWaterPhoto ? 1 : 0);
  const photoScore = Math.min(50, totalPhotos * 25);
  const fieldScore = form.farmer_name.trim() ? 32 : 20;
  const proofPct = Math.min(100, photoScore + fieldScore);
  const comp = computeComp(form.area_ha, form.loss_pct);

  function update(name, value) {
    setForm((c) => ({ ...c, [name]: value }));
    setErrors((c) => { const n = { ...c }; delete n[name]; return n; });
  }

  function updatePhotos(fileList) {
    const next = Array.from(fileList);
    setPhotos(next);
    setPhotoTypes(Object.fromEntries(next.map((p, i) => [p.name, photoTypeOptions[i] || "damage"])));
    setErrors((c) => { const n = { ...c }; delete n.photos; return n; });
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validateProof({ form, photos, photoStatus, gpsStatus, t });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
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

      {state.payload?.fromCache && <DataBanner>{t("common.staleData", { time: formatDateTime(state.payload.updatedAt) })}</DataBanner>}
      {state.payload?.demo && <DataBanner tone="info">{t("common.demoData")}</DataBanner>}
      {state.error && <DataBanner tone="error">{t("common.loadError")}</DataBanner>}

      {/* Legal context */}
      <div className="card" style={{ borderColor: "rgba(59,130,246,0.25)", background: "rgba(59,130,246,0.04)" }}>
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

      {/* Photo evidence grid */}
      <div className="card">
        <div className="section-title">{t("proof.photoEvidence")}</div>
        <div className="photo-grid">
          {/* Before flood (pre-filled demo) */}
          <div className="photo-filled">
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1a2a1a,#2a3a2a)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
              <Wheat size={30} color="rgba(255,255,255,0.78)" aria-hidden="true" />
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{t("proof.beforeFlood")}</div>
            </div>
            <div className="photo-filled-overlay"><MapPin size={11} aria-hidden="true" /> 10.4512N, 105.2341E · 02/05 06:14</div>
          </div>
          {/* After flood (pre-filled demo) */}
          <div className="photo-filled">
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#0d1a2a,#1a2a3a)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
              <Waves size={30} color="rgba(255,255,255,0.78)" aria-hidden="true" />
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{t("proof.afterFlood")}</div>
            </div>
            <div className="photo-filled-overlay"><MapPin size={11} aria-hidden="true" /> 10.4512N, 105.2341E · 05/05 09:31</div>
          </div>
          {/* Extra photo slots — independent state */}
          {!hasCropPhoto && (
            <div
              className="photo-slot"
              role="button"
              tabIndex={0}
              onClick={() => setHasCropPhoto(true)}
              onKeyDown={(e) => e.key === "Enter" && setHasCropPhoto(true)}
            >
              <ImagePlus size={22} aria-hidden="true" />
              <span>{t("proof.cropCloseup")}</span>
            </div>
          )}
          {!hasWaterPhoto && (
            <div
              className="photo-slot"
              role="button"
              tabIndex={0}
              onClick={() => setHasWaterPhoto(true)}
              onKeyDown={(e) => e.key === "Enter" && setHasWaterPhoto(true)}
            >
              <ImagePlus size={22} aria-hidden="true" />
              <span>{t("proof.waterDepthPhoto")}</span>
            </div>
          )}
          {hasCropPhoto && (
            <div className="photo-filled">
              <div style={{ width: "100%", height: "100%", background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={30} color="var(--green)" aria-hidden="true" />
              </div>
              <div className="photo-filled-overlay" style={{ color: "var(--green)" }}>{t("proof.cropCloseup")}</div>
            </div>
          )}
          {hasWaterPhoto && (
            <div className="photo-filled">
              <div style={{ width: "100%", height: "100%", background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={30} color="var(--green)" aria-hidden="true" />
              </div>
              <div className="photo-filled-overlay" style={{ color: "var(--green)" }}>{t("proof.waterDepthPhoto")}</div>
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)" }}>
          {t("proof.photoGpsNote")}
        </div>
      </div>

      {/* Field & damage details */}
      <form onSubmit={submit}>
        <div className="card">
          <div className="section-title">{t("proof.fieldDamageDetails")}</div>

          <div className="field-row">
            <label>{t("proof.fieldId")}</label>
            <input type="text" value={form.field_id} onChange={(e) => update("field_id", e.target.value)} />
            {errors.field_id && <small className="field-error">{errors.field_id}</small>}
          </div>

          <div className="field-row">
            <label>{t("proof.farmerName")}</label>
            <input type="text" value={form.farmer_name} onChange={(e) => update("farmer_name", e.target.value)} />
            {errors.farmer_name && <small className="field-error">{errors.farmer_name}</small>}
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
                type="range"
                min="0" max="5" step="0.1"
                value={form.area_ha}
                onChange={(e) => update("area_ha", parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <span className="damage-pct" style={{ color: "var(--text)" }}>{Number(form.area_ha).toFixed(1)} ha</span>
            </div>
            {errors.area_ha && <small className="field-error">{errors.area_ha}</small>}
          </div>

          <div className="field-row">
            <label>{t("proof.lossPct")}</label>
            <div className="damage-slider-row">
              <input
                type="range"
                min="0" max="100" step="5"
                value={form.loss_pct}
                onChange={(e) => update("loss_pct", parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span className="damage-pct">{form.loss_pct}%</span>
            </div>
            {errors.loss_pct && <small className="field-error">{errors.loss_pct}</small>}
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

          {/* File upload for real submission */}
          <div className="field-row" style={{ marginTop: 8 }}>
            <label>{t("proof.photos")}</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              multiple
              onChange={(e) => updatePhotos(e.target.files)}
            />
            <small style={{ color: "var(--text3)", fontSize: 11 }}>{t("proof.photoRequirement")}</small>
            {errors.photos && <small className="field-error">{errors.photos}</small>}
            {errors.gps && <small className="field-error">{errors.gps}</small>}
          </div>
        </div>

        {/* Proof score */}
        <div className="proof-status" style={{ display: "flex", gap: 16, alignItems: "center" }}>
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
        <div className="card" style={{ borderColor: "rgba(0,201,123,0.2)" }}>
          <div className="section-title">{t("proof.estCompensation")}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: "var(--green)", fontFamily: "var(--mono)" }}>
              {comp}M
            </span>
            <span style={{ fontSize: 14, color: "var(--text2)" }}>VND</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, marginBottom: 14 }}>
            {t("proof.compensationFormula", {
              area: Number(form.area_ha).toFixed(1),
              loss: form.loss_pct,
              rate: (form.loss_pct >= 70 ? RATE_HIGH : RATE_MID).toLocaleString(),
              band: form.loss_pct >= 70 ? ">=70%" : "30-70%",
            })}
            <br />
            {t("proof.rateApplied")}
          </div>
          <button
            type="submit"
            className="primary-action"
            disabled={state.loading}
          >
            {state.loading ? t("common.loading") : t("proof.submit")}
          </button>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8, textAlign: "center" }}>
            {t("proof.processingTime")}
          </div>
        </div>
      </form>

      {/* Checklist */}
      <div className="card">
        <div className="section-title">{t("proof.evidenceChecklist")}</div>
        <div className="checklist-panel">
          <ChecklistItem done={checklist.gpsReady} label={t("proof.checklist.gps")} detail={t(`proof.gpsStatus.${gpsStatus}`)} />
          <ChecklistItem done={checklist.photoCountReady} label={t("proof.checklist.photoCount")} detail={t("common.items", { count: photos.length })} />
          <ChecklistItem done={checklist.photoFilesReady} label={t("proof.checklist.photoFiles")} detail={t("proof.photoRequirement")} />
          <ChecklistItem done={checklist.reportReady} label={t("proof.checklist.report")} detail={data ? data.report_id : t("common.notReady")} />
        </div>
      </div>

      {/* Photo list (uploaded files) */}
      {photos.length > 0 && (
        <div className="card">
          <div className="section-title">{t("proof.selectedPhotos")} · {t("common.items", { count: photos.length })}</div>
          <div className="photo-list">
            {photos.map((photo) => {
              const validType = acceptedPhotoTypes.includes(photo.type);
              const validSize = photo.size <= maxPhotoBytes;
              return (
                <div className="photo-row" key={`${photo.name}-${photo.lastModified}`}>
                  <div>
                    <strong>{photo.name}</strong>
                    <small>{formatBytes(photo.size)} · {validType && validSize ? t("common.valid") : t("common.invalid")}</small>
                  </div>
                  <select
                    value={photoTypes[photo.name] || "damage"}
                    onChange={(e) => setPhotoTypes((c) => ({ ...c, [photo.name]: e.target.value }))}
                    aria-label={t("proof.photoType")}
                  >
                    {photoTypeOptions.map((type) => (
                      <option value={type} key={type}>{t(`proof.photoTypes.${type}`)}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data && <ProofResult data={data} t={t} />}
    </div>
  );
}

function ProofResult({ data, t }) {
  const compensation = Number(data.compensation.compensation_million_vnd).toFixed(1);
  return (
    <div className="screen-stack">
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
    </div>
  );
}

function validateProof({ form, photos, photoStatus, gpsStatus, t }) {
  const errors = {};
  if (!form.farmer_name.trim()) errors.farmer_name = t("proof.validation.farmerName");
  if (!form.field_id.trim()) errors.field_id = t("proof.validation.fieldId");
  if (!(Number(form.area_ha) > 0)) errors.area_ha = t("proof.validation.area");
  if (!isInRange(form.loss_pct, 0, 100)) errors.loss_pct = t("proof.validation.lossPct");
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

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}
