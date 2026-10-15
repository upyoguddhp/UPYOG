import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { Section } from "../components";
import { QUICK_PAY_URL, ROUTES } from "../config";

const QuickPay = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tt = (k, d) => t(k, { defaultValue: d });
  const options = [
    { id: "property", icon: "home", tone: "navy", title: tt("SITE_NAV_PROPERTY_BILL", "Property Bill"), text: tt("SITE_QP_PROPERTY_T", "Search your property with the property ID or mobile number and pay your property tax online.") },
    { id: "garbage", icon: "leaf", tone: "green", title: tt("SITE_NAV_GARBAGE_BILL", "Garbage Bill"), text: tt("SITE_QP_GARBAGE_T", "Find your garbage collection account with the application number or mobile number and pay your bill.") },
  ];
  return (
    <SiteShell
      activeId="qp-property"
      title={tt("SITE_NAV_QUICK_PAY", "Quick Pay")}
      subtitle={tt("SITE_QP_SUB", "Pay municipal bills in a few steps, without logging in.")}
      icon={<Icon name="pay" size={30} />}
    >
      <Section>
        <div className="SiteGrid SiteGrid--2">
          {options.map((o) => (
            <article key={o.id} className={`QuickCard QuickCard--${o.tone}`}>
              <span className="QuickCard__icon"><Icon name={o.icon} size={32} /></span>
              <h2>{o.title}</h2>
              <p>{o.text}</p>
              <a className="LandingBtn LandingBtn--primary" href={QUICK_PAY_URL(o.id)} target="_blank" rel="noopener noreferrer">
                {tt("SITE_QP_PAY", "Pay now")} <Icon name="external" size={18} />
              </a>
            </article>
          ))}
        </div>
      </Section>
      <Section tone="band">
        <div className="SiteSplit">
          <div className="SiteSplit__text">
            <h2 className="SiteSection__title">{tt("SITE_QP_SAFE", "Pay safely")}</h2>
            <p>{tt("SITE_QP_SAFE_T", "Check your ULB name, ID, bill period and amount before paying. Never share your OTP, UPI PIN or card details; officials will never ask for them.")}</p>
            <button type="button" className="LandingBtn LandingBtn--navy" onClick={() => history.push(ROUTES.paymentInstructions)}>
              {tt("SITE_NAV_PAY_INFO", "Payment Instructions")}
            </button>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
};

export default QuickPay;
