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

/* ==========================================================================
   Page kit (Pg*): shared building blocks for the website pages.
   Follows .claude/skills/upyog-landing-style (mobile first, interactive, accessible).
   ========================================================================== */
const reducedMotion = () => !!(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

/** Returns [ref, className]; the element is hidden only when JS armed it, so it never disappears without scripting. */
export const useReveal = () => {
  const ref = React.useRef(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);
  React.useEffect(() => {
    if (reducedMotion() || typeof IntersectionObserver === "undefined") return undefined;
    setArmed(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(true);
        io.disconnect();
      }
    }, { threshold: 0.1 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, `${armed ? "is-armed" : ""} ${shown ? "is-in" : ""}`.trim()];
};

/** Wraps children in a section that fades/rises into view. */
export const Reveal = ({ as: Tag = "section", className = "", children, ...rest }) => {
  const [ref, state] = useReveal();
  return (
    <Tag ref={ref} className={`PgReveal ${className} ${state}`.trim()} {...rest}>
      {children}
    </Tag>
  );
};

/** Section heading: eyebrow + title + tricolour bar. */
export const PgHead = ({ eyebrow, title, intro, id, light }) => (
  <header className={`PgHead${light ? " PgHead--light" : ""}`}>
    {eyebrow ? <span className="PgHead__eyebrow">{eyebrow}</span> : null}
    <h2 id={id}>{title}</h2>
    {intro ? <p>{intro}</p> : null}
  </header>
);

/** Search + live result count. */
export const PgSearch = ({ value, onChange, placeholder, count, label }) => (
  <div className="PgSearch">
    <label>
      <Icon name="search" size={20} />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label || placeholder} />
      {value ? (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search">×</button>
      ) : null}
    </label>
    {typeof count === "number" ? <span className="PgSearch__count" aria-live="polite">{count}</span> : null}
  </div>
);

/** Pill tabs with counts; arrow keys move between them. */
export const PgTabs = ({ tabs, value, onChange, label }) => {
  const onKey = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabs.findIndex((x) => x.id === value);
    const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    onChange(n.id);
    const el = e.currentTarget.querySelector(`[data-id="${n.id}"]`);
    if (el) el.focus();
  };
  return (
    <div className="PgTabs" role="tablist" aria-label={label} onKeyDown={onKey}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-id={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === value}
          tabIndex={tab.id === value ? 0 : -1}
          className={tab.id === value ? "is-active" : ""}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {typeof tab.count === "number" ? <b>{tab.count}</b> : null}
        </button>
      ))}
    </div>
  );
};

const TONES = ["navy", "saffron", "green", "violet"];
export const toneOf = (i) => TONES[i % TONES.length];

/** A downloadable item: numbered card with icon, title, description, meta chip and actions. */
export const PgDoc = ({ index, title, description, meta, actions, icon = "doc", tone }) => (
  <article className={`PgDoc PgDoc--${tone || toneOf((index || 1) - 1)}`}>
    <span className="PgDoc__icon" aria-hidden="true"><Icon name={icon} size={24} /></span>
    <div className="PgDoc__body">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {meta ? <span className="PgDoc__meta"><Icon name="clock" size={14} /> {meta}</span> : null}
    </div>
    <div className="PgDoc__actions">{actions}</div>
    {index ? <span className="PgDoc__no" aria-hidden="true">{String(index).padStart(2, "0")}</span> : null}
  </article>
);

/** Primary / ghost download action (button when it needs a fetch, link when it is a URL). */
export const PgAction = ({ onClick, href, label, ghost, icon = "download" }) => {
  const cls = `PgAction${ghost ? " PgAction--ghost" : ""}`;
  const body = (
    <React.Fragment>
      <Icon name={icon} size={18} /> <span>{label}</span>
    </React.Fragment>
  );
  return href ? (
    <a className={cls} href={href} target="_blank" rel="noopener noreferrer">{body}</a>
  ) : (
    <button type="button" className={cls} onClick={onClick}>{body}</button>
  );
};

/** Card-style accordion item with a smooth open/close. */
export const PgAccordion = ({ id, question, open, onToggle, children }) => (
  <div className={`PgAcc${open ? " is-open" : ""}`}>
    <h3>
      <button type="button" aria-expanded={open} aria-controls={`pgacc-${id}`} id={`pgacch-${id}`} onClick={onToggle}>
        <span>{question}</span>
        <span className="PgAcc__chev" aria-hidden="true" />
      </button>
    </h3>
    <div id={`pgacc-${id}`} role="region" aria-labelledby={`pgacch-${id}`} className="PgAcc__panel">
      <div className="PgAcc__inner">
        <div className="PgAcc__body">{children}</div>
      </div>
    </div>
  </div>
);

export const PgEmpty = ({ icon = "doc", title, text, children }) => (
  <div className="PgEmpty" role="status">
    <span className="PgEmpty__icon" aria-hidden="true"><Icon name={icon} size={32} /></span>
    <h3>{title}</h3>
    {text ? <p>{text}</p> : null}
    {children}
  </div>
);

export const PgSkeleton = ({ rows = 4 }) => (
  <div className="PgSkeleton" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="PgSkeleton__row"><i /><span><i /><i /></span></div>
    ))}
  </div>
);

/** Closing strip with a heading and one or two actions. */
export const PgCta = ({ title, text, children }) => (
  <Reveal className="PgCta">
    <div>
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
    </div>
    <div className="PgCta__actions">{children}</div>
  </Reveal>
);
