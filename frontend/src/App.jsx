import React from "react";
import { useEffect, useState } from "react";

import { Alerts } from "./screens/Alerts.jsx";
import { Dashboard } from "./screens/Dashboard.jsx";
import { HarvestDecision } from "./screens/HarvestDecision.jsx";
import { LossProof } from "./screens/LossProof.jsx";
import vi from "./i18n/vi.json";
import en from "./i18n/en.json";
import "./styles.css";

const translations = { en, vi };

const TAB_KEYS = ["dashboard", "harvest", "alerts", "proof"];

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

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [lang, setLang] = useState("en");
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
            <svg viewBox="0 0 24 24" fill="white" width="16" height="16" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
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
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? "☀" : "◑"}
          </button>
          <button
            type="button"
            className="nav-lang-btn"
            onClick={() => setLang(lang === "en" ? "vi" : "en")}
            aria-label="Toggle language"
          >
            {lang === "en" ? "VI" : "EN"}
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
    </div>
  );
}
