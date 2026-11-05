import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import policyData from "../data/policy";
import privacyData from "../data/privacy";

/** Long-form document: contents list with scroll-spy (chips on phones, side column on desktop) and a reading progress bar. */
const LegalDocument = ({ sections, label }) => {
  const [active, setActive] = useState(sections[0]?.id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.getAttribute("data-id"));
    }, { rootMargin: "-15% 0px -70% 0px" });
    sections.forEach((s) => {
      const el = document.getElementById(`sec-${s.id}`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [sections]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, Math.round((h.scrollTop / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const jump = (id) => {
    const el = document.getElementById(`sec-${id}`);
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    el.focus({ preventScroll: true });
    setActive(id);
  };

  return (
    <div className="PgLegal">
      <div className="PgLegal__progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
        <i style={{ width: `${progress}%` }} />
      </div>
      <nav className="PgLegal__toc" aria-label={label}>
        <ol>
          {sections.map((s, i) => (
            <li key={s.id}>
              <button type="button" className={active === s.id ? "is-active" : ""} aria-current={active === s.id ? "true" : undefined} onClick={() => jump(s.id)}>
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="PgLegal__body">
        {sections.map((s, i) => (
          <section key={s.id} id={`sec-${s.id}`} data-id={s.id} tabIndex={-1} className="PgLegal__section" aria-labelledby={`sech-${s.id}`}>
            <h2 id={`sech-${s.id}`}>
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              {s.title}
            </h2>
            {s.paras.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
};

export const WebsitePolicy = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  return (
    <SiteShell
      activeId="website-policy"
      title={tt("SITE_POLICY_TITLE", "Website Policy")}
      subtitle={tt("SITE_POLICY_SUB", "Terms of use, copyright, privacy, hyperlinking and archival policies.")}
      icon={<Icon name="shield" size={30} />}
    >
      <div className="PgPage">
        <LegalDocument sections={policyData} label={tt("SITE_POLICY_TITLE", "Website Policy")} />
      </div>
    </SiteShell>
  );
};

export const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const sections = privacyData.map((s, i) => ({ id: `p${i}`, title: s.title, paras: [s.content] }));
  return (
    <SiteShell
      activeId="privacy"
      title={tt("SITE_PRIVACY_TITLE", "Privacy Policy")}
      subtitle={tt("SITE_PRIVACY_SUB", "How Citizen Seva collects, uses, stores and protects information.")}
      icon={<Icon name="lock" size={30} />}
    >
      <div className="PgPage">
        <LegalDocument sections={sections} label={tt("SITE_PRIVACY_TITLE", "Privacy Policy")} />
      </div>
    </SiteShell>
  );
};
