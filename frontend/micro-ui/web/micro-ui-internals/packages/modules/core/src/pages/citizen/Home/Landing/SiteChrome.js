import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import Icon from "./Icons";
import AccessibilityTools from "../../../../components/AccessibilityTools";
import { setAccessibility, useAccessibility } from "../../../../components/AccessibilityTools/settings";
import { BHASHINI_CSS, BHASHINI_ENABLED, BHASHINI_SCRIPT } from "./config";

/** Website search (with voice) shown from the utility bar. Min 3 characters, as on himachal.nic.in. */
const SiteSearch = ({ onSearch }) => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const wrap = useRef(null);
  const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onDoc = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  const submit = (e) => {
    e && e.preventDefault();
    const q = value.trim();
    if (q.length < 3) return setError(tt("LANDING_SEARCH_MIN", "Enter at least 3 characters"));
    setError("");
    setOpen(false);
    onSearch(q);
  };

  const voice = () => {
    if (!SR) return;
    const rec = new SR();
    rec.lang = Digit.StoreData.getCurrentLanguage() === "hi_IN" ? "hi-IN" : "en-IN";
    rec.onresult = (ev) => setValue(ev.results?.[0]?.[0]?.transcript || "");
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  };

  return (
    <div className="LandingUtility__search" ref={wrap}>
      <button type="button" className="LandingUtility__iconBtn" aria-haspopup="dialog" aria-expanded={open} aria-label={tt("LANDING_SITE_SEARCH", "Search website")} title={tt("LANDING_SITE_SEARCH", "Search website")} onClick={() => setOpen((o) => !o)}>
        <Icon name="search" size={20} />
      </button>
      {open && (
        <form className="LandingUtility__searchPanel" onSubmit={submit} role="dialog" aria-label={tt("LANDING_SITE_SEARCH", "Search website")}>
          <strong>{tt("LANDING_SITE_SEARCH", "Search website")}</strong>
          <div className="LandingUtility__searchRow">
            <input
              autoFocus
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={tt("LANDING_SEARCH_TEXT", "Enter search text")}
              aria-label={tt("LANDING_SEARCH_TEXT", "Enter search text")}
            />
            {SR && (
              <button type="button" className={listening ? "is-listening" : ""} onClick={voice} aria-label={tt("LANDING_VOICE", "Search by voice")} title={tt("LANDING_VOICE", "Search by voice")}>
                <Icon name="mic" size={18} />
              </button>
            )}
          </div>
          {error ? <span className="LandingUtility__searchError" role="alert">{error}</span> : null}
          <button type="submit" className="LandingBtn LandingBtn--primary LandingBtn--sm">{tt("LANDING_SEARCH_GO", "Search")}</button>
        </form>
      )}
    </div>
  );
};

/**
 * Bhashini website translation plugin (22 Indian languages), loaded on demand from
 * Bhashini's own CDN. It translates the page text in place; our EN / हिं toggle remains as a
 * fallback until the plugin's dropdown appears.
 */
