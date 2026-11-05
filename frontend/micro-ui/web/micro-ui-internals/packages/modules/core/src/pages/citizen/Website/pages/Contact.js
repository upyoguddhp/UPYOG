import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { PgHead, Reveal } from "../components";
import { DEPARTMENT, ROUTES } from "../config";
import { siteDefaults } from "../../Home/Landing/config";

const unobfuscate = (e) => e.replace("[at]", "@").replace(/\[dot\]/g, ".");

const Contact = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tt = (k, d) => t(k, { defaultValue: d });
  const tel = (n) => `tel:${n.replace(/[^+\d]/g, "")}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(DEPARTMENT.mapQuery)}`;
  const mailto = `mailto:${unobfuscate(DEPARTMENT.email)}`;

  const cards = [
    { icon: "phone", tone: "saffron", title: tt("SITE_CONTACT_PHONE", "Telephone"), body: [DEPARTMENT.phone], href: tel(DEPARTMENT.phone), cta: tt("SITE_CALL", "Call now") },
    { icon: "help", tone: "green", title: tt("SITE_CONTACT_HELPLINE", "Technical helpline"), body: [DEPARTMENT.helpline, siteDefaults.helplineHours], href: tel(DEPARTMENT.helpline), cta: tt("SITE_CALL", "Call now") },
    { icon: "mail", tone: "navy", title: tt("SITE_CONTACT_EMAIL", "Email"), body: [DEPARTMENT.email], href: mailto, cta: tt("SITE_WRITE", "Write to us") },
    { icon: "pin", tone: "violet", title: tt("SITE_CONTACT_ADDRESS", "Address"), body: [DEPARTMENT.name, ...DEPARTMENT.address], href: mapsUrl, cta: tt("SITE_OPEN_MAPS", "Open in Google Maps"), external: true },
  ];

  const quick = [
    { icon: "help", label: tt("SITE_NAV_FAQ", "FAQs"), to: ROUTES.faq },
    { icon: "book", label: tt("SITE_NAV_USER_MANUAL", "User Manual"), to: ROUTES.userManual },
    { icon: "pay", label: tt("SITE_NAV_PAY_INFO", "Payment Instructions"), to: ROUTES.paymentInstructions },
  ];

  return (
    <SiteShell
      activeId="contact"
      title={tt("SITE_CONTACT_TITLE", "Contact Us")}
      subtitle={tt("SITE_CONTACT_SUB", "Reach the Directorate of Urban Development, Himachal Pradesh.")}
      icon={<Icon name="phone" size={30} />}
    >
      <div className="PgPage">
        <Reveal className="PgBlock" aria-labelledby="contact-h">
          <PgHead id="contact-h" eyebrow={tt("SITE_CONTACT_EYEBROW", "We are here to help")} title={tt("SITE_CONTACT_HEAD", "Get in touch")} />
          <ul className="PgContact">
            {cards.map((c, i) => (
              <li key={c.title} style={{ "--i": i }}>
                <a className={`PgContact__card PgContact__card--${c.tone}`} href={c.href} {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <span className="PgContact__icon" aria-hidden="true"><Icon name={c.icon} size={26} /></span>
                  <span className="PgContact__text">
                    <strong>{c.title}</strong>
                    {c.body.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </span>
                  <span className="PgContact__cta">
                    {c.cta} <Icon name="arrow" size={16} strokeWidth={2.6} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="PgBlock PgQuick" aria-labelledby="contact-quick">
          <PgHead id="contact-quick" title={tt("SITE_CONTACT_QUICK", "Looking for something else?")} />
          <div className="PgQuick__chips">
            {quick.map((q) => (
              <button key={q.to} type="button" onClick={() => history.push(q.to)}>
                <Icon name={q.icon} size={20} /> {q.label}
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </SiteShell>
  );
};

export default Contact;
