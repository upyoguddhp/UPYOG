import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { Reveal } from "../components";
import { MUNICIPAL_CORPORATIONS, ulbTierCounts } from "../../Home/Landing/config";
import { HP_MAP } from "../../Home/Landing/himachalGeo";

// town names come from the map data as written (e.g. "NerChowk"); split run-together words for reading
const prettyName = (n) => String(n).replace(/([a-z])([A-Z])/g, "$1 $2");

/** Structure of urban local bodies under the Directorate (counts: Home/Landing/config.js `ulbTierCounts`). */
const Organization = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const [openTier, setOpenTier] = useState(null);
  const mcSet = useMemo(() => new Set(MUNICIPAL_CORPORATIONS.map((n) => n.toLowerCase())), []);
  const lists = useMemo(() => {
    const pins = (HP_MAP && HP_MAP.pins) || [];
    const others = pins
      .filter((p) => !mcSet.has(String(p.name).toLowerCase()))
      .map((p) => prettyName(p.name))
      .sort((a, b) => a.localeCompare(b));
    return { mc: MUNICIPAL_CORPORATIONS.slice().sort(), others };
  }, [mcSet]);
  const total = ulbTierCounts.mc + ulbTierCounts.council + ulbTierCounts.np;
  const tiers = [
    { id: "mc", count: ulbTierCounts.mc, label: tt("SITE_STAT_MC", "Municipal Corporations"), tone: "saffron", icon: "users" },
    { id: "council", count: ulbTierCounts.council, label: tt("SITE_STAT_COUNCIL", "Municipal Councils"), tone: "green", icon: "home" },
    { id: "np", count: ulbTierCounts.np, label: tt("SITE_STAT_NP", "Nagar Panchayats"), tone: "violet", icon: "leaf" },
  ];
  return (
    <SiteShell
      activeId="organization"
      title={tt("SITE_ORG_TITLE", "Organization Chart")}
      subtitle={tt("SITE_ORG_SUB", "Urban local bodies administered by the Directorate of Urban Development.")}
      icon={<Icon name="users" size={30} />}
    >
      <div className="PgPage">
        <Reveal
          className="PgOrg"
          aria-label={tt("SITE_ORG_ARIA", `Directorate of Urban Development manages ${total} urban local bodies: ${ulbTierCounts.mc} municipal corporations, ${ulbTierCounts.council} municipal councils and ${ulbTierCounts.np} nagar panchayats`)}
        >
          <div className="PgOrg__root">
            <span aria-hidden="true"><Icon name="building" size={30} /></span>
            <strong>{tt("SITE_ORG_ROOT", "Directorate of Urban Development")}</strong>
            <small>{tt("SITE_ORG_ROOT_T", "Himachal Pradesh · est. 1985-86")}</small>
          </div>
          <div className="PgOrg__total">
            <strong>{total}</strong>
            <span>{tt("SITE_STAT_ULB", "Urban Local Bodies")}</span>
          </div>
          <div className="PgOrg__tiers" role="group" aria-label={tt("SITE_ORG_TIERS", "Types of urban local bodies. Select one to see the ULB names.")}>
            {tiers.map((tier, i) => {
              const on = openTier === (tier.id === "mc" ? "mc" : "others");
              const key = tier.id === "mc" ? "mc" : "others";
              return (
                <button
                  key={tier.id}
                  type="button"
                  className={`PgOrg__tier PgOrg__tier--${tier.tone}${on ? " is-open" : ""}`}
                  style={{ "--i": i }}
                  aria-expanded={on}
                  aria-controls="pg-org-ulbs"
                  onClick={() => setOpenTier(on ? null : key)}
                >
                  <span className="PgOrg__tierIcon" aria-hidden="true"><Icon name={tier.icon} size={22} /></span>
                  <strong>{tier.count}</strong>
                  <span>{tier.label}</span>
                  <em className="PgOrg__chev" aria-hidden="true">{on ? "−" : "+"}</em>
                  <i aria-hidden="true"><b style={{ width: `${Math.round((tier.count / total) * 100)}%` }} /></i>
                </button>
              );
            })}
          </div>
          <div id="pg-org-ulbs" className="PgOrg__ulbs" aria-live="polite">
            {openTier ? (
              <div className="PgOrg__ulbPanel">
                <h3>
                  {openTier === "mc"
                    ? `${tt("SITE_STAT_MC", "Municipal Corporations")} (${lists.mc.length})`
                    : `${tt("SITE_ORG_OTHERS", "Municipal Councils and Nagar Panchayats")} (${lists.others.length})`}
                </h3>
                {openTier === "others" ? (
                  <p className="PgOrg__ulbNote">
                    {tt("SITE_ORG_OTHERS_NOTE", "The split between the 29 Municipal Councils and 26 Nagar Panchayats is not published per ULB yet, so they are listed together.")}
                  </p>
                ) : null}
                <ul className="PgOrg__ulbList">
                  {(openTier === "mc" ? lists.mc : lists.others).map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Reveal>

        <Reveal className="PgNote">
          <span aria-hidden="true"><Icon name="info" size={22} /></span>
          <p>{tt("SITE_ORG_NOTE", "The Directorate oversees the legislative, administrative and developmental activities of urban local bodies. After the 74th Constitutional Amendment it decentralizes administrative and financial functions to municipalities.")}</p>
        </Reveal>
      </div>
    </SiteShell>
  );
};

export default Organization;
