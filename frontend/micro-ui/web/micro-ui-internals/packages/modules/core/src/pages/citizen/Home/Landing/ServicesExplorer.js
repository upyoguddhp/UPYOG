import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ComplaintIcon, PTIcon, CaseIcon, WSICon, HomeIcon, Calender, DocumentIcon } from "@upyog/digit-ui-react-components";
import Icon from "./Icons";
import { OTHER_SERVICES, SERVICE_ROWS_COLLAPSED, serviceActions, serviceCategories, serviceMeta, sortByOrder } from "./config";

const ICONS = {
  CITIZEN_SERVICE_PGR: <ComplaintIcon />,
  CITIZEN_SERVICE_PT: <PTIcon className="fill-path-primary-main" />,
  CITIZEN_SERVICE_TL: <CaseIcon className="fill-path-primary-main" />,
  CITIZEN_SERVICE_WS: <WSICon />,
  CITIZEN_INFO_FAQ: <HomeIcon />,
  CITIZEN_INFO_EVENTS: <Calender />,
};
const metaFor = (it) => {
  const hay = `${it.label} ${it.url || ""}`;
  const hit = serviceMeta.find((m) => m.re.test(hay));
  return hit || null;
};
/** Columns the card grid shows at the current width (mirrors the CSS breakpoints), to cap the grid at N rows. */
const useColumns = () => {
  const calc = () => {
    const w = typeof window === "undefined" ? 1200 : window.innerWidth;
    // the category rail takes the left column from 900px, so the card grid is narrower than the page
    return w >= 1500 ? 4 : w >= 1200 ? 3 : w >= 600 ? 2 : 1;
  };
  const [cols, setCols] = useState(calc);
  useEffect(() => {
    const on = () => setCols(calc());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return cols;
};

const PIN_KEY = "landing.pinnedServices";

/** Pinned services are a per-viewer convenience: storage may be blocked, so every access is guarded. */
const readPins = () => {
  try {
    return JSON.parse(window.localStorage.getItem(PIN_KEY) || "[]");
  } catch (e) {
    return [];
  }
};
const writePins = (pins) => {
  try {
    window.localStorage.setItem(PIN_KEY, JSON.stringify(pins));
  } catch (e) {
    /* ignore */
  }
};

/**
 * "Browse services": category chips + a grid of interactive service cards.
 * Mobile first (one column, swipeable chips) -> 2 / 3 / 4 columns on wider screens.
 * Groups come from MDMS uiHomePage (citizenServicesCard / informationAndUpdatesCard) plus enabled modules.
 */
const ServicesExplorer = ({ groups: sourceGroups, query, onQueryChange, onOpen, onViewAll, activeGroup, onGroupChange, loggedIn = true }) => {
  const { t } = useTranslation();
  const tt = (key, text) => t(key, { defaultValue: text });
  const [pins, setPins] = useState(readPins);
  const [stamp, setStamp] = useState(0);
  const railRef = useRef(null);
  const cols = useColumns();
  const [expanded, setExpanded] = useState(false);

  // every service once (de-duplicated by destination), sorted into categories; empty categories are dropped
  const groups = useMemo(() => {
    const seen = new Set();
    const all = sortByOrder(
      (sourceGroups || []).flatMap((g) => g.items).filter((it) => {
        const k = (it.url || it.label).toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
    ); // order comes from the backend (MDMS), see sortByOrder in config.js
    const buckets = [...serviceCategories, OTHER_SERVICES].map((c) => ({ id: c.id, label: tt(c.key, c.label), re: c.re, items: [] }));
    all.forEach((it) => {
      const hay = `${it.label} ${it.url || ""}`;
      const hit = buckets.find((c) => c.re && c.re.test(hay)) || buckets[buckets.length - 1];
      hit.items.push(it);
    });
    const cats = buckets.filter((c) => c.items.length).map(({ re, ...c }) => c);
    return [{ id: "__all", label: tt("LANDING_SERVICES_ALL", "All"), items: all }, ...cats];
  }, [sourceGroups, t]);

  const current = groups.find((g) => g.id === activeGroup) || groups[0];
  const q = (query || "").trim().toLowerCase();
  const pinKey = (it) => it.code || it.label;

  const items = useMemo(() => {
    const list = (current?.items || []).filter((it) => !q || it.label.toLowerCase().includes(q));
    // pinned services float to the top, order otherwise preserved
    return [...list].sort((a, b) => Number(pins.includes(pinKey(b))) - Number(pins.includes(pinKey(a))));
  }, [current, q, pins]);

  // re-run the entrance animation whenever the visible set changes
  useEffect(() => {
    setStamp((s) => s + 1);
    setExpanded(false);
  }, [current?.id, q]);

  const togglePin = (it) => {
    const k = pinKey(it);
    const next = pins.includes(k) ? pins.filter((p) => p !== k) : [k, ...pins];
    setPins(next);
    writePins(next);
  };

  const onRailKey = (e) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
    const i = groups.findIndex((g) => g.id === current?.id);
    const n = groups[(i + (fwd ? 1 : groups.length - 1)) % groups.length];
    onGroupChange(n.id);
    const el = railRef.current && railRef.current.querySelector(`[data-id="${n.id}"]`);
    if (el) el.focus();
  };

  const limit = cols * SERVICE_ROWS_COLLAPSED;
  const shown = expanded || q ? items : items.slice(0, limit);
  const hidden = items.length - shown.length;
  // button wording follows the kind of service ("Pay now", "Book now"...); logged-out visitors see "Login to ..."
  const actionLabel = (it) => {
    const hit = serviceActions.find((a) => a.re.test(`${it.label} ${it.url || ""}`));
    const text = hit ? tt(hit.key, hit.label) : tt("LANDING_APPLY_NOW", "Apply now");
    return loggedIn ? text : `${tt("LANDING_LOGIN_TO", "Login to")} ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  };
  const total = groups[0]?.id === "__all" ? groups[0].items.length : (sourceGroups || []).reduce((a, g) => a + g.items.length, 0);

  // which card is showing its checklist on tap, and which side the hover popover opens to
  const [openDocs, setOpenDocs] = useState(null);
  const [flip, setFlip] = useState(null);
  const placePop = (key, el) => {
    const r = el.getBoundingClientRect();
    setFlip(r.right + 330 > window.innerWidth ? key : null);
  };

  return (
    <section className="SvcCards" id="landing-services" aria-labelledby="svccards-title">
      <header className="SvcCards__bar">
        <h2 id="svccards-title">{tt("LANDING_SERVICES_BROWSE", "Browse services")}</h2>
        {onQueryChange && (
          <label className="SvcCards__search">
            <Icon name="search" size={18} />
            <span className="sr-only">{tt("LANDING_SEARCH_ARIA", "Search services")}</span>
            <input type="search" value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder={tt("LANDING_SERVICES_FILTER", "Search a service")} />
            {query ? <button type="button" onClick={() => onQueryChange("")} aria-label={tt("LANDING_CLEAR", "Clear")}>×</button> : null}
          </label>
        )}
      </header>

      <div className="SvcCards__layout">
      {groups.length > 1 && (
        <div className="SvcCards__tabs" role="tablist" aria-orientation="vertical" ref={railRef} aria-label={tt("LANDING_SERVICES_BROWSE", "Browse services")} onKeyDown={onRailKey}>
          {groups.map((g) => (
            <button
              key={g.id}
              data-id={g.id}
              type="button"
              role="tab"
              aria-selected={g.id === current?.id}
              tabIndex={g.id === current?.id ? 0 : -1}
              className={`SvcCards__tab${g.id === current?.id ? " is-active" : ""}`}
              onClick={() => onGroupChange(g.id)}
            >
              <span className="SvcCards__tabLabel">{g.label}</span>
              <span className="SvcCards__tabCount" aria-label={`${g.items.length} ${tt("LANDING_SERVICES_COUNT", "services")}`}>{g.items.length}</span>
            </button>
          ))}
        </div>
      )}

      <div className="SvcCards__content">
      <ul className="SvcCards__grid" key={stamp}>
        {items.length === 0 && <li className="SvcCards__empty">{tt("LANDING_NO_RESULTS", "No matching service. Try “View all services”.")}</li>}
        {shown.map((it, idx) => {
          const key = pinKey(it);
          const pinned = pins.includes(key);
          const m = metaFor(it);
          const docs = m && m.docs;
          const open = openDocs === key;
          return (
            <li
              key={key}
              className={`SvcCards__item${open ? " is-open" : ""}${flip === key ? " is-flip" : ""}`}
              style={{ "--i": idx }}
              onMouseEnter={(e) => placePop(key, e.currentTarget)}
              onFocus={(e) => placePop(key, e.currentTarget)}
            >
              <article className={`SvcCards__card${pinned ? " is-pinned" : ""}`}>
                <button
                  type="button"
                  className={`SvcCards__heart${pinned ? " is-on" : ""}`}
                  aria-pressed={pinned}
                  aria-label={pinned ? tt("LANDING_UNPIN", "Remove from favourites") : tt("LANDING_PIN", "Add to favourites")}
                  onClick={() => togglePin(it)}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z" />
                  </svg>
                </button>
                <button type="button" className="SvcCards__main" onClick={() => onOpen(it)}>
                  <span className="SvcCards__icon">{ICONS[it.code] || <DocumentIcon />}</span>
                  <span className="SvcCards__text">
                    <span className="SvcCards__label">{it.label}</span>
                    <span className="SvcCards__meta">
                      {m ? `${m.time} · ${m.fee}` : tt("LANDING_SVC_HINT", "Apply online · pay · track status")}
                    </span>
                  </span>
                </button>
                <div className="SvcCards__foot">
                  {docs ? (
                    <button
                      type="button"
                      className="SvcCards__docs"
                      aria-expanded={open}
                      aria-controls={`svc-pop-${idx}`}
                      onClick={() => setOpenDocs(open ? null : key)}
                    >
                      <Icon name="doc" size={16} />
                      <span>
                        <b className="SvcCards__docs__count">{docs.length}</b> {docs.length === 1 ? tt("LANDING_DOCUMENT_REQ", "document required") : tt("LANDING_DOCUMENTS_REQ", "documents required")}
                      </span>
                    </button>
                  ) : null}
                  <button type="button" className="SvcCards__apply" onClick={() => onOpen(it)}>
                    {actionLabel(it)} <Icon name="arrow" size={16} strokeWidth={2.6} />
                  </button>
                </div>
              </article>

              {docs && (
                <div className="SvcCards__pop" id={`svc-pop-${idx}`} role="note">
                  <strong>{tt("LANDING_BEFORE_APPLY", "Before you apply")}</strong>
                  <ul>
                    {docs.map((d) => (
                      <li key={d}><Icon name="check" size={16} strokeWidth={3} />{d}</li>
                    ))}
                  </ul>
                  <div className="SvcCards__popFoot">
                    <span>{tt("LANDING_TOTAL_FEE", "Total fee")} <b>{m.fee}</b></span>
                    <span>{tt("LANDING_SLA", "SLA")} {m.time}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {(hidden > 0 || (expanded && items.length > limit)) && (
        <div className="SvcCards__more">
          <button type="button" className="SvcCards__toggle" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
            {expanded
              ? tt("LANDING_SHOW_FEWER", "Show fewer services")
              : `${tt("LANDING_SHOW_MORE", "Show more services")} (+${hidden})`}
          </button>
        </div>
      )}

      {onViewAll && (
        <div className="SvcCards__more">
          <button type="button" className="SvcCards__all" onClick={onViewAll}>
            {tt("LANDING_VIEW_ALL", "View all services")}{total ? ` ${total}` : ""}
          </button>
        </div>
      )}
      </div>
      </div>
    </section>
  );
};

export default ServicesExplorer;
