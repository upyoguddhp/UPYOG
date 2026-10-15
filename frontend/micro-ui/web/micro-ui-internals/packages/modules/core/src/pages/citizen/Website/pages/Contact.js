import React from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { Section } from "../components";
import { DEPARTMENT } from "../config";

const unobfuscate = (e) => e.replace("[at]", "@").replace(/\[dot\]/g, ".");

const Contact = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const tel = (n) => `tel:${n.replace(/[^+\d]/g, "")}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(DEPARTMENT.mapQuery)}`;

  const cards = [
    { icon: "pin", tone: "navy", title: tt("SITE_CONTACT_ADDRESS", "Address"), body: [DEPARTMENT.name, ...DEPARTMENT.address] },
    { icon: "phone", tone: "saffron", title: tt("SITE_CONTACT_PHONE", "Telephone"), body: [DEPARTMENT.phone], href: tel(DEPARTMENT.phone), cta: tt("SITE_CALL", "Call now") },
    { icon: "help", tone: "green", title: tt("SITE_CONTACT_HELPLINE", "Technical helpline"), body: [DEPARTMENT.helpline, tt("SITE_CONTACT_HOURS", "Mon–Sat, 9:30 AM – 6:00 PM")], href: tel(DEPARTMENT.helpline), cta: tt("SITE_CALL", "Call now") },
    { icon: "mail", tone: "blue", title: tt("SITE_CONTACT_EMAIL", "Email"), body: [DEPARTMENT.email], mail: true, cta: tt("SITE_WRITE", "Write to us") },
  ];

  return (
    <SiteShell
      activeId="contact"
      title={tt("SITE_CONTACT_TITLE", "Contact Us")}
      subtitle={tt("SITE_CONTACT_SUB", "Reach the Directorate of Urban Development, Himachal Pradesh.")}
      icon={<Icon name="phone" size={30} />}
    >
      <Section>
        <div className="SiteGrid SiteGrid--4">
          {cards.map((c) => (
            <article key={c.title} className={`ContactCard ContactCard--${c.tone}`}>
              <span className="ContactCard__icon"><Icon name={c.icon} size={26} /></span>
              <h3>{c.title}</h3>
              {c.body.map((l) => (
                <p key={l}>{l}</p>
              ))}
              {c.href ? <a className="ContactCard__cta" href={c.href}>{c.cta}</a> : null}
              {c.mail ? (
                <a
                  className="ContactCard__cta"
                  href="#write"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `mailto:${unobfuscate(DEPARTMENT.email)}`;
                  }}
                >
                  {c.cta}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </Section>

      <Section tone="band" title={tt("SITE_CONTACT_LOCATION", "Our location")}>
        <div className="SiteSplit">
          <div className="SiteSplit__text">
            <p>{DEPARTMENT.address.join(", ")}</p>
            <a className="LandingBtn LandingBtn--primary" href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Icon name="pin" size={20} /> {tt("SITE_OPEN_MAPS", "Open in Google Maps")}
            </a>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
};

export default Contact;
