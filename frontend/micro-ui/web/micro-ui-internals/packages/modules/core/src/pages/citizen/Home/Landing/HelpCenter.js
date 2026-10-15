import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "./Icons";
import { helpCards } from "./config";

/**
 * "We're here to help": Grievance, Support ticket and Chat assistant.
 * Cards whose destination is not configured are shown as "coming soon"
 * rather than linking nowhere.
 */
const HelpCenter = ({ actions }) => {
  const { t } = useTranslation();
  const tt = (key, text) => t(key, { defaultValue: text });

  return (
    <section className="LandingHelp" id="landing-help">
      <div className="LandingSection__head">
        <h2>{tt("LANDING_HELP_TITLE", "We're here to help")}</h2>
        <p>{tt("LANDING_HELP_SUB", "Three clear ways to reach us. Pick the one that matches your problem.")}</p>
      </div>
      <div className="LandingHelp__grid">
        {helpCards.map((c) => {
          const action = actions[c.id];
          const enabled = !!action;
          return (
            <article key={c.id} className={`LandingHelpCard LandingHelpCard--${c.tone}`}>
              <div className="LandingHelpCard__head">
                <span className="LandingHelpCard__icon"><Icon name={c.icon} size={26} /></span>
                <div>
                  <h3>{tt(c.titleKey, c.title)}</h3>
                  <small>{tt(c.subKey, c.sub)}</small>
                </div>
              </div>
              <p>{tt(c.descKey, c.desc)}</p>
              {enabled ? (
                <button type="button" className={`LandingBtn ${c.id === "grievance" ? "LandingBtn--primary" : "LandingBtn--navy"}`} onClick={action}>
                  <Icon name={c.icon} size={18} /> {tt(c.ctaKey, c.cta)}
                </button>
              ) : (
                <span className="LandingHelpCard__soon">{tt("LANDING_COMING_SOON", "Coming soon")}</span>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default HelpCenter;
