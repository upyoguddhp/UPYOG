import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { ROUTES, DEPARTMENT } from "../config";
import { ulbTierCounts } from "../../Home/Landing/config";

const SERVICES = [
  ["cert", "Trade License", "navy"],
  ["leaf", "Garbage Collection & Billing", "green"],
  ["megaphone", "Advertisement Hoarding & Canopy Permission", "saffron"],
  ["paw", "Pet Registration", "violet"],
  ["building", "Asset Management", "navy"],
  ["calendar", "Booking of Community Halls & Grounds", "green"],
  ["pay", "Property Tax Module", "saffron"],
  ["alert", "Public Grievance Module", "violet"],
  ["list", "RDF Module", "navy"],
];

const STATS = [
  { value: ulbTierCounts.mc + ulbTierCounts.council + ulbTierCounts.np, key: "SITE_STAT_ULB", text: "Urban Local Bodies", tone: "navy", icon: "building" },
  { value: ulbTierCounts.mc, key: "SITE_STAT_MC", text: "Municipal Corporations", tone: "saffron", icon: "users" },
  { value: ulbTierCounts.council, key: "SITE_STAT_COUNCIL", text: "Municipal Councils", tone: "green", icon: "home" },
  { value: ulbTierCounts.np, key: "SITE_STAT_NP", text: "Nagar Panchayats", tone: "violet", icon: "leaf" },
];

const prefersReducedMotion = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

/** Adds `is-in` once the element scrolls into view (always visible without IntersectionObserver / with reduced motion). */
const useReveal = () => {
  const ref = useRef(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) return undefined;
    setArmed(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(true);
        io.disconnect();
      }
    }, { threshold: 0.12 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, `${armed ? "is-armed" : ""} ${shown ? "is-in" : ""}`];
};

const CountUp = ({ to, run }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run || prefersReducedMotion()) return undefined; // reduced motion: show the final number straight away
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 900);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, run]);
  return <span>{run && !prefersReducedMotion() ? n : to}</span>;
};

const Block = ({ className = "", children, labelledBy, ...rest }) => {
  const [ref, state] = useReveal();
  return (
    <section ref={ref} className={`AboutX__block ${className} ${state}`} aria-labelledby={labelledBy} {...rest}>
      {children}
    </section>
  );
};

