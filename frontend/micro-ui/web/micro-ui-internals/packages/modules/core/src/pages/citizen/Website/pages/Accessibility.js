import React from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import AccessibilityStatement from "../../AccessibilityStatement";

/** The statement page rendered inside the website shell (header / footer). */
const AccessibilityPage = () => {
  const { t } = useTranslation();
  return (
    <SiteShell
      activeId="accessibility"
      title={t("A11Y_STMT_TITLE", { defaultValue: "Accessibility Statement" })}
      subtitle={t("A11Y_STMT_SUB", { defaultValue: "Our commitment to an accessible portal for everyone." })}
      icon={<Icon name="users" size={30} />}
    >
      <AccessibilityStatement embedded />
    </SiteShell>
  );
};

export default AccessibilityPage;
