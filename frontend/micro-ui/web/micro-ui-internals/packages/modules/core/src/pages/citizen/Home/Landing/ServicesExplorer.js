import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ComplaintIcon, PTIcon, CaseIcon, WSICon, HomeIcon, Calender, DocumentIcon } from "@upyog/digit-ui-react-components";
import Icon from "./Icons";

const ICONS = {
  CITIZEN_SERVICE_PGR: <ComplaintIcon />,
  CITIZEN_SERVICE_PT: <PTIcon className="fill-path-primary-main" />,
  CITIZEN_SERVICE_TL: <CaseIcon className="fill-path-primary-main" />,
  CITIZEN_SERVICE_WS: <WSICon />,
  CITIZEN_INFO_FAQ: <HomeIcon />,
  CITIZEN_INFO_EVENTS: <Calender />,
};
const TONES = ["navy", "saffron", "green", "violet", "teal", "blue"];

/**
 * Third section: category rail (left on desktop, scrollable chips on phones) and a grid of
 * large service tiles. Groups come from MDMS uiHomePage: citizenServicesCard /
 * informationAndUpdatesCard (+ enabled modules).
 */
const ServicesExplorer = ({ groups: sourceGroups, query, onQueryChange, onOpen, activeGroup, onGroupChange }) => {
  const { t } = useTranslation();
  const tt = (key, text) => t(key, { defaultValue: text });

  // "All" tab: every service of every group, de-duplicated by destination
  const groups = React.useMemo(() => {
    if (sourceGroups.length < 2) return sourceGroups;
    const seen = new Set();
    const all = sourceGroups.flatMap((g) => g.items).filter((it) => {
      const k = (it.url || it.label).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return [{ id: "__all", label: tt("LANDING_SERVICES_ALL", "All"), items: all }, ...sourceGroups];
  }, [sourceGroups, t]);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    setShown(false);
    const id = setTimeout(() => setShown(true), 30);
    return () => clearTimeout(id);
  }, [activeGroup]);

  const current = groups.find((g) => g.id === activeGroup) || groups[0];
  const q = (query || "").trim().toLowerCase();
  const items = (current?.items || []).filter((it) => !q || it.label.toLowerCase().includes(q));

  return (
    <section className="SvcX" id="landing-services" aria-labelledby="svcx-title">
      <header className="SvcX__head">
        <div>
          <span className="SvcX__eyebrow">{tt("LANDING_SERVICES_EYEBROW", "Online services")}</span>
          <h2 id="svcx-title">{tt("LANDING_SERVICES_TITLE", "Services for you")}</h2>
          <p>{tt("LANDING_SERVICES_SUB", "Pick a category, then act.")}</p>
        </div>
        {onQueryChange && (
          <label className="SvcX__search">
            <Icon name="search" size={20} />
            <span className="sr-only">{tt("LANDING_SEARCH_ARIA", "Search services")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={tt("LANDING_SERVICES_FILTER", "Filter services")}
            />
          </label>
        )}
      </header>

      <div className="SvcX__layout">
        {groups.length > 1 && (
          <div className="SvcX__rail" role="tablist" aria-label={tt("LANDING_SERVICES_TITLE", "Services for you")}>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={g.id === current?.id}
                className={`SvcX__tab ${g.id === current?.id ? "is-active" : ""}`}
                onClick={() => onGroupChange(g.id)}
              >
                <span>{g.label}</span>
                <b>{g.items.length}</b>
              </button>
            ))}
          </div>
        )}

        <div className="SvcX__body">
          <ul className={`SvcX__grid ${shown ? "is-shown" : ""}`}>
            {items.length === 0 && (
              <li className="SvcX__empty">{tt("LANDING_NO_RESULTS", "No matching service. Try “View all services”.")}</li>
            )}
            {items.map((it, idx) => (
              <li key={it.code || it.label}>
                <button type="button" className={`SvcX__card SvcX__card--${TONES[idx % TONES.length]}`} onClick={() => onOpen(it)}>
                  {idx === 0 && !q && (current?.id === groups[0]?.id || current?.id === "__all") && (
                    <span className="SvcX__tag">{tt("LANDING_MOST_USED", "Most used")}</span>
                  )}
                  <span className="SvcX__icon">{ICONS[it.code] || <DocumentIcon />}</span>
                  <span className="SvcX__text">
                    <span className="SvcX__label">{it.label}</span>
                    <small>{tt("LANDING_SVC_HINT", "Apply online · pay · track status")}</small>
                  </span>
                  <span className="SvcX__go" aria-label={tt("LANDING_START_NOW", "Start now")}>
                    <Icon name="arrow" size={20} strokeWidth={2.6} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ServicesExplorer;
