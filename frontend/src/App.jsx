import React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  Database,
  FlaskConical,
  Globe,
  LifeBuoy,
  Menu,
  Moon,
  RotateCcw,
  Settings,
  Sprout,
  Sun,
  Waves,
} from "lucide-react";

import { ActivityLog } from "./screens/ActivityLog.jsx";
import { Alerts } from "./screens/Alerts.jsx";
import { Dashboard } from "./screens/Dashboard.jsx";
import { DiseaseDetection } from "./screens/DiseaseDetection.jsx";
import { HarvestDecision } from "./screens/HarvestDecision.jsx";
import { HarvestTiming } from "./screens/HarvestTiming.jsx";
import { LossProof } from "./screens/LossProof.jsx";
import { Onboarding } from "./screens/Onboarding.jsx";
import { VarietyAdvisor } from "./screens/VarietyAdvisor.jsx";
import { YieldPrediction } from "./screens/YieldPrediction.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { SectionTabs } from "./components/SharedUI.jsx";
import { useClickOutside } from "./hooks/useClickOutside.js";
import { DEMO, LIVE, getDataSource, setDataSource } from "./services/dataSource.js";
import { completeOnboarding, getProfile, isOnboarded, restartOnboarding } from "./services/profile.js";
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

/** Which screens still read from `mocks/` rather than the backend — see
 *  `frontend/src/mocks/README.md`. Drives the preview-dot badge on sub-tabs. */
const SCREEN_META = {
  dashboard: { mock: false },
  disease: { mock: true },
  timing: { mock: true },
  floodScenarios: { mock: false },
  yieldPrediction: { mock: true },
  variety: { mock: true },
  activity: { mock: true },
  proof: { mock: false },
  alerts: { mock: false },
};

