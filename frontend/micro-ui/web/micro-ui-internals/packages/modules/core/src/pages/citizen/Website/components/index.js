import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../Home/Landing/Icons";

/** Search field used above document lists / FAQ. */
export const FilterBar = ({ value, onChange, placeholder, count, label }) => (
  <div className="SiteFilter">
    <label className="SiteFilter__field">
      <Icon name="search" size={20} />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label || placeholder} />
    </label>
    {typeof count === "number" ? <span className="SiteFilter__count" aria-live="polite">{count}</span> : null}
  </div>
);

/** Page-level states for data driven lists. */
export const Skeleton = ({ rows = 4 }) => (
  <div className="SiteSkeleton" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="SiteSkeleton__row"><i /><i /><i /></div>
    ))}
  </div>
);

export const EmptyState = ({ icon = "doc", title, text, action }) => (
  <div className="SiteEmpty">
    <span className="SiteEmpty__icon"><Icon name={icon} size={30} /></span>
    <h3>{title}</h3>
    {text ? <p>{text}</p> : null}
    {action}
  </div>
);

/** One downloadable item: icon, title, description, buttons. */
export const DocCard = ({ index, title, description, meta, actions }) => (
  <article className="DocCard">
    <span className="DocCard__no">{index}</span>
    <span className="DocCard__icon"><Icon name="doc" size={24} /></span>
    <div className="DocCard__body">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {meta ? <small>{meta}</small> : null}
    </div>
    <div className="DocCard__actions">{actions}</div>
  </article>
);

export const DownloadButton = ({ onClick, href, label, ghost }) => {
  const cls = `LandingBtn LandingBtn--sm ${ghost ? "LandingBtn--ghost" : "LandingBtn--navy"} DocCard__btn`;
  const content = (
    <React.Fragment>
      <Icon name="download" size={18} /> {label}
    </React.Fragment>
  );
  return href ? (
    <a className={cls} href={href} target="_blank" rel="noopener noreferrer">{content}</a>
  ) : (
    <button type="button" className={cls} onClick={onClick}>{content}</button>
  );
};

/** Accessible accordion item (button + region). */
export const Accordion = ({ id, question, open, onToggle, children }) => (
  <div className={`SiteAcc ${open ? "is-open" : ""}`}>
    <h3>
      <button type="button" aria-expanded={open} aria-controls={`acc-${id}`} id={`acch-${id}`} onClick={onToggle}>
        <span>{question}</span>
        <span className="SiteAcc__chev" aria-hidden="true">+</span>
      </button>
    </h3>
    <div id={`acc-${id}`} role="region" aria-labelledby={`acch-${id}`} hidden={!open}>
      <div className="SiteAcc__body">{children}</div>
    </div>
  </div>
);

/** Small stat tile. */
export const Stat = ({ value, label }) => (
  <div className="SiteStat">
    <strong>{value}</strong>
    <span>{label}</span>
  </div>
);

/** Feature card with icon. */
export const FeatureCard = ({ icon, title, text, tone = "blue" }) => (
  <article className={`SiteFeature SiteFeature--${tone}`}>
    <span className="SiteFeature__icon"><Icon name={icon} size={26} /></span>
    <h3>{title}</h3>
    {text ? <p>{text}</p> : null}
  </article>
);

/** Section heading with optional intro. */
export const Section = ({ title, intro, children, id, tone }) => (
  <section className={`SiteSection ${tone ? `SiteSection--${tone}` : ""}`} id={id}>
    {title ? <h2 className="SiteSection__title">{title}</h2> : null}
    {intro ? <p className="SiteSection__intro">{intro}</p> : null}
    {children}
  </section>
);

/** Simple tabs (roving buttons). */
export const Tabs = ({ tabs, value, onChange }) => (
  <div className="SiteTabs" role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={tab.id === value}
        className={tab.id === value ? "is-active" : ""}
        onClick={() => onChange(tab.id)}
      >
        {tab.label}
        {typeof tab.count === "number" ? <span>{tab.count}</span> : null}
      </button>
    ))}
  </div>
);

export const useFilter = (items, fields) => {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((it) => fields.some((f) => String(it[f] || "").toLowerCase().includes(term)));
  }, [items, q, fields]);
  return [q, setQ, filtered];
};
