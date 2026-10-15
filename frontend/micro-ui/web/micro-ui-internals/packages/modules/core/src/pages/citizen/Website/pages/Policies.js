import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import policyData from "../data/policy";
import privacyData from "../data/privacy";

/** Long-form document with a sticky contents list. */
const LegalDocument = ({ sections }) => {
  const [active, setActive] = useState(sections[0]?.id);
  const jump = (id) => {
    setActive(id);
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="LegalDoc">
      <nav className="LegalDoc__toc" aria-label="Contents">
        <ol>
          {sections.map((s) => (
            <li key={s.id}>
              <button type="button" className={active === s.id ? "is-active" : ""} onClick={() => jump(s.id)}>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="LegalDoc__body">
        {sections.map((s) => (
          <section key={s.id} id={`sec-${s.id}`} className="LegalDoc__section">
            <h2>{s.title}</h2>
            {s.paras.map((p, i) => (
              <p key={i}>{p}</p>
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
      <LegalDocument sections={policyData} />
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
      <LegalDocument sections={sections} />
    </SiteShell>
  );
};
