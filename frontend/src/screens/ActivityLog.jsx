import React from "react";
import { useEffect, useRef, useState } from "react";
import { Bug, Coins, Plus, Sprout, StickyNote, X } from "lucide-react";

import { MockNotice, ScreenHeader } from "../components/SharedUI.jsx";
import {
  ENTRIES,
  ENTRY_TYPES,
  TYPE_STYLE,
  formatVnd,
  groupByDate,
  groupExpenseTotal,
} from "../mocks/activityLog.js";

const TYPE_ICONS = {
  disease: Bug,
  growth: Sprout,
  expense: Coins,
  note: StickyNote,
};

const FOCUSABLE = 'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])';

export function ActivityLog({ t }) {
  const [entries, setEntries] = useState(ENTRIES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [freshId, setFreshId] = useState(null);

  function addEntry(entry) {
    setEntries((current) => [entry, ...current]);
    setFreshId(entry.id);
    setSheetOpen(false);
  }

  // Sort is stable, so an entry backdated onto an existing day joins that day's group
  // rather than opening a duplicate one at the top.
  const groups = groupByDate([...entries].sort((a, b) => b.date.localeCompare(a.date)));

  return (
    <div className="screen-stack activity-screen">
      <ScreenHeader
        eyebrow={t("activity.eyebrow")}
        title={t("activity.title")}
        description={t("activity.description")}
      />

      <MockNotice>{t("common.placeholderScreen")}</MockNotice>

      <div className="card activity-card">
        <div className="section-title">{t("activity.timelineTitle")}</div>

        {groups.map((group) => {
          const total = groupExpenseTotal(group.entries);
          return (
            <section className="activity-group" key={group.date}>
              <header className="activity-group-head">
                <span className="activity-group-date">{formatDate(group.date, t)}</span>
                {total > 0 && (
                  <span className="activity-group-total">
                    {t("activity.dayTotal", { amount: formatVnd(total) })}
                  </span>
                )}
              </header>

              <ol className="activity-timeline">
                {group.entries.map((entry) => (
                  <ActivityEntry
                    key={entry.id}
                    entry={entry}
                    fresh={entry.id === freshId}
                    t={t}
                  />
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <button
        type="button"
        className="activity-fab"
        onClick={() => setSheetOpen(true)}
        aria-label={t("activity.addEntry")}
      >
        <Plus size={22} aria-hidden="true" />
      </button>

      {sheetOpen && (
        <EntrySheet t={t} onClose={() => setSheetOpen(false)} onSave={addEntry} />
      )}
    </div>
  );
}

function ActivityEntry({ entry, fresh, t }) {
  const style = TYPE_STYLE[entry.type];
  const Icon = TYPE_ICONS[entry.type];

  const title = entry.titleKey ? t(`activity.samples.${entry.titleKey}.title`) : entry.title;
  const body = entry.bodyKey ? t(`activity.samples.${entry.bodyKey}.body`) : entry.body;

  return (
    <li className={`activity-entry${fresh ? " fresh" : ""}`}>
      <span className="activity-node" style={{ background: style.dim, color: style.color }}>
        <Icon size={14} aria-hidden="true" />
      </span>

      <div className="activity-entry-card">
        <div className="activity-entry-head">
          <span className="activity-type-label" style={{ color: style.color }}>
            {t(`activity.types.${entry.type}`)}
          </span>
          {entry.amountVnd > 0 && (
            <span className="activity-amount">{formatVnd(entry.amountVnd)} ₫</span>
          )}
        </div>
        <strong className="activity-entry-title">{title}</strong>
        {body && <p className="activity-entry-body">{body}</p>}
      </div>
    </li>
  );
}

function EntrySheet({ t, onClose, onSave }) {
  const [type, setType] = useState("note");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");

  const sheetRef = useRef(null);
  const firstFieldRef = useRef(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  function onKeyDown(event) {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = sheetRef.current?.querySelectorAll(FOCUSABLE);
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function save() {
    onSave({
      id: `local-${Date.now()}`,
      type,
      date,
      title: note.trim() || t(`activity.types.${type}`),
      body: "",
      amountVnd: type === "expense" ? Number(amount) || 0 : 0,
    });
  }

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        ref={sheetRef}
        className="entry-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t("activity.addEntry")}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="entry-sheet-grip" aria-hidden="true" />

        <div className="entry-sheet-head">
          <h3>{t("activity.addEntry")}</h3>
          <button
            type="button"
            className="nav-icon-btn"
            onClick={onClose}
            aria-label={t("activity.close")}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="entry-type-chips" role="radiogroup" aria-label={t("activity.entryType")}>
          {ENTRY_TYPES.map((entryType, index) => {
            const Icon = TYPE_ICONS[entryType];
            const style = TYPE_STYLE[entryType];
            const selected = type === entryType;
            return (
              <button
                key={entryType}
                ref={index === 0 ? firstFieldRef : undefined}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`entry-type-chip${selected ? " selected" : ""}`}
                style={selected ? { background: style.dim, color: style.color, borderColor: style.color } : undefined}
                onClick={() => setType(entryType)}
              >
                <Icon size={15} aria-hidden="true" />
                {t(`activity.types.${entryType}`)}
              </button>
            );
          })}
        </div>

        <div className="field-row">
          <label htmlFor="entry-date">{t("activity.date")}</label>
          <input
            id="entry-date"
            className="date-picker-input"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div className="field-row">
          <label htmlFor="entry-note">{t("activity.note")}</label>
          <textarea
            id="entry-note"
            rows={3}
            placeholder={t("activity.notePlaceholder")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        {type === "expense" && (
          <div className="field-row">
            <label htmlFor="entry-amount">{t("activity.amount")}</label>
            <input
              id="entry-amount"
              type="number"
              min="0"
              step="1000"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
        )}

        <button type="button" className="btn btn-primary btn-full" onClick={save}>
          {t("activity.save")}
        </button>
        <p className="sheet-footnote">{t("activity.notPersisted")}</p>
      </div>
    </div>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso, t) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return t("activity.todayLabel");

  const locale = t("common.dateLocale");
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
