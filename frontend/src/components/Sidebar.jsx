import React from "react";
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

/** Desktop-only left nav (hidden below 641px via CSS — mobile keeps the
 *  bottom-nav + SectionTabs pill instead). Sections with a single screen
 *  (Dashboard, Alerts) render as plain links; sections with several screens
 *  (Flood Support, Rice Monitoring) render as accordion groups the farmer
 *  expands to reveal their sub-screens. `onClose` hides the sidebar; the app
 *  shell's nav-bar burger button (only rendered while closed) brings it back.
 *
 *  Stays mounted at all times — `open` toggles a width transition on the
 *  outer `<aside>` rather than unmounting, so closing/opening slides instead
 *  of popping. The inner wrapper keeps a fixed width so its contents don't
 *  reflow/wrap while the outer element's width animates down to 0. */
export function Sidebar({ sections, screenMeta, t, activeSection, screenBySection, onSelectSingle, onSelectSub, open, onClose }) {
  const [expanded, setExpanded] = useState(() => {
    const initial = {};
    sections.forEach((section) => {
      if (section.screens.length > 1) initial[section.key] = section.key === activeSection;
    });
    return initial;
  });

  function toggleGroup(key) {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  }

  const tab = open ? 0 : -1;

  return (
    <aside
      className={`app-sidebar${open ? "" : " sidebar-collapsed"}`}
      aria-label={t("app.navigation")}
      aria-hidden={!open}
    >
      <div className="sidebar-inner">
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label={t("app.hideSidebar")}
            title={t("app.hideSidebar")}
            tabIndex={tab}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.key;

          if (section.screens.length === 1) {
            return (
              <button
                key={section.key}
                type="button"
                className={`sidebar-link${isActive ? " active" : ""}`}
                onClick={() => onSelectSingle(section.key)}
                tabIndex={tab}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{t(`sections.${section.key}`)}</span>
                {section.badge && <span className="sidebar-badge">{section.badge}</span>}
              </button>
            );
          }

          const isOpen = Boolean(expanded[section.key]);
          return (
            <div key={section.key} className="sidebar-group">
              <button
                type="button"
                className={`sidebar-link sidebar-group-toggle${isActive ? " active" : ""}`}
                aria-expanded={isOpen}
                onClick={() => {
                  toggleGroup(section.key);
                  onSelectSingle(section.key);
                }}
                tabIndex={tab}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{t(`sections.${section.key}`)}</span>
                <ChevronDown size={14} className={`sidebar-chevron${isOpen ? " open" : ""}`} aria-hidden="true" />
              </button>
              {isOpen && (
                <div className="sidebar-subitems">
                  {section.screens.map((screenKey) => {
                    const subActive = isActive && screenBySection[section.key] === screenKey;
                    return (
                      <button
                        key={screenKey}
                        type="button"
                        className={`sidebar-sublink${subActive ? " active" : ""}`}
                        onClick={() => onSelectSub(section.key, screenKey)}
                        tabIndex={tab}
                      >
                        <span>{t(`screens.${screenKey}`)}</span>
                        {screenMeta[screenKey]?.mock && (
                          <span className="sidebar-preview-dot" aria-hidden="true" title={t("common.previewBadge")} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
