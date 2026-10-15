import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "./Icons";
import Leaders from "./Leaders";
import HimachalMap from "./HimachalMap";
import { HP_MAP } from "./himachalGeo";

const TIERS = [
  { id: "state", tone: "navy", icon: "building", count: 1, label: "State Level", name: "HP Urban Development Dept.", desc: "Nodal authority for all ULB websites" },
  { id: "mc", tone: "saffron", icon: "users", count: 2, label: "Municipal Corporation", name: "Nagar Nigam", desc: "Large urban bodies with an elected mayor" },
  { id: "council", tone: "green", icon: "home", count: 25, label: "Municipal Council", name: "Nagar Parishad", desc: "Medium urban bodies — district headquarters" },
  { id: "np", tone: "violet", icon: "leaf", count: 29, label: "Nagar Panchayat", name: "Nagar Panchayat", desc: "Towns & semi-urban areas" },
];

/** Counts up once when scrolled into view (skipped with reduced motion). */
const CountUp = ({ to }) => {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return setN(to);
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / 900);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{n}</span>;
};

/** Second section: brand introduction + the four ULB tiers as large, linked cards. */
const Welcome = ({ onOrgChart, onServices, onOpen }) => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  // counts come from the same ULB list that draws the map; the state itself is not a ULB
  const tiers = TIERS.map((x) => (x.id === "state" ? x : { ...x, count: HP_MAP.pins.filter((p) => p.tier === x.id).length }));
  const total = HP_MAP.pins.length;
  const [active, setActive] = useState(null);
  const rootRef = useRef(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);
  // entrance animation: hide children only once JS is running, reveal when scrolled into view
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return undefined;
    setArmed(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.12 });
    if (rootRef.current) io.observe(rootRef.current);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={rootRef} className={`LandingTiers LandingTiers--wow${armed ? " is-armed" : ""}${shown ? " is-in" : ""}`} aria-labelledby="landing-welcome-title">
      <span className="LandingWow__orb LandingWow__orb--a" aria-hidden="true" />
      <span className="LandingWow__orb LandingWow__orb--b" aria-hidden="true" />
      <div className="LandingWrap">
        <header className="LandingWelcome__head" data-reveal style={{ "--i": 0 }}>
          <div className="LandingWelcome__logos">
            <img className="LandingWelcome__emblem" src="/digit-ui/images/brand/CitizenSevaEmblem.png" alt="" />
            <span className="LandingWelcome__logoDivider" aria-hidden="true" />
            <img className="LandingWelcome__logo" src="/digit-ui/images/brand/CitizenSevaLogo.png" alt={tt("LANDING_BRAND", "Citizen Seva")} />
          </div>
          <span className="LandingTiers__eyebrow"><i aria-hidden="true" />{tt("LANDING_ULB_TITLE", "ULB Directory — Himachal Pradesh")}</span>
          <h2 id="landing-welcome-title">{tt("LANDING_WELCOME_TITLE", "One portal for every urban local body")}</h2>
          <span className="LandingWelcome__flag" aria-hidden="true"><i /><i /><i /></span>

        </header>

        <Leaders onOpen={onOpen} />

        <div className="LandingGlance" data-reveal style={{ "--i": 7 }}>
          <div className="LandingGlance__summary">
            <span className="LandingGlance__kicker">{tt("LANDING_ULB_GLANCE", "Urban local bodies at a glance")}</span>
            <div className="LandingGlance__big">
              <strong><CountUp to={total} /></strong>
              <span>{tt("LANDING_ULB_TOTAL", "bodies across four tiers")}</span>
            </div>
            <HimachalMap active={active} />
          </div>

          <ul className="LandingGlance__legend">
            {tiers.map((tier) => (
              <li key={tier.id}>
                <button
                  type="button"
                  className={`LandingRow LandingRow--${tier.tone}${active === tier.id ? " is-active" : ""}`}
                  onMouseEnter={() => setActive(tier.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(tier.id)}
                  onBlur={() => setActive(null)}
                  onClick={onOrgChart}
                >
                  <span className="LandingRow__icon"><Icon name={tier.icon} size={20} /></span>
                  <span className="LandingRow__text">
                    <strong>{tt(`LANDING_ULB_${tier.id.toUpperCase()}`, tier.label)}</strong>
                    <small>{tier.name} — {tier.desc}{tier.id === "state" ? ` (${tt("LANDING_ULB_NOT_COUNTED", "not counted as a ULB")})` : ""}</small>
                  </span>
                  <span className="LandingRow__count"><CountUp to={tier.count} /></span>
                  <span className="LandingRow__bar" aria-hidden="true"><i style={{ width: `${Math.max(4, Math.round((tier.count / total) * 100))}%` }} /></span>
                </button>
              </li>
            ))}
            <li className="LandingGlance__cta">
              <button type="button" className="LandingBtn LandingBtn--primary" onClick={onServices}>
                {tt("LANDING_WELCOME_CTA", "Explore services")}
              </button>
              <button type="button" className="LandingGlance__link" onClick={onOrgChart}>
                {tt("LANDING_ULB_VIEW", "View organization chart")} <Icon name="arrow" size={16} />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Welcome;
