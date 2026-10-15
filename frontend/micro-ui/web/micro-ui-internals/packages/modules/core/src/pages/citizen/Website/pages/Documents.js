import React from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { EmptyState } from "../components";

/** RTI documents: the list is maintained by the Directorate; empty until published. */
export const Rti = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  return (
    <SiteShell
      activeId="rti"
      title={tt("SITE_RTI_TITLE", "RTI Documents")}
      subtitle={tt("SITE_RTI_SUB", "Documents published under the Right to Information Act.")}
      icon={<Icon name="doc" size={30} />}
    >
      <EmptyState
        icon="doc"
        title={tt("SITE_RTI_EMPTY", "No RTI documents have been published yet")}
        text={tt("SITE_RTI_EMPTY_T", "Documents will appear here as soon as the Directorate publishes them. For urgent queries please use the contact details on the Contact Us page.")}
      />
    </SiteShell>
  );
};

export default Rti;
