import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import payData from "../data/payment";
import { QUICK_PAY_URL, ROUTES } from "../config";

const kindIcon = { steps: "list", important: "alert", security: "shield" };

const PaymentInstructions = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tt = (k, d) => t(k, { defaultValue: d });
  return (
    <SiteShell
      activeId="qp-info"
      title={tt("SITE_PAYINFO_TITLE", "Online Payment Instructions")}
      subtitle={tt("SITE_PAYINFO_SUB", "Please read these instructions carefully before paying through the Citizen Seva Portal.")}
      icon={<Icon name="pay" size={30} />}
    >
      <div className="PayGrid">
        {payData.map((s) => (
          <article key={s.number} className={`PayStep PayStep--${s.kind}`}>
            <header>
              <span className="PayStep__no">{s.number}</span>
              <h2>{s.title}</h2>
              <span className="PayStep__icon"><Icon name={kindIcon[s.kind] || "list"} size={22} /></span>
            </header>
            {s.intro ? <p className="PayStep__intro">{s.intro}</p> : null}
            <ul>
              {s.items.map((it, i) => (
                <li key={i}>
                  <Icon name="check" size={18} strokeWidth={2.6} />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <aside className="PayCta">
        <div>
          <h2>{tt("SITE_PAYINFO_CTA", "Ready to pay your bill?")}</h2>
          <p>{tt("SITE_PAYINFO_CTA_T", "Use the official Citizen Seva Portal only. We never ask for your OTP or bank details.")}</p>
        </div>
        <div className="PayCta__actions">
          <a className="LandingBtn LandingBtn--primary" href={QUICK_PAY_URL("property")} target="_blank" rel="noopener noreferrer">
            {tt("SITE_NAV_PROPERTY_BILL", "Property Bill")}
          </a>
          <a className="LandingBtn LandingBtn--glass" href={QUICK_PAY_URL("garbage")} target="_blank" rel="noopener noreferrer">
            {tt("SITE_NAV_GARBAGE_BILL", "Garbage Bill")}
          </a>
          <button type="button" className="LandingBtn LandingBtn--glass" onClick={() => history.push(ROUTES.contact)}>
            {tt("SITE_NAV_CONTACT", "Contact Us")}
          </button>
        </div>
      </aside>
    </SiteShell>
  );
};

export default PaymentInstructions;
