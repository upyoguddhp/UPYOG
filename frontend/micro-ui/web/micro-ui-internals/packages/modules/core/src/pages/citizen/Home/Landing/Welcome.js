import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "./Icons";

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
const Welcome = ({ onOrgChart, onServices }) => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const total = TIERS.reduce((a, x) => a + x.count, 0);
  return (
    <section className="LandingTiers" aria-labelledby="landing-welcome-title">
      <div className="LandingWrap">
        <header className="LandingTiers__head">
          <img src="/digit-ui/images/brand/CitizenSevaMark.png" alt="" />
          <span className="LandingTiers__eyebrow">{tt("LANDING_ULB_TITLE", "ULB Directory — Himachal Pradesh")}</span>
          <h2 id="landing-welcome-title">{tt("LANDING_WELCOME_TITLE", "One portal for every urban local body")}</h2>
          <p>
            {tt("LANDING_WELCOME_TEXT", "Citizen Seva brings the municipal services of the Department of Urban Development, Himachal Pradesh together — apply, pay, track and get help from any device.")}
          </p>
        </header>

        <ul className="LandingTiers__grid">
          {TIERS.map((tier) => (
            <li key={tier.id}>
              <button type="button" className={`LandingTier LandingTier--${tier.tone}`} onClick={onOrgChart}>
                <span className="LandingTier__icon"><Icon name={tier.icon} size={26} /></span>
                <span className="LandingTier__count"><CountUp to={tier.count} /></span>
                <span className="LandingTier__label">{tt(`LANDING_ULB_${tier.id.toUpperCase()}`, tier.label)}</span>
                <strong className="LandingTier__name">{tier.name}</strong>
                <small className="LandingTier__desc">{tier.desc}</small>
                <span className="LandingTier__more">
                  {tt("LANDING_ULB_VIEW", "View organization chart")} <Icon name="arrow" size={16} />
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="LandingTiers__foot">
          <span><strong>{total}</strong> {tt("LANDING_ULB_TOTAL", "bodies across four tiers")}</span>
          <button type="button" className="LandingBtn LandingBtn--primary" onClick={onServices}>
            {tt("LANDING_WELCOME_CTA", "Explore services")}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Welcome;
