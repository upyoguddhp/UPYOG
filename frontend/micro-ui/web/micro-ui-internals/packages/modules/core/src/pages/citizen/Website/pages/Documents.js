import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { PgCta, PgEmpty } from "../components";
import { ROUTES } from "../config";

/** RTI documents: the list is maintained by the Directorate; empty until published. */
export const Rti = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tt = (k, d) => t(k, { defaultValue: d });
  return (
    <SiteShell
      activeId="rti"
      title={tt("SITE_RTI_TITLE", "RTI Documents")}
      subtitle={tt("SITE_RTI_SUB", "Documents published under the Right to Information Act.")}
      icon={<Icon name="doc" size={30} />}
    >
      <div className="PgPage">
        <PgEmpty
          icon="doc"
          title={tt("SITE_RTI_EMPTY", "No RTI documents have been published yet")}
          text={tt("SITE_RTI_EMPTY_T", "Documents will appear here as soon as the Directorate publishes them. For urgent queries please use the contact details on the Contact Us page.")}
        />
        <PgCta title={tt("SITE_RTI_CTA", "Need information urgently?")} text={tt("SITE_RTI_CTA_T", "Write to the Directorate or call the office during working hours.")}>
          <button type="button" className="LandingBtn LandingBtn--primary" onClick={() => history.push(ROUTES.contact)}>
            {tt("SITE_NAV_CONTACT", "Contact Us")}
          </button>
        </PgCta>
      </div>
    </SiteShell>
  );
};

export default Rti;
