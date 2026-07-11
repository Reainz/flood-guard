import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

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

/** Segmented control that switches between the screens inside one nav section.
 *  Tabs whose screen is still a mock/placeholder (`tab.mock`) carry a small
 *  amber dot so it's clear at the nav level, not just inside the screen, which
 *  ones show sample data. */
export function SectionTabs({ tabs, active, onChange, ariaLabel, previewLabel }) {
  if (!tabs || tabs.length < 2) return null;

  const activeIdx = Math.max(0, tabs.findIndex((tab) => tab.key === active));

  return (
    <div className="section-tabs" role="tablist" aria-label={ariaLabel}>
      <div
        className="section-tabs-pill"
        aria-hidden="true"
        style={{
          width: `calc((100% - 8px) / ${tabs.length})`,
          transform: `translateX(calc(${activeIdx} * 100%))`,
        }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={tab.key === active}
          className={`section-tab${tab.key === active ? " active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          {tab.mock && (
            <span className="section-tab-preview-dot" aria-hidden="true" title={previewLabel} />
          )}
        </button>
      ))}
    </div>
  );
}

/** Step progress rail shared by every multi-step wizard flow (Variety Advisor,
 *  Onboarding, Harvest Decision, Loss Proof). */
export function WizardProgress({ stepLabel, stepIndex, totalSteps, countLabel }) {
  return (
    <div className="progress-rail">
      <div className="progress-rail-track" aria-hidden="true">
        <div className="progress-rail-fill" style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }} />
      </div>
      <div className="progress-rail-meta">
        <span className="eyebrow">{stepLabel}</span>
        <span className="progress-rail-count">{countLabel}</span>
      </div>
    </div>
  );
}

/** Back/next button row shared by every multi-step wizard flow. */
export function WizardActions({
  onBack,
  onNext,
  backLabel,
  nextLabel,
  backDisabled = false,
  nextDisabled = false,
  nextType = "button",
}) {
  return (
    <div className="wizard-actions">
      <button
        type="button"
        className="btn btn-ghost"
        onClick={onBack}
        disabled={backDisabled}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        {backLabel}
      </button>
      <button type={nextType} className="btn btn-primary" onClick={nextType === "button" ? onNext : undefined} disabled={nextDisabled}>
        {nextLabel}
        <ArrowRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Marks a screen whose contents are placeholder data rather than live results. */
export function MockNotice({ children }) {
  return (
    <p className="mock-notice">
      <span className="mock-notice-dot" aria-hidden="true" />
      {children}
    </p>
  );
}
