import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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

export const SiteHeader = ({ stateInfo, nav, isLoggedIn, userName, onLogin, onRegister, onLogout, onNavigate, onSearch }) => {
  const { t } = useTranslation();
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
                <span className="LandingNav__user">{userName}</span>
                <button type="button" className="LandingBtn LandingBtn--ghost LandingBtn--sm" onClick={onLogout}>
                  {tt("LANDING_LOGOUT", "Logout")}
                </button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <button type="button" className="LandingBtn LandingBtn--ghost LandingBtn--sm" onClick={onLogin}>
                  {tt("LANDING_LOGIN", "Login")}
                </button>
                <button type="button" className="LandingBtn LandingBtn--primary LandingBtn--sm" onClick={onRegister}>
                  {tt("LANDING_REGISTER", "Register")}
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

/** Himachali footer scene: Dhauladhar peaks, deodars, pahari pagoda temple, prayer flags, apple orchard, Kullu border. */
const Deodar = ({ x, base, h, shade = "#1F5A4A" }) => {
  const w = h * 0.42;
  const tiers = [0.34, 0.58, 0.8, 1].map((f, i) => {
    const top = base - h * f;
    const half = w * (0.5 - i * 0.1);
    return `M${x} ${top - h * 0.16} L${x + half} ${top + h * 0.18} H${x - half}Z`;
  });
  return (
    <g fill={shade}>
      <rect x={x - 2} y={base - h * 0.14} width="4" height={h * 0.14} fill="#3A2E2A" />
      {tiers.map((d) => <path key={d} d={d} />)}
    </g>
  );
};

const AppleTree = ({ x, base }) => (
  <g>
    <rect x={x - 3} y={base - 26} width="6" height="26" fill="#5B3A29" />
    <circle cx={x} cy={base - 40} r="24" fill="#3F8A4C" />
    <circle cx={x - 14} cy={base - 30} r="15" fill="#4C9B58" />
    <circle cx={x + 14} cy={base - 30} r="15" fill="#4C9B58" />
    {[[-10, -44], [8, -50], [14, -34], [-18, -30], [0, -30]].map(([dx, dy]) => (
      <circle key={`${dx}${dy}`} cx={x + dx} cy={base + dy} r="3.4" fill="#D93A2B" />
    ))}
  </g>
);

const PrayerFlags = ({ x1, y1, x2, y2, sag = 26 }) => {
  const colors = ["#2563C9", "#FFFFFF", "#D93A2B", "#2E9B4E", "#F2C14E"];
  const pts = Array.from({ length: 12 }, (_, i) => {
    const t = (i + 0.5) / 12;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + Math.sin(Math.PI * t) * sag;
    return { x, y, c: colors[i % colors.length] };
  });
  return (
    <g>
      <path d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag * 2} ${x2} ${y2}`} stroke="#5B3A29" strokeWidth="1.5" fill="none" />
      {pts.map((p, i) => (
        <path key={i} d={`M${p.x - 7} ${p.y} h14 v16 l-7 -5 l-7 5Z`} fill={p.c} stroke="#5B3A29" strokeWidth=".4" />
      ))}
      <rect x={x1 - 2} y={y1 - 6} width="4" height="70" fill="#5B3A29" />
      <rect x={x2 - 2} y={y2 - 6} width="4" height="60" fill="#5B3A29" />
    </g>
  );
};

const PagodaTemple = ({ cx, base }) => (
  <g>
    <ellipse cx={cx} cy={base} rx="92" ry="6" fill="rgba(20,34,77,.25)" />
    <rect x={cx - 52} y={base - 44} width="104" height="44" fill="#6B4630" />
    <rect x={cx - 52} y={base - 44} width="104" height="5" fill="#8A5E40" />
    <path d={`M${cx - 20} ${base} v-24 a20 20 0 0 1 40 0 v24Z`} fill="#2A1A12" />
    {[-40, -32, 32, 40].map((dx) => <rect key={dx} x={cx + dx - 3} y={base - 34} width="6" height="12" rx="1" fill="#FFC25A" />)}
    <path d={`M${cx - 76} ${base - 44} L${cx - 46} ${base - 72} H${cx + 46} L${cx + 76} ${base - 44}Z`} fill="#3B4F85" />
    <rect x={cx - 38} y={base - 88} width="76" height="16" fill="#6B4630" />
    <path d={`M${cx - 58} ${base - 88} L${cx - 32} ${base - 112} H${cx + 32} L${cx + 58} ${base - 88}Z`} fill="#3B4F85" />
    <rect x={cx - 22} y={base - 126} width="44" height="14" fill="#6B4630" />
    <path d={`M${cx - 40} ${base - 126} L${cx} ${base - 160} L${cx + 40} ${base - 126}Z`} fill="#3B4F85" />
    <rect x={cx - 1.5} y={base - 178} width="3" height="20" fill="#E3B965" />
    <circle cx={cx} cy={base - 180} r="4.5" fill="#E3B965" />
  </g>
);

const StoneHouse = ({ x, base }) => (
  <g>
    <rect x={x} y={base - 34} width="74" height="34" fill="#8C6B4F" />
    <rect x={x} y={base - 34} width="74" height="6" fill="#6B4630" />
    <path d={`M${x - 10} ${base - 34} L${x + 14} ${base - 58} H${x + 60} L${x + 84} ${base - 34}Z`} fill="#4B5C8C" />
    {[10, 32, 54].map((dx) => <rect key={dx} x={x + dx} y={base - 24} width="10" height="12" rx="1.5" fill="#FFC25A" />)}
  </g>
);

const FooterScene = () => {
  const base = 226;
  return (
    <div className="LandingFooter__scene" aria-hidden="true">
      <svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" focusable="false">
        <defs>
          <linearGradient id="hpSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D9E6FA" />
            <stop offset=".55" stopColor="#FCEBD2" />
            <stop offset="1" stopColor="#FFD59A" />
          </linearGradient>
          <pattern id="kullu" width="36" height="16" patternUnits="userSpaceOnUse">
            <rect width="36" height="16" fill="#7A1F2B" />
            <path d="M18 1 L28 8 L18 15 L8 8Z" fill="#F2C14E" />
            <path d="M18 4.5 L23.5 8 L18 11.5 L12.5 8Z" fill="#1B7A4A" />
            <circle cx="18" cy="8" r="1.6" fill="#fff" />
            <path d="M0 0 L5 0 L0 5Z M36 0 L31 0 L36 5Z M0 16 L5 16 L0 11Z M36 16 L31 16 L36 11Z" fill="#E8730C" />
          </pattern>
        </defs>
        <rect width="1440" height="260" fill="url(#hpSky)" />
        <circle cx="1120" cy="132" r="84" fill="#FFB347" opacity=".22" />
        <circle cx="1120" cy="132" r="44" fill="#FFB347" opacity=".92" />
        <g fill="#fff" opacity=".8">
          <ellipse cx="240" cy="52" rx="64" ry="11" /><ellipse cx="284" cy="44" rx="40" ry="10" />
          <ellipse cx="800" cy="38" rx="70" ry="11" /><ellipse cx="850" cy="30" rx="42" ry="9" />
        </g>
        <g stroke="#34456F" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M520 70 q6 -6 12 0 q6 -6 12 0" /><path d="M560 90 q5 -5 10 0 q5 -5 10 0" /><path d="M960 64 q6 -6 12 0 q6 -6 12 0" />
        </g>
        {/* Dhauladhar range with snow */}
        <path d="M0 176 L90 110 L150 148 L270 56 L400 160 L500 104 L630 168 L770 70 L910 166 L1040 98 L1190 160 L1320 82 L1440 150 V260 H0Z" fill="#B7C4E3" />
        <path d="M270 56 L240 92 L262 86 L278 102 L296 84 L316 98Z M770 70 L742 104 L762 98 L780 112 L798 96 L816 108Z M1320 82 L1294 112 L1312 106 L1328 118 L1346 102Z M500 104 L482 128 L498 122 L514 130Z M1040 98 L1020 124 L1038 118 L1054 126Z" fill="#fff" opacity=".95" />
        <path d="M0 204 L130 148 L240 190 L390 134 L540 196 L700 150 L870 198 L1020 142 L1190 196 L1330 150 L1440 188 V260 H0Z" fill="#6C82B8" />
        {/* terraced fields */}
        <path d="M0 226 Q360 196 720 214 T1440 204 V260 H0Z" fill="#5E8F5A" />
        <path d="M0 238 Q360 214 720 230 T1440 222 V260 H0Z" fill="#4A7A4C" />
        <path d="M0 250 Q360 232 720 244 T1440 238 V260 H0Z" fill="#3A6340" />
        {[30, 110, 190, 440, 560, 860, 960, 1060, 1300, 1400].map((x, i) => (
          <Deodar key={x} x={x} base={base - 6 + (i % 3) * 4} h={72 + (i % 4) * 14} shade={i % 2 ? "#1F5A4A" : "#2A6B58"} />
        ))}
        <StoneHouse x={300} base={base + 2} />
        <StoneHouse x={1010} base={base + 4} />
        <PagodaTemple cx={700} base={base + 4} />
        <PrayerFlags x1={820} y1={120} x2={1000} y2={150} />
        <PrayerFlags x1={360} y1={132} x2={560} y2={110} sag={22} />
        <AppleTree x={1180} base={base + 12} />
        <AppleTree x={1250} base={base + 16} />
        <AppleTree x={1330} base={base + 12} />
        <AppleTree x={150} base={base + 14} />
        {/* Kullu shawl border */}
        <rect y="244" width="1440" height="16" fill="url(#kullu)" />
      </svg>
    </div>
  );
};

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