const SECTIONS = [
  { key: "dashboard", icon: Waves, screens: ["dashboard"] },
  { key: "floodSupport", icon: LifeBuoy, screens: ["floodScenarios", "yieldPrediction", "proof"] },
  { key: "riceMonitoring", icon: Sprout, screens: ["timing", "variety", "disease", "activity"] },
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
const LANG_NATIVE = { vi: "Tiếng Việt", en: "English", mm: "မြန်မာဘာသာ" };

export default function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  // Each section remembers the screen you last had open inside it.
  const [screenBySection, setScreenBySection] = useState(DEFAULT_SCREENS);
  const [lang, setLang] = useState("vi");
  const [theme, setTheme] = useState("light");
  const [dataSource, setDataSourceState] = useState(getDataSource);
  const [onboarded, setOnboarded] = useState(isOnboarded);
  const [profile, setProfile] = useState(getProfile);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const settingsRef = useRef(null);
  const langMenuRef = useRef(null);
  useClickOutside(settingsRef, settingsOpen, () => setSettingsOpen(false));
  useClickOutside(langMenuRef, langMenuOpen, () => setLangMenuOpen(false));

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

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  if (!onboarded) {
    return (
      <Onboarding
        t={t}
        lang={lang}
        setLang={setLang}
        onComplete={(nextProfile) => {
          completeOnboarding(nextProfile);
          setProfile(getProfile());
          setOnboarded(true);
        }}
      />
    );
  }

  function handleRestartOnboarding() {
    restartOnboarding();
    setSettingsOpen(false);
    setOnboarded(false);
  }

  const section = SECTIONS.find((entry) => entry.key === activeSection) || SECTIONS[0];
  const activeScreen = screenBySection[section.key];
  const ActiveScreen = SCREENS[activeScreen];

  const subTabs = section.screens.map((key) => ({
    key,
    label: t(`screens.${key}`),
    mock: SCREEN_META[key]?.mock,
  }));

  function selectScreen(key) {
    setScreenBySection((current) => ({ ...current, [section.key]: key }));
  }

  // Sidebar (desktop only) can jump straight to a section+screen pair that
  // isn't necessarily the currently active one, so it sets both in one go
  // rather than relying on `selectScreen`'s closure over the active section.
  function selectSidebarSingle(sectionKey) {
    setActiveSection(sectionKey);
  }

  function selectSidebarSub(sectionKey, screenKey) {
    setActiveSection(sectionKey);
    setScreenBySection((current) => ({ ...current, [sectionKey]: screenKey }));
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

        {!sidebarOpen && (
          <button
            type="button"
            className="nav-icon-btn sidebar-toggle-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label={t("app.showSidebar")}
            title={t("app.showSidebar")}
          >
            <Menu size={16} aria-hidden="true" />
          </button>
        )}

        <div className="nav-right">
          <div className="nav-popover-anchor" ref={langMenuRef}>
            <button
              type="button"
              className="nav-lang-btn"
              onClick={() => setLangMenuOpen((open) => !open)}
              aria-label={t("app.toggleLanguage")}
              aria-expanded={langMenuOpen}
              title={t("app.toggleLanguage")}
            >
              <Globe size={14} aria-hidden="true" />
              <span>{lang.toUpperCase()}</span>
            </button>
            {langMenuOpen && (
              <div className="nav-popover" role="menu">
                {LANGS.map((code) => (
                  <button
                    key={code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={lang === code}
                    className={`nav-popover-item${lang === code ? " active" : ""}`}
                    onClick={() => { setLang(code); setLangMenuOpen(false); }}
                  >
                    <span className="nav-popover-item-label">{LANG_NATIVE[code]}</span>
                    {lang === code && <Check size={14} aria-hidden="true" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="nav-popover-anchor" ref={settingsRef}>
            <button
              type="button"
              className="nav-icon-btn"
              onClick={() => setSettingsOpen((open) => !open)}
              aria-label={t("app.settings")}
              aria-expanded={settingsOpen}
              title={t("app.settings")}
            >
              <Settings size={16} aria-hidden="true" />
            </button>
            {settingsOpen && (
              <div className="nav-popover nav-popover-wide" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="nav-popover-item"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <span className="nav-popover-item-label">
                    {theme === "dark" ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
                    {t("app.toggleTheme")}
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="nav-popover-item"
                  onClick={toggleDataSource}
                  title={t(demoMode ? "app.demoModeHint" : "app.liveModeHint")}
                >
                  <span className="nav-popover-item-label">
                    {demoMode
                      ? <FlaskConical size={15} aria-hidden="true" />
                      : <Database size={15} aria-hidden="true" />}
                    {t(demoMode ? "app.demoModeLabel" : "app.liveModeLabel")}
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="nav-popover-item"
                  onClick={handleRestartOnboarding}
                >
                  <span className="nav-popover-item-label">
                    <RotateCcw size={15} aria-hidden="true" />
                    {t("app.restartOnboarding")}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="location-pill">
            <div className="loc-dot" aria-hidden="true" />
            {profile.province || t("app.defaultLocation")}
          </div>
        </div>
      </nav>

      <div className="app-body">
        <Sidebar
          sections={SECTIONS}
          screenMeta={SCREEN_META}
          t={t}
          activeSection={activeSection}
          screenBySection={screenBySection}
          onSelectSingle={selectSidebarSingle}
          onSelectSub={selectSidebarSub}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="content-surface">
          {/* Sidebar covers sub-navigation on desktop (hidden below 641px via
              CSS); mobile still uses this pill row alongside the bottom-nav. */}
          <SectionTabs
            tabs={subTabs}
            active={activeScreen}
            onChange={selectScreen}
            ariaLabel={t("app.sectionNavigation", { section: t(`sections.${section.key}`) })}
            previewLabel={t("common.previewBadge")}
          />
          {/* Keying on the screen restarts the entry animation on every switch.
              Keying on the data source too remounts the screen so it refetches
              when you flip between live and demo. */}
          <div className="screen-swap" key={`${activeScreen}-${dataSource}`}>
            <ActiveScreen t={t} />
          </div>
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
              aria-label={t(`sections.${entry.key}`)}
              title={t(`sections.${entry.key}`)}
              className={`bottom-nav-tab${activeSection === entry.key ? " active" : ""}`}
              onClick={() => setActiveSection(entry.key)}
            >
              {entry.badge && <span className="bottom-nav-badge">{entry.badge}</span>}
              <Icon className="bottom-nav-tab-icon" size={22} aria-hidden="true" />
              {/* Short label: the full section name wraps to two ragged
                  lines on narrow phones in English/Burmese. Full name still
                  reaches screen readers via aria-label above. */}
              <span className="bottom-nav-tab-label">{t(`sections.${entry.key}Short`)}</span>
              {entry.screens.length > 1 && (
                <span className="bottom-nav-subdots" aria-hidden="true">
                  {entry.screens.map((screenKey) => (
                    <span
                      key={screenKey}
                      className={`bottom-nav-subdot${
                        activeSection === entry.key && screenBySection[entry.key] === screenKey ? " active" : ""
                      }`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
