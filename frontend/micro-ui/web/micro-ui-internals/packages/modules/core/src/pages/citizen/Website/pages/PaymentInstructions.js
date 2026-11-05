import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { PgCta, Reveal } from "../components";
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
      <div className="PgPage">
        <ol className="PgSteps">
          {payData.map((s, i) => (
            <Reveal as="li" key={s.number} className={`PgStep PgStep--${s.kind}`} style={{ "--i": i }} aria-labelledby={`pay-${s.number}`}>
              <span className="PgStep__no" aria-hidden="true">{s.number}</span>
              <div className="PgStep__card">
                <header>
                  <h2 id={`pay-${s.number}`}>{s.title}</h2>
                  <span className="PgStep__icon" aria-hidden="true"><Icon name={kindIcon[s.kind] || "list"} size={22} /></span>
                </header>
                {s.intro ? <p className="PgStep__intro">{s.intro}</p> : null}
                <ul>
                  {s.items.map((it, j) => (
                    <li key={j}>
                      <Icon name="check" size={18} strokeWidth={2.8} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ol>

        <PgCta title={tt("SITE_PAYINFO_CTA", "Ready to pay your bill?")} text={tt("SITE_PAYINFO_CTA_T", "Use the official Citizen Seva Portal only. We never ask for your OTP or bank details.")}>
          <a className="LandingBtn LandingBtn--primary" href={QUICK_PAY_URL("property")} target="_blank" rel="noopener noreferrer">
            {tt("SITE_NAV_PROPERTY_BILL", "Property Bill")}
          </a>
          <a className="PgGhost" href={QUICK_PAY_URL("garbage")} target="_blank" rel="noopener noreferrer">
            {tt("SITE_NAV_GARBAGE_BILL", "Garbage Bill")}
          </a>
          <button type="button" className="PgGhost" onClick={() => history.push(ROUTES.contact)}>
            {tt("SITE_NAV_CONTACT", "Contact Us")}
          </button>
        </PgCta>
      </div>
    </SiteShell>
  );
};

export default PaymentInstructions;
