import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { defaultNews } from "./config";

/**
 * Scrolling news ticker shown just below the hero.
 * Items come from MDMS uiHomePage.newsAndNotifications ([{ title, date, navigationUrl }]),
 * falling back to config defaultNews. Pauses on hover/focus and via the pause button;
 * with reduced motion it becomes a plain horizontally scrollable strip.
 */
const NewsTicker = ({ items, onOpen }) => {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const list = (items && items.length ? items : defaultNews.map((n) => ({ ...n, title: t(n.key, { defaultValue: n.title }) }))).filter((n) => n && n.title);
  if (!list.length) return null;

  const renderItems = (hidden) =>
    list.map((n, i) => (
      <li key={`${hidden ? "b" : "a"}${i}`} aria-hidden={hidden || undefined}>
        <button type="button" tabIndex={hidden ? -1 : 0} disabled={!n.navigationUrl} onClick={() => n.navigationUrl && onOpen(n.navigationUrl)}>
          {n.date ? <time>{n.date}</time> : null}
          <span>{n.title}</span>
        </button>
      </li>
    ));

  return (
    <section className={`LandingTicker${paused ? " is-paused" : ""}`} aria-label={t("LANDING_TICKER_LABEL", { defaultValue: "Latest news and updates" })}>
      <div className="LandingWrap LandingTicker__row">
        <span className="LandingTicker__label">
          <i aria-hidden="true" />
          {t("LANDING_TICKER_TITLE", { defaultValue: "Latest" })}
        </span>
        <div className="LandingTicker__viewport">
          <ul className="LandingTicker__track">
            {renderItems(false)}
            {renderItems(true)}
          </ul>
        </div>
        <button
          type="button"
          className="LandingTicker__toggle"
          aria-pressed={paused}
          aria-label={paused ? t("LANDING_TICKER_PLAY", { defaultValue: "Resume news ticker" }) : t("LANDING_TICKER_PAUSE", { defaultValue: "Pause news ticker" })}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "▶" : "❚❚"}
        </button>
      </div>
    </section>
  );
};

export default NewsTicker;
