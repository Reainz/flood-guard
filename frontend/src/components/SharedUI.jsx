import React from "react";

export function ScreenHeader({ eyebrow, title, description }) {
  return (
    <div className="screen-header">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

export function DataBanner({ children, tone = "offline" }) {
  return <p className={`${tone}-banner`}>{children}</p>;
}

export function MetricCard({ label, value, meta }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {meta && <small>{meta}</small>}
    </div>
  );
}

export function RiskPanel({ eyebrow, title, description, level, children }) {
  return (
    <section className={`risk-panel risk-${String(level).toLowerCase()}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
    </section>
  );
}

export function FreshnessChips({ freshness = {}, t }) {
  const entries = Object.entries(freshness);
  if (!entries.length) return null;

  return (
    <div className="chip-row">
      {entries.map(([source, status]) => (
        <span className={`source-chip freshness-${status}`} key={source}>
          <strong>{t(`sources.${source}`)}</strong>
          {t(`freshness.${status}`)}
        </span>
      ))}
    </div>
  );
}

export function FormField({ label, error, hint, children, span = false }) {
  return (
    <label className={span ? "form-field form-field-wide" : "form-field"}>
      <span>{label}</span>
      {children}
      {hint && !error && <small>{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function ChecklistItem({ done, label, detail }) {
  return (
    <div className={done ? "check-row complete" : "check-row"}>
      <span aria-hidden="true">{done ? "OK" : "!"}</span>
      <div>
        <strong>{label}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </div>
  );
}

export function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}
