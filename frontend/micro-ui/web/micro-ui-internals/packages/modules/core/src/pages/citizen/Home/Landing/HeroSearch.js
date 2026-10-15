import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "./Icons";

/**
 * Hero: headline, service search and the three help calls-to-action
 * (grievance, ticket, chat). Search is lifted to the parent so the
 * Services explorer below can filter live while the user types.
 */
const HeroSearch = ({ query, onQueryChange, onSubmit, onPopular, popular = [], onGrievance, onTicket, onChat, grievanceEnabled, ticketEnabled, chatEnabled, tenants = [], selectedCity, onCityChange, ulbCount }) => {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const SpeechRecognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  const toggleVoice = () => {
    if (!SpeechRecognition) return;
    if (listening && recRef.current) return recRef.current.stop();
    const rec = new SpeechRecognition();
    rec.lang = Digit.StoreData.getCurrentLanguage() === "hi_IN" ? "hi-IN" : "en-IN";
    rec.onresult = (e) => onQueryChange(e.results?.[0]?.[0]?.transcript || "");
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };
  const tt = (key, text) => t(key, { defaultValue: text });

  return (
    <section className="LandingHero">
      <div className="LandingHero__inner">
        <span className="LandingHero__eyebrow">
          {tt("LANDING_EYEBROW", "नागरिक सेवाएँ")}
          {ulbCount ? ` · ${ulbCount} ${tt("LANDING_ULBS", "urban local bodies")}` : ""}
        </span>
        <h1 className="LandingHero__title">
          {tt("LANDING_TITLE_1", "Every municipal service,")}
          <span>{tt("LANDING_TITLE_2", "one click away.")}</span>
        </h1>
        <p className="LandingHero__sub">{tt("LANDING_SUBTITLE", "Apply, pay, track and get help — in English or हिन्दी, on any device.")}</p>

        <form
          className={`LandingSearch ${focused ? "LandingSearch--focused" : ""}`}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <Icon name="search" size={22} className="LandingSearch__icon" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={tt("LANDING_SEARCH_PLACEHOLDER", "Search a service, e.g. property tax")}
            aria-label={tt("LANDING_SEARCH_ARIA", "Search services")}
          />
          {SpeechRecognition && (
            <button
              type="button"
              className={`LandingSearch__mic ${listening ? "is-listening" : ""}`}
              onClick={toggleVoice}
              aria-label={tt("LANDING_VOICE", "Search by voice")}
              aria-pressed={listening}
            >
              <Icon name="mic" size={22} />
            </button>
          )}
          {tenants.length > 0 && (
            <label className="LandingSearch__city">
              <span className="sr-only">{tt("LANDING_CITY", "Your city")}</span>
              <select value={selectedCity || ""} onChange={(e) => onCityChange(e.target.value)}>
                <option value="">{tt("LANDING_ALL_CITIES", "All cities")}</option>
                {tenants.map((c) => (
                  <option key={c.code} value={c.code}>
                    {t(c.i18nKey, { defaultValue: c.name || c.code })}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="submit" className="LandingSearch__go" aria-label={tt("LANDING_SEARCH_GO", "Search")}>
            <Icon name="arrow" size={22} strokeWidth={2.4} />
          </button>
        </form>

        {popular.length > 0 && (
          <div className="LandingHero__popular">
            <span>{tt("LANDING_POPULAR", "Popular:")}</span>
            {popular.map((p) => (
              <button type="button" key={p.key} className="LandingChip" onClick={() => onPopular(p)}>
                {tt(p.key, p.text)}
              </button>
            ))}
          </div>
        )}

        {(grievanceEnabled || ticketEnabled || chatEnabled) && (
        <div className="LandingHero__help">
          <span className="LandingHero__helpLabel">{tt("LANDING_NEED_HELP", "Need help?")}</span>
          <div className="LandingHero__ctas">
            {grievanceEnabled && (
              <button type="button" className="LandingBtn LandingBtn--primary" onClick={onGrievance}>
                <Icon name="alert" size={20} /> {tt("LANDING_CTA_GRIEVANCE", "Raise a grievance")}
              </button>
            )}
            {ticketEnabled && (
              <button type="button" className="LandingBtn LandingBtn--glass" onClick={onTicket}>
                <Icon name="ticket" size={20} /> {tt("LANDING_CTA_TICKET", "Create support ticket")}
              </button>
            )}
            {chatEnabled && (
              <button type="button" className="LandingBtn LandingBtn--glass" onClick={onChat}>
                <Icon name="bot" size={20} /> {tt("LANDING_CTA_CHAT", "Chat with assistant")}
              </button>
            )}
          </div>
        </div>
        )}
      </div>
    </section>
  );
};

export default HeroSearch;