const BhashiniLanguage = ({ onReady }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!BHASHINI_ENABLED || typeof document === "undefined") return undefined;
    if (!document.querySelector(`link[href="${BHASHINI_CSS}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = BHASHINI_CSS;
      document.head.appendChild(l);
    }
    let script;
    if (!document.querySelector(`script[src="${BHASHINI_SCRIPT}"]`)) {
      script = document.createElement("script");
      script.src = BHASHINI_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }
    // the plugin builds its dropdown inside .bhashini-plugin-container
    const poll = setInterval(() => {
      if (ref.current && ref.current.querySelector(".bhashini-dropdown")) {
        onReady(true);
        clearInterval(poll);
      }
    }, 600);
    const stop = setTimeout(() => clearInterval(poll), 15000);
    return () => {
      clearInterval(poll);
      clearTimeout(stop);
    };
  }, [onReady]);

  if (!BHASHINI_ENABLED) return null;
  return <div className="bhashini-plugin-container LandingUtility__bhashini" ref={ref} />;
};

/** Bar above the header: helpline, skip link, text size, accessibility tools, search, language. */
export const UtilityBar = ({ helpline, hours, languages, selectedLanguage, onLanguage, onSiteSearch }) => {
  const { t } = useTranslation();
  const tt = (key, text) => t(key, { defaultValue: text });
  const a11y = useAccessibility();
  const [bhashiniReady, setBhashiniReady] = useState(false);
  const short = (l) => (l.value?.startsWith("hi") ? "हिं" : (l.value || "").slice(0, 2).toUpperCase());
  const sizes = [
    { label: "A−", value: -1, name: tt("LANDING_FONT_DOWN", "Decrease text size") },
    { label: "A", value: 0, name: tt("LANDING_FONT_NORMAL", "Normal text size") },
    { label: "A+", value: 1, name: tt("LANDING_FONT_UP", "Increase text size") },
  ];

  return (
    <div className="LandingUtility">
      <div className="LandingWrap LandingUtility__inner">
        <span className="LandingUtility__helpline">
          {tt("LANDING_HELPLINE", "Helpline")}: <a href={`tel:${(helpline || "").replace(/[^+\d]/g, "")}`}>{helpline}</a>
          {hours ? <span className="LandingUtility__hours"> | {hours}</span> : null}
        </span>
        <div className="LandingUtility__right">
          <a className="LandingUtility__skip" href="#landing-main">{tt("LANDING_SKIP", "Skip to main content")}</a>
          <span className="LandingUtility__font" role="group" aria-label={tt("LANDING_FONT_SIZE", "Text size")}>
            {sizes.map((z) => (
              <button
                key={z.label}
                type="button"
                className={a11y.fontSize === z.value || (z.value === 1 && a11y.fontSize === 2) ? "is-active" : ""}
                onClick={() => setAccessibility({ fontSize: z.value })}
                aria-label={z.name}
                title={z.name}
              >
                {z.label}
              </button>
            ))}
          </span>
          <AccessibilityTools compact buttonClassName="LandingUtility__iconBtn" />
          <SiteSearch onSearch={onSiteSearch} />
          {!bhashiniReady && languages?.length > 1 && (
            <span className="LandingUtility__lang" role="group" aria-label={tt("LANDING_LANGUAGE", "Language")}>
              {languages.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  className={l.value === selectedLanguage ? "is-active" : ""}
                  onClick={() => onLanguage(l.value)}
                  aria-pressed={l.value === selectedLanguage}
                  title={l.label}
                >
                  {short(l)}
                </button>
              ))}
            </span>
          )}
          <BhashiniLanguage onReady={setBhashiniReady} />
        </div>
      </div>
    </div>
  );
};

/** Brand + primary navigation + login/register. Collapses to a menu on small screens. */
const MAX_INLINE = 6;

export const SiteHeader = ({ stateInfo, nav, isLoggedIn, userName, onLogin, onOfficialLogin, onLogout, onNavigate, onSearch }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const tt = (key, text) => t(key, { defaultValue: text });
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  // compact = the links no longer fit next to the brand, so they move into the hamburger menu
  const [compact, setCompact] = useState(false);
  const innerRef = useRef(null);
  const brandRef = useRef(null);
  const navRef = useRef(null);
  const needRef = useRef(0);
  const compactRef = useRef(false);
  const wrapRef = useRef(null);
  const heightRef = useRef(0);
  const [stuck, setStuck] = useState(false);
  // the first MAX_INLINE links stay in the bar; any further links live in the hamburger menu
  const inline = nav.slice(0, MAX_INLINE);
  const extra = nav.slice(MAX_INLINE);
  const navKey = nav.map((n) => n.label).join("|") + (isLoggedIn ? `|${userName || ""}` : "|guest");

  const go = (item) => {
    setOpen(false);
    onNavigate(item);
  };

  const setMode = (v) => {
    compactRef.current = v;
    setCompact(v);
    if (!v) setOpen(false);
  };

  // labels / language / login state changed: forget the stored width and measure the full row again
  useLayoutEffect(() => {
    needRef.current = 0;
    setMode(false);
  }, [navKey]);

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner || typeof ResizeObserver === "undefined") return undefined;
    const check = () => {
      if (window.innerWidth <= 1180) return setMode(false); // the stylesheet already shows the burger here
      const cs = getComputedStyle(inner);
      const gap = parseFloat(cs.columnGap || cs.gap) || 16;
      const avail = inner.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (!compactRef.current) {
        const navW = navRef.current ? navRef.current.scrollWidth : 0;
        const need = (brandRef.current ? brandRef.current.offsetWidth : 0) + navW + gap;
        if (need > avail + 1) {
          needRef.current = need;
          setMode(true);
        }
      } else if (needRef.current && avail >= needRef.current + 16) {
        setMode(false);
      }
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(inner);
    if (brandRef.current) ro.observe(brandRef.current);
    window.addEventListener("resize", check);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { needRef.current = 0; if (!compactRef.current) check(); });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [navKey]);

  // keep the header pinned to the top once the utility bar has scrolled away
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        const top = wrap.getBoundingClientRect().top;
        setStuck((prev) => {
          if (!prev) heightRef.current = wrap.firstElementChild ? wrap.firstElementChild.offsetHeight : 0;
          return top <= 0 && window.scrollY > 0;
        });
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // close the open menu with Escape or a click outside the header
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onDoc = (e) => {
      if (innerRef.current && !innerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="LandingHeaderWrap" style={stuck ? { minHeight: heightRef.current } : undefined}>
    <header className={`LandingHeader${compact ? " LandingHeader--compact" : ""}${extra.length ? " LandingHeader--has-more" : ""}${stuck ? " is-stuck" : ""}`}>
      <div className="LandingWrap LandingHeader__inner" ref={innerRef}>
        <a className="LandingBrand" ref={brandRef} href="/digit-ui/citizen" aria-label={tt("LANDING_HOME", "Home")}>
          <img className="LandingBrand__hp" src="/digit-ui/images/brand/HPLogo.png" alt="Himachal Pradesh Sarkar" />
          <span className="LandingBrand__text">
            <img className="LandingBrand__wordmark" src="/digit-ui/images/brand/CitizenSevaLogo.png" alt={tt("LANDING_BRAND", "Citizen Seva")} />
            <small>{tt("LANDING_BRAND_SUB", "Department of Urban Development")}</small>
          </span>
        </a>

        <button
          type="button"
          className={`LandingHeader__toggle${open ? " is-open" : ""}`}
          aria-expanded={open}
          aria-controls="landing-nav"
          aria-label={tt("LANDING_MENU", "Menu")}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>

        <nav id="landing-nav" ref={navRef} className={`LandingNav ${open ? "is-open" : ""}`} aria-label={tt("LANDING_NAV", "Primary")}>
          {nav.map((item, idx) =>
            item.children && item.children.length ? (
              <div
                key={item.id}
                className={`LandingNav__group${idx >= MAX_INLINE ? " LandingNav__extra" : ""} ${openGroup === item.id ? "is-open" : ""}`}
                onMouseEnter={() => setOpenGroup(item.id)}
                onMouseLeave={() => setOpenGroup(null)}
              >
                <button
                  type="button"
                  className={item.active ? "is-active" : ""}
                  aria-haspopup="true"
                  aria-expanded={openGroup === item.id}
                  onClick={() => setOpenGroup(openGroup === item.id ? null : item.id)}
                  onKeyDown={(e) => e.key === "Escape" && setOpenGroup(null)}
                >
                  {item.label} <span className="LandingNav__caret" aria-hidden="true">▾</span>
                </button>
                <ul className="LandingNav__menu" role="menu">
                  {item.children.map((c) => (
                    <li key={c.id} role="none">
                      <button type="button" role="menuitem" onClick={() => { setOpenGroup(null); go(c); }}>
                        {c.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <button key={item.id} type="button" className={`${item.active ? "is-active" : ""}${idx >= MAX_INLINE ? " LandingNav__extra" : ""}`} onClick={() => go(item)}>
                {item.label}
              </button>
            )
          )}
          <span className="LandingNav__actions">
            <button type="button" className="LandingNav__icon" onClick={onSearch} aria-label={tt("LANDING_SEARCH_ARIA", "Search services")}>
              <Icon name="search" size={22} />
            </button>
            {isLoggedIn ? (
              <React.Fragment>
                <button type="button" className="LandingBtn LandingBtn--primary LandingBtn--sm" onClick={() => history.push("/digit-ui/citizen/dashboard")}>
                  {userName ? `${tt("LANDING_MY_DASHBOARD", "My dashboard")} · ${userName.split(" ")[0]}` : tt("LANDING_MY_DASHBOARD", "My dashboard")}
                </button>
                <button type="button" className="LandingBtn LandingBtn--ghost LandingBtn--sm" onClick={onLogout}>
                  {tt("LANDING_LOGOUT", "Logout")}
                </button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <button type="button" className="LandingBtn LandingBtn--ghost LandingBtn--sm" onClick={onLogin}>
                  {tt("LANDING_CITIZEN_LOGIN", "Citizen Login")}
                </button>
                <button type="button" className="LandingBtn LandingBtn--primary LandingBtn--sm" onClick={onOfficialLogin}>
                  {tt("LANDING_OFFICIAL_LOGIN", "Official Login")}
                </button>
              </React.Fragment>
            )}
          </span>
        </nav>

        {extra.length > 0 && (
          <div className={`LandingNav__morePanel${open ? " is-open" : ""}`} role="menu" aria-label={tt("LANDING_MORE", "More")}>
            {extra.map((item) =>
              item.children && item.children.length ? (
                <div key={item.id} className="LandingNav__moreGroup">
                  <span>{item.label}</span>
                  {item.children.map((c) => (
                    <button key={c.id} type="button" role="menuitem" onClick={() => go(c)}>{c.label}</button>
                  ))}
                </div>
              ) : (
                <button key={item.id} type="button" role="menuitem" className={item.active ? "is-active" : ""} onClick={() => go(item)}>
                  {item.label}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </header>
    </div>
  );
};

/** Footer backdrop: a photograph of a Himachali hill village and temple at sunrise (decorative, so no alt text). */
export const FooterScene = () => (
  <div className="LandingFooter__scene" aria-hidden="true">
    <img src="/digit-ui/images/footer/footer-himachal.jpg" alt="" loading="lazy" decoding="async" />
  </div>
);

/** Website footer: only links that have a real destination are rendered. */
export const SiteFooter = ({ stateInfo, columns, helpline, legalLinks = [] }) => {
  const { t } = useTranslation();
  const tt = (key, text) => t(key, { defaultValue: text });
  const cols = columns.filter((c) => c.links.length > 0);

  return (
    <footer className="LandingFooter">
      <div className="LandingFooter__top">
      <FooterScene />
      <div className="LandingWrap">
        <div className="LandingFooter__grid">
          <div className="LandingFooter__about">
            <strong>{tt("LANDING_BRAND", "Citizen Seva")}</strong>
            <p>
              {tt("LANDING_FOOTER_ABOUT", "One window for every urban local body service")}
              {stateInfo?.name ? ` ${tt("LANDING_FOOTER_IN", "in")} ${stateInfo.name}` : ""}.
            </p>
            <span className="LandingFooter__tag">{tt("LANDING_FOOTER_TAG", "देवभूमि हिमाचल प्रदेश · Dev Bhoomi")}</span>
            {helpline ? (
              <p className="LandingFooter__help">
                {tt("LANDING_HELPLINE", "Helpline")}: <a href={`tel:${helpline.replace(/[^+\d]/g, "")}`}>{helpline}</a>
              </p>
            ) : null}
          </div>
          {cols.map((col) => (
            <nav key={col.id} aria-label={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.id}>
                    <button type="button" onClick={l.onClick}>{l.label}</button>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      </div>
      <div className="LandingWrap">
        <div className="LandingFooter__legal">
          <span>
            © {stateInfo?.name ? `${tt("LANDING_BRAND_SUB", "Department of Urban Development")}, ${stateInfo.name}` : tt("LANDING_BRAND_SUB", "Department of Urban Development")}
          </span>
          <span className="LandingFooter__legalLinks">
            {legalLinks.map((l) => (
              <button key={l.id} type="button" onClick={l.onClick}>{l.label}</button>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
};

/** Optional statistics band (MDMS uiHomePage.statistics: [{ value, label }]); hidden when not configured. */
export const StatsBand = ({ stats }) => {
  if (!stats?.length) return null;
  return (
    <section className="LandingStats" aria-label="Statistics">
      <div className="LandingWrap LandingStats__grid">
        {stats.map((s) => (
          <div key={s.label} className="LandingStats__item">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

/** Optional news list (MDMS uiHomePage.newsAndNotifications: [{ date, title, navigationUrl }]). */
export const NewsUpdates = ({ items, onOpen, children }) => {
  const { t } = useTranslation();
  const hasItems = items?.length > 0;
  if (!hasItems && !children) return null;
  return (
    <section className="LandingNews">
      {hasItems && (
        <React.Fragment>
          <div className="LandingSection__head">
            <h2>{t("LANDING_NEWS_TITLE", { defaultValue: "News & notifications" })}</h2>
          </div>
          <ul className="LandingNews__list">
            {items.map((n, i) => (
              <li key={i}>
                <button type="button" onClick={() => n.navigationUrl && onOpen(n.navigationUrl)} disabled={!n.navigationUrl}>
                  {n.date ? <span className="LandingNews__date">{n.date}</span> : null}
                  <span className="LandingNews__title">{n.title}</span>
                  {n.navigationUrl ? <Icon name="arrow" size={18} /> : null}
                </button>
              </li>
            ))}
          </ul>
        </React.Fragment>
      )}
      {children}
    </section>
  );
};
