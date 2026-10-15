import React from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { FeatureCard, Section, Stat } from "../components";

const SERVICES = [
  ["cert", "Trade License"],
  ["leaf", "Garbage Collection & Billing"],
  ["megaphone", "Advertisement Hoarding & Canopy Permission"],
  ["paw", "Pet Registration"],
  ["building", "Asset Management"],
  ["calendar", "Booking of Community Halls & Grounds"],
  ["pay", "Property Tax Module"],
  ["alert", "Public Grievance Module"],
  ["list", "RDF Module"],
];

const Introduction = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });

  return (
    <SiteShell
      activeId="about"
      title={tt("SITE_ABOUT_TITLE", "About Citizen Seva Portal")}
      subtitle={tt("SITE_ABOUT_SUB", "A centralized digital platform in all urban local bodies for online delivery of citizen-centric services.")}
      icon={<Icon name="info" size={30} />}
    >
      <Section>
        <div className="SiteSplit">
          <div className="SiteSplit__text">
            <h2 className="SiteSection__title">{tt("SITE_ABOUT_HEAD", "One portal for every urban local body")}</h2>
            <p>{tt("SITE_ABOUT_P1", "The Citizen Seva Portal is a centralized digital platform in all urban local bodies for online delivery of urban citizen-centric services.")}</p>
            <p>{tt("SITE_ABOUT_P2", "It scales up e-governance across all Urban Local Bodies (ULBs) and builds on national collaboration for improved implementation of urban programs.")}</p>
            <p>{tt("SITE_ABOUT_P3", "The portal is implemented on UPYOG (Urban Platform for Delivery of Online Governance), under the National Urban Digital Mission.")}</p>
          </div>
          <div className="SiteSplit__stats" aria-label={tt("SITE_ABOUT_STATS", "Urban local bodies in Himachal Pradesh")}>
            <Stat value="60" label={tt("SITE_STAT_ULB", "Urban Local Bodies")} />
            <Stat value="5" label={tt("SITE_STAT_MC", "Municipal Corporations")} />
            <Stat value="29" label={tt("SITE_STAT_COUNCIL", "Municipal Councils")} />
            <Stat value="26" label={tt("SITE_STAT_NP", "Nagar Panchayats")} />
          </div>
        </div>
      </Section>

      <Section title={tt("SITE_BENEFITS", "Benefits")}>
        <div className="SiteGrid SiteGrid--3">
          <FeatureCard icon="clock" tone="blue" title={tt("SITE_BEN_1", "Streamlined & time-bound approvals")} text={tt("SITE_BEN_1_T", "Applications move through a defined workflow with clear timelines.")} />
          <FeatureCard icon="shield" tone="green" title={tt("SITE_BEN_2", "Transparency & accountability")} text={tt("SITE_BEN_2_T", "Enhanced transparency and accountability in municipal administration.")} />
          <FeatureCard icon="help" tone="saffron" title={tt("SITE_BEN_3", "Information available 24/7")} text={tt("SITE_BEN_3_T", "Services and information are available online, anytime and anywhere.")} />
        </div>
      </Section>

      <Section title={tt("SITE_SERVICES_AVAILABLE", "Services available on Citizen Seva Portal")}>
        <ul className="SiteChips">
          {SERVICES.map(([icon, label]) => (
            <li key={label}>
              <Icon name={icon} size={22} />
              <span>{tt(`SITE_SVC_${label.replace(/[^A-Za-z]/g, "_").toUpperCase()}`, label)}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={tt("SITE_KEY_FEATURES", "Key features")}>
        <div className="SiteGrid SiteGrid--2">
          <FeatureCard icon="users" tone="blue" title={tt("SITE_KF_1", "Ease of living")} text={tt("SITE_KF_1_T", "Hassle-free access to government services for citizens.")} />
          <FeatureCard icon="building" tone="green" title={tt("SITE_KF_2", "Single, integrated view")} text={tt("SITE_KF_2_T", "One integrated view of ULB information systems across the state.")} />
          <FeatureCard icon="home" tone="saffron" title={tt("SITE_KF_3", "Single window, anytime-anywhere")} text={tt("SITE_KF_3_T", "A single window platform available on an anytime-anywhere basis.")} />
          <FeatureCard icon="cert" tone="navy" title={tt("SITE_KF_4", "Digitally signed approvals")} text={tt("SITE_KF_4_T", "Digitally / e-signed approvals, NOCs and licences.")} />
        </div>
      </Section>

      <Section
        tone="band"
        title={tt("SITE_NUDM", "National Urban Digital Mission")}
        intro={tt("SITE_NUDM_T", "Mission launched in February 2021.")}
      >
        <div className="SiteGrid SiteGrid--4">
          <FeatureCard icon="home" tone="navy" title={tt("SITE_NUDM_1", "National level platform")} text={tt("SITE_NUDM_1_T", "Ready-to-use, customizable IT platform: UPYOG.")} />
          <FeatureCard icon="users" tone="navy" title={tt("SITE_NUDM_2", "Hand-holding support")} text={tt("SITE_NUDM_2_T", "Cloud services, empanelled agencies, capacity building.")} />
          <FeatureCard icon="shield" tone="navy" title={tt("SITE_NUDM_3", "Standards")} text={tt("SITE_NUDM_3_T", "Domain and technology standards, API documents.")} />
          <FeatureCard icon="book" tone="navy" title={tt("SITE_NUDM_4", "Toolkits")} text={tt("SITE_NUDM_4_T", "Program guidelines, dashboards, model RFP and more.")} />
        </div>
      </Section>
    </SiteShell>
  );
};

export default Introduction;
