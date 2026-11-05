import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { HP_MAP } from "./himachalGeo";

/** Himachal Pradesh outline with a pin for every urban local body; Shimla (state HQ) is the star. */
const HimachalMap = ({ active }) => {
  const { t } = useTranslation();
  const [hover, setHover] = useState(null);
  const { width, height, path, pins } = HP_MAP;
  const capital = pins.find((p) => p.capital);
  const others = pins.filter((p) => !p.capital);
  const idle = t("LANDING_MAP_HINT", { defaultValue: "Hover a pin to see the urban local body" });

  return (
    <figure className="LandingMap" data-active={active || undefined}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t("LANDING_MAP_LABEL", { defaultValue: "Map of Himachal Pradesh showing urban local bodies" })}>
        <defs>
          <linearGradient id="hpFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffe9d1" />
            <stop offset="0.55" stopColor="#e8f0ff" />
            <stop offset="1" stopColor="#dff3dc" />
          </linearGradient>
          <filter id="hpShadow" x="-10%" y="-10%" width="120%" height="125%">
            <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#14224d" floodOpacity="0.18" />
          </filter>
        </defs>
        <path className="LandingMap__land" d={path} fill="url(#hpFill)" filter="url(#hpShadow)" />
        <path className="LandingMap__edge" d={path} fill="none" />

        {others.map((p, i) => (
          <g
            key={p.name}
            className={`LandingPin LandingPin--${p.tier}`}
            data-tier={p.tier}
            style={{ "--d": i }}
            transform={`translate(${p.x} ${p.y})`}
            onMouseEnter={() => setHover(p.name)}
            onMouseLeave={() => setHover(null)}
          >
            <circle className="LandingPin__halo" r="9" />
            <circle className="LandingPin__dot" r="4.6" />
            <title>{p.name}</title>
          </g>
        ))}

        {capital && (
          <g className="LandingPin LandingPin--capital" data-tier={capital.tier} transform={`translate(${capital.x} ${capital.y})`} onMouseEnter={() => setHover(`${capital.name} — ${t("LANDING_MAP_HQ", { defaultValue: "State headquarters" })}`)} onMouseLeave={() => setHover(null)}>
            <circle className="LandingPin__pulse" r="12" />
            <path className="LandingPin__star" d="M0 -11 L3.2 -3.6 L11 -3.4 L4.8 1.6 L7 9.4 L0 5 L-7 9.4 L-4.8 1.6 L-11 -3.4 L-3.2 -3.6 Z" />
            <title>{capital.name}</title>
          </g>
        )}
      </svg>
      <figcaption className="LandingMap__caption" aria-live="polite">
        <i aria-hidden="true" />{hover || idle}
      </figcaption>
    </figure>
  );
};

export default HimachalMap;
