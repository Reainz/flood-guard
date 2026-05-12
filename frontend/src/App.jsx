import React from "react";
import { useEffect, useState } from "react";
import { Bell, ClipboardCheck, CloudRain, Globe, Moon, Sprout, Sun, Waves } from "lucide-react";

import { Alerts } from "./screens/Alerts.jsx";
import { Dashboard } from "./screens/Dashboard.jsx";
import { HarvestDecision } from "./screens/HarvestDecision.jsx";
import { LossProof } from "./screens/LossProof.jsx";
import vi from "./i18n/vi.json";
import en from "./i18n/en.json";
import mm from "./i18n/mm.json";
import "./styles.css";

const translations = { en, vi, mm };

const TAB_KEYS = ["dashboard", "harvest", "alerts", "proof"];

const TAB_ICONS = {
  dashboard: Waves,
  harvest: Sprout,
  alerts: Bell,
  proof: ClipboardCheck,
};

function makeT(lang) {
  const strings = translations[lang] || translations.en;
  return function t(key, values = {}) {
    const template = key.split(".").reduce((v, part) => v?.[part], strings) ?? key;
    return Object.entries(values).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template,
    );
  };
}

const LANGS = ["vi", "en", "mm"];
const LANG_CODES = { vi: "VI", en: "EN", mm: "MM" };

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [lang, setLang] = useState("vi");
  const [theme, setTheme] = useState("light");

  const t = makeT(lang);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [theme]);

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="nav-logo">
          <div className="nav-logo-icon">
            <img src="/logo.svg" alt={t("app.logoAlt")} width={32} height={32} />
          </div>
          <span className="nav-logo-name">Flood<span>Guard</span></span>
        </div>

        <div className="nav-tabs" role="tablist" aria-label={t("app.navigation")}>
          {TAB_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              className={activeTab === key ? "nav-tab active" : "nav-tab"}
              onClick={() => setActiveTab(key)}
            >
              {t(`tabs.${key}`)}
              {key === "alerts" && <span className="nav-badge">2</span>}
            </button>
          ))}
        </div>

        <div className="nav-right">
          <button
            type="button"
            className="nav-icon-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={t("app.toggleTheme")}
            title={t("app.toggleTheme")}
          >
            {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <button
            className="nav-lang-btn"
            onClick={() => setLang(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length])}
            aria-label={t("app.toggleLanguage")}
            title={t("app.toggleLanguage")}
          >
            <Globe size={14} aria-hidden="true" />
            <span>{LANG_CODES[lang]}</span>
          </button>
          <div className="location-pill">
            <div className="loc-dot" aria-hidden="true" />
            An Giang, Mekong Delta
          </div>
        </div>
      </nav>

      <div className="content-surface">
        {activeTab === "dashboard" && <Dashboard t={t} />}
        {activeTab === "harvest" && <HarvestDecision t={t} />}
        {activeTab === "alerts" && <Alerts t={t} />}
        {activeTab === "proof" && <LossProof t={t} />}
      </div>

      {/* Bottom navigation — visible on mobile via CSS */}
      <nav className="bottom-nav" role="tablist" aria-label={t("app.navigation")}>
        {TAB_KEYS.map((key) => {
          const Icon = TAB_ICONS[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              className={`bottom-nav-tab${activeTab === key ? " active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {key === "alerts" && <span className="bottom-nav-badge">2</span>}
              <Icon className="bottom-nav-tab-icon" size={22} aria-hidden="true" />
              <span>{t(`tabs.${key}`)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
