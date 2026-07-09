import React from "react";
import { useState } from "react";
import { Camera, ChevronDown, Leaf, MapPin, RotateCcw } from "lucide-react";

import { MockNotice, ScreenHeader, SkeletonBlock } from "../components/SharedUI.jsx";
import { ConfidenceMeter } from "../components/charts/ConfidenceMeter.jsx";
import { useMockDelay } from "../hooks/useMockDelay.js";
import { ANALYSIS_MS, DETECTION, RECENT_NEARBY, SEVERITY_STYLE } from "../mocks/disease.js";

export function DiseaseDetection({ t }) {
  const { phase, start, reset } = useMockDelay(ANALYSIS_MS);

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={t("disease.eyebrow")}
        title={t("disease.title")}
        description={t("disease.description")}
      />

      <MockNotice>{t("common.placeholderScreen")}</MockNotice>

      <div className="card">
        <div className="section-title">{t("disease.captureTitle")}</div>

        {phase === "idle" && (
          <button type="button" className="dropzone" onClick={start}>
            <div className="dropzone-icon">
              <Camera size={28} aria-hidden="true" />
            </div>
            <span className="dropzone-title">{t("disease.dropzoneTitle")}</span>
            <span className="dropzone-hint">{t("disease.dropzoneHint")}</span>
          </button>
        )}

        {phase !== "idle" && (
          <div className="leaf-preview">
            <LeafSample />
            <div className="leaf-preview-meta">
              <span className="leaf-preview-name">{t("disease.sampleFileName")}</span>
              <button type="button" className="btn btn-ghost leaf-preview-reset" onClick={reset}>
                <RotateCcw size={13} aria-hidden="true" />
                {t("disease.retake")}
              </button>
            </div>
          </div>
        )}

        {phase === "running" && (
          <div className="analysis-strip" aria-live="polite">
            <span className="analysis-label">{t("disease.analysing")}</span>
            <SkeletonBlock className="thin" />
            <SkeletonBlock className="thin" />
          </div>
        )}
      </div>

      {phase === "done" && <DetectionResult t={t} />}

      {phase === "done" && (
        <div className="card">
          <div className="section-title">{t("disease.nearbyTitle")}</div>
          <p className="muted-line">{t("disease.nearbyDesc")}</p>
          <div className="nearby-strip">
            {RECENT_NEARBY.map((item) => (
              <div className="nearby-chip" key={item.id}>
                <div
                  className="nearby-chip-swatch"
                  style={{ background: SEVERITY_STYLE[item.severity].color }}
                  aria-hidden="true"
                >
                  <Leaf size={14} />
                </div>
                <div className="nearby-chip-text">
                  <strong>{t(`disease.names.${item.diseaseKey}`)}</strong>
                  <small>
                    <MapPin size={10} aria-hidden="true" />
                    {t("disease.nearbyMeta", { km: item.distanceKm, days: item.daysAgo })}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetectionResult({ t }) {
  const { color, dim } = SEVERITY_STYLE[DETECTION.severity];

  return (
    <div className="card result-card" style={{ borderColor: color }}>
      <div className="result-rail" style={{ background: color }} />

      <div className="result-head">
        <div>
          <span className="chip" style={{ background: dim, color, borderColor: color }}>
            {t(`disease.severity.${DETECTION.severity}`)}
          </span>
          <h3 className="result-title">{t(`disease.names.${DETECTION.diseaseKey}`)}</h3>
          <p className="result-sub">
            {t("disease.affectedArea", { pct: DETECTION.affectedAreaPct })}
          </p>
        </div>
        <ConfidenceMeter
          value={DETECTION.confidence}
          color={color}
          size={88}
          caption={t("disease.confidenceCaption")}
          ariaLabel={t("disease.confidenceAria", { pct: DETECTION.confidence })}
        />
      </div>

      <p className="result-body">{t(`disease.descriptions.${DETECTION.diseaseKey}`)}</p>

      <div className="section-title">{t("disease.treatmentTitle")}</div>
      {DETECTION.treatmentKeys.map((key, index) => (
        <TreatmentStep
          key={key}
          index={index + 1}
          title={t(`disease.treatments.${key}.title`)}
          body={t(`disease.treatments.${key}.body`)}
          defaultOpen={index === 0}
        />
      ))}
    </div>
  );
}

function TreatmentStep({ index, title, body, defaultOpen }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  return (
    <div className={`treatment-step${open ? " open" : ""}`}>
      <button
        type="button"
        className="treatment-step-head"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="step-num-circle">{index}</span>
        <span className="treatment-step-title">{title}</span>
        <ChevronDown size={16} className="treatment-step-chevron" aria-hidden="true" />
      </button>
      {open && <p className="treatment-step-body">{body}</p>}
    </div>
  );
}

/**
 * Stands in for the farmer's photo. Drawing it keeps the demo free of binary assets
 * and keeps it legible in both themes.
 */
function LeafSample() {
  return (
    <svg className="leaf-sample" viewBox="0 0 240 120" role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id="fg-leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--green-soft)" />
          <stop offset="100%" stopColor="var(--green-dark)" />
        </linearGradient>
      </defs>
      <rect width="240" height="120" rx="10" fill="var(--surface2)" />
      <path
        d="M 20 100 Q 90 96 130 60 Q 170 24 220 20 Q 214 74 170 96 Q 120 118 20 100 Z"
        fill="url(#fg-leaf-grad)"
      />
      <path d="M 24 100 Q 120 78 218 21" stroke="var(--surface2)" strokeWidth="1.5" fill="none" opacity="0.5" />
      {[
        [96, 30, 5.5],
        [126, 52, 8],
        [150, 40, 4],
        [168, 62, 6.5],
        [110, 74, 4.5],
      ].map(([cx, cy, r]) => (
        <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy + 18} rx={r} ry={r * 0.62} fill="var(--amber)" opacity="0.85" />
      ))}
    </svg>
  );
}
