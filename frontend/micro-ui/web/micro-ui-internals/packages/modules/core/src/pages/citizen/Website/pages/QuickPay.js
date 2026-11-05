import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { PgHead, Reveal } from "../components";
import { QUICK_PAY_URL, ROUTES } from "../config";

const QuickPay = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tt = (k, d) => t(k, { defaultValue: d });
  const options = [
    { id: "property", icon: "home", tone: "navy", title: tt("SITE_NAV_PROPERTY_BILL", "Property Bill"), text: tt("SITE_QP_PROPERTY_T", "Search your property with the property ID or mobile number and pay your property tax online.") },
    { id: "garbage", icon: "leaf", tone: "green", title: tt("SITE_NAV_GARBAGE_BILL", "Garbage Bill"), text: tt("SITE_QP_GARBAGE_T", "Find your garbage collection account with the application number or mobile number and pay your bill.") },
  ];
  const checks = [
    tt("SITE_QP_CHECK_1", "Your ULB name"),
    tt("SITE_QP_CHECK_2", "Property / consumer ID"),
    tt("SITE_QP_CHECK_3", "Bill period and amount"),
  ];
  return (
    <SiteShell
      activeId="qp-property"
      title={tt("SITE_NAV_QUICK_PAY", "Quick Pay")}
      subtitle={tt("SITE_QP_SUB", "Pay municipal bills in a few steps, without logging in.")}
      icon={<Icon name="pay" size={30} />}
    >
      <div className="PgPage">
        <Reveal className="PgBlock" aria-labelledby="qp-h">
          <PgHead id="qp-h" eyebrow={tt("SITE_QP_EYEBROW", "No login needed")} title={tt("SITE_QP_HEAD", "What would you like to pay?")} />
          <ul className="PgPay">
            {options.map((o, i) => (
              <li key={o.id} style={{ "--i": i }}>
                <a className={`PgPay__card PgPay__card--${o.tone}`} href={QUICK_PAY_URL(o.id)} target="_blank" rel="noopener noreferrer">
                  <span className="PgPay__icon" aria-hidden="true"><Icon name={o.icon} size={34} /></span>
                  <span className="PgPay__text">
                    <strong>{o.title}</strong>
                    <span>{o.text}</span>
                  </span>
                  <span className="PgPay__go">
                    {tt("SITE_QP_PAY", "Pay now")} <Icon name="external" size={18} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="PgSafe" aria-labelledby="qp-safe">
          <span className="PgSafe__icon" aria-hidden="true"><Icon name="shield" size={30} /></span>
          <div className="PgSafe__body">
            <h2 id="qp-safe">{tt("SITE_QP_SAFE", "Pay safely")}</h2>
            <p>{tt("SITE_QP_SAFE_T", "Check your ULB name, ID, bill period and amount before paying. Never share your OTP, UPI PIN or card details; officials will never ask for them.")}</p>
            <ul>
              {checks.map((c) => (
                <li key={c}><Icon name="check" size={16} strokeWidth={3} /> {c}</li>
              ))}
            </ul>
          </div>
          <button type="button" className="PgGhost PgGhost--onDark" onClick={() => history.push(ROUTES.paymentInstructions)}>
            {tt("SITE_NAV_PAY_INFO", "Payment Instructions")} <Icon name="arrow" size={16} strokeWidth={2.6} />
          </button>
        </Reveal>
      </div>
    </SiteShell>
  );
};

export default QuickPay;