const Introduction = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tt = (k, d) => t(k, { defaultValue: d });
  const [statsRef, statsState] = useReveal();

  // in-page quick navigation with scroll-spy
  const SECTIONS = [
    ["about-overview", "SITE_NAV_OVERVIEW", "Overview"],
    ["about-benefits", "SITE_BENEFITS", "Benefits"],
    ["about-services", "SITE_NAV_SERVICES", "Services"],
    ["about-features", "SITE_KEY_FEATURES", "Key features"],
    ["about-mission", "SITE_NUDM_SHORT", "Mission"],
  ];
  const [current, setCurrent] = useState(SECTIONS[0][0]);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (hit) setCurrent(hit.target.id);
    }, { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.2, 0.5] });
    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  const jump = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    setCurrent(id);
  };

  return (
    <SiteShell
      activeId="about"
      title={tt("SITE_ABOUT_TITLE", "About Citizen Seva Portal")}
      subtitle={tt("SITE_ABOUT_SUB", "A centralized digital platform in all urban local bodies for online delivery of citizen-centric services.")}
      icon={<Icon name="info" size={30} />}
    >
      <div className="AboutX">
        <nav className="AboutX__nav" aria-label={tt("SITE_ABOUT_ONPAGE", "On this page")}>
          {SECTIONS.map(([id, k, label]) => (
            <button key={id} type="button" className={current === id ? "is-active" : ""} aria-current={current === id ? "true" : undefined} onClick={() => jump(id)}>
              {tt(k, label)}
            </button>
          ))}
        </nav>

        {/* 1. introduction + numbers */}
        <Block id="about-overview" labelledBy="about-title" className="AboutX__intro">
          <div className="AboutX__lead">
            <span className="AboutX__eyebrow">{tt("SITE_ABOUT_EYEBROW", "About the portal")}</span>
            <h2 id="about-title">{tt("SITE_ABOUT_HEAD", "One portal for every urban local body")}</h2>
            <p className="AboutX__big">
              {tt("SITE_ABOUT_P1", "The Citizen Seva Portal is a centralized digital platform in all urban local bodies for online delivery of urban citizen-centric services.")}
            </p>
            <p>{tt("SITE_ABOUT_P2", "It scales up e-governance across all Urban Local Bodies (ULBs) and builds on national collaboration for improved implementation of urban programs.")}</p>
            <p>{tt("SITE_ABOUT_P3", "The portal is implemented on UPYOG (Urban Platform for Delivery of Online Governance), under the National Urban Digital Mission.")}</p>
          </div>

          <ul ref={statsRef} className={`AboutX__stats ${statsState}`} aria-label={tt("SITE_ABOUT_STATS", "Urban local bodies in Himachal Pradesh")}>
            {STATS.map((s, i) => (
              <li key={s.key} className={`AboutX__stat AboutX__stat--${s.tone}`} style={{ "--i": i }}>
                <span className="AboutX__statIcon"><Icon name={s.icon} size={22} /></span>
                <strong><CountUp to={s.value} run={statsState.includes("is-in") || !statsState.includes("is-armed")} /></strong>
                <span>{tt(s.key, s.text)}</span>
              </li>
            ))}
          </ul>
        </Block>

        {/* 2. benefits */}
        <Block id="about-benefits" labelledBy="about-benefits-title">
          <header className="AboutX__head">
            <span className="AboutX__eyebrow">{tt("SITE_WHY", "Why Citizen Seva")}</span>
            <h2 id="about-benefits-title">{tt("SITE_BENEFITS", "Benefits")}</h2>
          </header>
          <ol className="AboutX__benefits">
            {[
              ["clock", "SITE_BEN_1", "Streamlined & time-bound approvals", "SITE_BEN_1_T", "Applications move through a defined workflow with clear timelines."],
              ["shield", "SITE_BEN_2", "Transparency & accountability", "SITE_BEN_2_T", "Enhanced transparency and accountability in municipal administration."],
              ["help", "SITE_BEN_3", "Information available 24/7", "SITE_BEN_3_T", "Services and information are available online, anytime and anywhere."],
            ].map(([icon, k, title, kt, text], i) => (
              <li key={k} style={{ "--i": i }}>
                <span className="AboutX__no" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className="AboutX__benIcon" aria-hidden="true"><Icon name={icon} size={26} /></span>
                <h3>{tt(k, title)}</h3>
                <p>{tt(kt, text)}</p>
              </li>
            ))}
          </ol>
        </Block>

        {/* 3. services on the portal */}
        <Block id="about-services" labelledBy="about-services-title" className="AboutX__servicesBlock">
          <header className="AboutX__head">
            <span className="AboutX__eyebrow">{tt("SITE_ONLINE", "Online")}</span>
            <h2 id="about-services-title">{tt("SITE_SERVICES_AVAILABLE", "Services available on Citizen Seva Portal")}</h2>
            <p className="AboutX__hint">{tt("SITE_SERVICES_HINT", "Choose a service to find it on the home page.")}</p>
          </header>
          <ul className="AboutX__services">
            {SERVICES.map(([icon, label, tone], i) => {
              const text = tt(`SITE_SVC_${label.replace(/[^A-Za-z]/g, "_").toUpperCase()}`, label);
              return (
                <li key={label} style={{ "--i": i }}>
                  <button type="button" className={`AboutX__svc AboutX__svc--${tone}`} onClick={() => history.push(`${ROUTES.home}?q=${encodeURIComponent(label.split(" ")[0])}`)}>
                    <span className="AboutX__svcIcon" aria-hidden="true"><Icon name={icon} size={24} /></span>
                    <span className="AboutX__svcText">{text}</span>
                    <span className="AboutX__svcGo" aria-hidden="true"><Icon name="arrow" size={16} strokeWidth={2.6} /></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Block>

        {/* 4. key features */}
        <Block id="about-features" labelledBy="about-features-title">
          <header className="AboutX__head">
            <span className="AboutX__eyebrow">{tt("SITE_WHAT_YOU_GET", "What you get")}</span>
            <h2 id="about-features-title">{tt("SITE_KEY_FEATURES", "Key features")}</h2>
          </header>
          <div className="AboutX__features">
            {[
              ["users", "SITE_KF_1", "Ease of living", "SITE_KF_1_T", "Hassle-free access to government services for citizens.", "navy"],
              ["building", "SITE_KF_2", "Single, integrated view", "SITE_KF_2_T", "One integrated view of ULB information systems across the state.", "green"],
              ["home", "SITE_KF_3", "Single window, anytime-anywhere", "SITE_KF_3_T", "A single window platform available on an anytime-anywhere basis.", "saffron"],
              ["cert", "SITE_KF_4", "Digitally signed approvals", "SITE_KF_4_T", "Digitally / e-signed approvals, NOCs and licences.", "violet"],
            ].map(([icon, k, title, kt, text, tone], i) => (
              <article key={k} className={`AboutX__feature AboutX__feature--${tone}`} style={{ "--i": i }}>
                <span className="AboutX__featureIcon" aria-hidden="true"><Icon name={icon} size={26} /></span>
                <div>
                  <h3>{tt(k, title)}</h3>
                  <p>{tt(kt, text)}</p>
                </div>
              </article>
            ))}
          </div>
        </Block>

        {/* 5. National Urban Digital Mission */}
        <Block id="about-mission" labelledBy="about-mission-title" className="AboutX__mission">
          <span className="AboutX__orb" aria-hidden="true" />
          <header className="AboutX__head AboutX__head--light">
            <span className="AboutX__badge">{tt("SITE_NUDM_T", "Mission launched in February 2021.")}</span>
            <h2 id="about-mission-title">{tt("SITE_NUDM", "National Urban Digital Mission")}</h2>
          </header>
          <ul className="AboutX__pillars">
            {[
              ["home", "SITE_NUDM_1", "National level platform", "SITE_NUDM_1_T", "Ready-to-use, customizable IT platform: UPYOG."],
              ["users", "SITE_NUDM_2", "Hand-holding support", "SITE_NUDM_2_T", "Cloud services, empanelled agencies, capacity building."],
              ["shield", "SITE_NUDM_3", "Standards", "SITE_NUDM_3_T", "Domain and technology standards, API documents."],
              ["book", "SITE_NUDM_4", "Toolkits", "SITE_NUDM_4_T", "Program guidelines, dashboards, model RFP and more."],
            ].map(([icon, k, title, kt, text], i) => (
              <li key={k} style={{ "--i": i }}>
                <span aria-hidden="true"><Icon name={icon} size={24} /></span>
                <h3>{tt(k, title)}</h3>
                <p>{tt(kt, text)}</p>
              </li>
            ))}
          </ul>
        </Block>

        {/* 6. who runs it (details from Website/config.js DEPARTMENT) */}
        <Block className="AboutX__owner" labelledBy="about-owner-title">
          <span className="AboutX__ownerIcon" aria-hidden="true"><Icon name="building" size={26} /></span>
          <div>
            <span className="AboutX__eyebrow">{tt("SITE_MANAGED_BY", "Managed by")}</span>
            <h2 id="about-owner-title">{tt("SITE_DEPT_NAME", DEPARTMENT.name)}</h2>
            <address>
              {DEPARTMENT.address.join(", ")}
              <br />
              <a href={`tel:${DEPARTMENT.helpline.replace(/[^+\d]/g, "")}`}>{DEPARTMENT.helpline}</a>
            </address>
          </div>
        </Block>

        {/* 7. call to action */}
        <Block className="AboutX__cta">
          <div>
            <h2>{tt("SITE_ABOUT_CTA", "Ready to use a service?")}</h2>
            <p>{tt("SITE_ABOUT_CTA_T", "Apply, pay and track from any device, any time.")}</p>
          </div>
          <div className="AboutX__ctaBtns">
            <button type="button" className="LandingBtn LandingBtn--primary" onClick={() => history.push(`${ROUTES.home}#landing-services`)}>
              {tt("LANDING_WELCOME_CTA", "Explore services")}
            </button>
            <button type="button" className="AboutX__ghost" onClick={() => history.push(ROUTES.contact)}>
              {tt("SITE_NAV_CONTACT", "Contact Us")} <Icon name="arrow" size={16} strokeWidth={2.6} />
            </button>
          </div>
        </Block>
      </div>
    </SiteShell>
  );
};

export default Introduction;
