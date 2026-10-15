import React from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";

/** Structure of urban local bodies under the Directorate (figures from the portal FAQ). */
const Organization = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const tiers = [
    { count: 5, label: tt("SITE_STAT_MC", "Municipal Corporations"), tone: "navy" },
    { count: 29, label: tt("SITE_STAT_COUNCIL", "Municipal Councils"), tone: "blue" },
    { count: 26, label: tt("SITE_STAT_NP", "Nagar Panchayats"), tone: "green" },
  ];
  return (
    <SiteShell
      activeId="organization"
      title={tt("SITE_ORG_TITLE", "Organization Chart")}
      subtitle={tt("SITE_ORG_SUB", "Urban local bodies administered by the Directorate of Urban Development.")}
      icon={<Icon name="users" size={30} />}
    >
      <div className="OrgChart" role="img" aria-label={tt("SITE_ORG_ARIA", "Directorate of Urban Development manages 60 urban local bodies: 5 municipal corporations, 29 municipal councils and 26 nagar panchayats")}>
        <div className="OrgChart__root">
          <Icon name="building" size={30} />
          <strong>{tt("SITE_ORG_ROOT", "Directorate of Urban Development")}</strong>
          <span>{tt("SITE_ORG_ROOT_T", "Himachal Pradesh · est. 1985-86")}</span>
        </div>
        <div className="OrgChart__stem" aria-hidden="true" />
        <div className="OrgChart__total">
          <strong>60</strong> {tt("SITE_STAT_ULB", "Urban Local Bodies")}
        </div>
        <div className="OrgChart__branches" aria-hidden="true" />
        <div className="OrgChart__tiers">
          {tiers.map((tier) => (
            <div key={tier.label} className={`OrgChart__tier OrgChart__tier--${tier.tone}`}>
              <strong>{tier.count}</strong>
              <span>{tier.label}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="SiteNote">
        {tt("SITE_ORG_NOTE", "The Directorate oversees the legislative, administrative and developmental activities of urban local bodies. After the 74th Constitutional Amendment it decentralizes administrative and financial functions to municipalities.")}
      </p>
    </SiteShell>
  );
};

export default Organization;
