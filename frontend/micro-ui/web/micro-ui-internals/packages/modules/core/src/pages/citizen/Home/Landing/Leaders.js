import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "./Icons";
import { leaders } from "./config";

/** Photo with a silhouette fallback when the image is missing. */
const Photo = ({ src, alt }) => {
  const [failed, setFailed] = React.useState(!src);
  if (failed)
    return (
      <span className="LandingLeader__ph" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="100%" height="100%"><circle cx="32" cy="24" r="12" fill="currentColor" /><path d="M8 64c0-16 10-24 24-24s24 8 24 24z" fill="currentColor" /></svg>
      </span>
    );
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
};

/** Profile cards: Hon'ble CM, Minister, Secretary and Director. */
const Leaders = ({ onOpen }) => {
  const { t } = useTranslation();
  return (
    <ul className="LandingLeaders" aria-label={t("LANDING_LEADERSHIP", { defaultValue: "Leadership" })}>
      {leaders.map((l, i) => {
        const title = t(l.titleKey, { defaultValue: l.title });
        return (
          <li key={l.id} className={`LandingLeader LandingLeader--${l.id}`} data-reveal style={{ "--i": i + 1 }}>
            <div className="LandingLeader__ring">
              <div className="LandingLeader__photo"><Photo src={l.photo} alt={l.name || title} /></div>
            </div>
            <div className="LandingLeader__body">
              <strong className="LandingLeader__title">{title}</strong>
              {l.name ? <span className="LandingLeader__name">{l.name}</span> : null}
              <span className="LandingLeader__links">
                <button type="button" onClick={() => onOpen(l.profileUrl)}>
                  {t("LANDING_LEADER_PROFILE", { defaultValue: "Profile" })} <Icon name="arrow" size={14} />
                </button>
                <button type="button" onClick={() => onOpen(l.contactUrl)}>
                  {t("LANDING_LEADER_CONTACT", { defaultValue: "Contact" })} <Icon name="arrow" size={14} />
                </button>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default Leaders;
