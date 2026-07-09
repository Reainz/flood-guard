import React from "react";
import { useEffect, useState } from "react";
import { Bell, ClipboardCheck, Database, FlaskConical, Globe, Moon, Sprout, Sun, Waves } from "lucide-react";

import { ActivityLog } from "./screens/ActivityLog.jsx";
import { Alerts } from "./screens/Alerts.jsx";
import { Dashboard } from "./screens/Dashboard.jsx";
import { DiseaseDetection } from "./screens/DiseaseDetection.jsx";
import { HarvestDecision } from "./screens/HarvestDecision.jsx";
import { HarvestTiming } from "./screens/HarvestTiming.jsx";
import { LossProof } from "./screens/LossProof.jsx";
import { VarietyAdvisor } from "./screens/VarietyAdvisor.jsx";
import { YieldPrediction } from "./screens/YieldPrediction.jsx";
import { SectionTabs } from "./components/SharedUI.jsx";
import { DEMO, LIVE, getDataSource, setDataSource } from "./services/dataSource.js";
import vi from "./i18n/vi.json";
import en from "./i18n/en.json";
import mm from "./i18n/mm.json";
import "./styles.css";
import "./styles/features.css";

const translations = { en, vi, mm };

const SCREENS = {
  dashboard: Dashboard,
  disease: DiseaseDetection,
  timing: HarvestTiming,
  floodScenarios: HarvestDecision,
  yieldPrediction: YieldPrediction,
  variety: VarietyAdvisor,
  activity: ActivityLog,
  proof: LossProof,
  alerts: Alerts,
};

const SECTIONS = [
  { key: "field", icon: Waves, screens: ["dashboard", "disease"] },
  { key: "crop", icon: Sprout, screens: ["timing", "floodScenarios", "yieldPrediction", "variety"] },
  { key: "records", icon: ClipboardCheck, screens: ["activity", "proof"] },
  { key: "alerts", icon: Bell, screens: ["alerts"], badge: "2" },
];

const DEFAULT_SCREENS = Object.fromEntries(
  SECTIONS.map((section) => [section.key, section.screens[0]]),
);

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
  const [activeSection, setActiveSection] = useState("field");
  // Each section remembers the screen you last had open inside it.
  const [screenBySection, setScreenBySection] = useState(DEFAULT_SCREENS);
  const [lang, setLang] = useState("vi");
  const [theme, setTheme] = useState("light");
  const [dataSource, setDataSourceState] = useState(getDataSource);

  const t = makeT(lang);
  const demoMode = dataSource === DEMO;

  function toggleDataSource() {
    setDataSourceState(setDataSource(demoMode ? LIVE : DEMO));
  }

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [theme]);

  const section = SECTIONS.find((entry) => entry.key === activeSection) || SECTIONS[0];
  const activeScreen = screenBySection[section.key];
  const ActiveScreen = SCREENS[activeScreen];

  const subTabs = section.screens.map((key) => ({ key, label: t(`screens.${key}`) }));

  function selectScreen(key) {
    setScreenBySection((current) => ({ ...current, [section.key]: key }));
  }

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
          {SECTIONS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={activeSection === entry.key}
              className={activeSection === entry.key ? "nav-tab active" : "nav-tab"}
              onClick={() => setActiveSection(entry.key)}
            >
              {t(`sections.${entry.key}`)}
              {entry.badge && <span className="nav-badge">{entry.badge}</span>}
            </button>
          ))}
        </div>

        <div className="nav-right">
          <button
            type="button"
            className={`nav-data-btn${demoMode ? " demo" : ""}`}
            onClick={toggleDataSource}
            aria-label={t("app.toggleDataSource")}
            title={t(demoMode ? "app.demoModeHint" : "app.liveModeHint")}
          >
            {demoMode
              ? <FlaskConical size={14} aria-hidden="true" />
              : <Database size={14} aria-hidden="true" />}
            <span>{t(demoMode ? "app.demoMode" : "app.liveMode")}</span>
          </button>
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
        <SectionTabs
          tabs={subTabs}
          active={activeScreen}
          onChange={selectScreen}
          ariaLabel={t("app.sectionNavigation", { section: t(`sections.${section.key}`) })}
        />
        {/* Keying on the screen restarts the entry animation on every switch.
            Keying on the data source too remounts the screen so it refetches
            when you flip between live and demo. */}
        <div className="screen-swap" key={`${activeScreen}-${dataSource}`}>
          <ActiveScreen t={t} />
        </div>
      </div>

      {/* Bottom navigation — visible on mobile via CSS */}
      <nav className="bottom-nav" role="tablist" aria-label={t("app.navigation")}>
        {SECTIONS.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={activeSection === entry.key}
              className={`bottom-nav-tab${activeSection === entry.key ? " active" : ""}`}
              onClick={() => setActiveSection(entry.key)}
            >
              {entry.badge && <span className="bottom-nav-badge">{entry.badge}</span>}
              <Icon className="bottom-nav-tab-icon" size={22} aria-hidden="true" />
              <span>{t(`sections.${entry.key}`)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
