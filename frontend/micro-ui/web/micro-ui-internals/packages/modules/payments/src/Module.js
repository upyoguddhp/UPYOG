import { CitizenHomeCard, CaseIcon } from "@upyog/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { payText } from "./config/payMessages";
import PaymentsApp from "./pages/citizen/PaymentsApp";

// HP citizen Dues & payments ("HPPAY" in MDMS citymodule) — routed at /digit-ui/citizen/hppay
export const HPPAYModule = ({ stateCode, userType }) => {
  const language = Digit.StoreData.getCurrentLanguage();
  Digit.Services.useStore({ stateCode, moduleCode: "HPPAY", language });
  return userType === "employee" ? null : <PaymentsApp />;
};

export const HPPAYLinks = ({ matchPath }) => {
  const { t } = useTranslation();
  const links = [
    { link: `${matchPath}/dues`, i18nKey: payText(t, "PAY_MENU_DUES") },
    { link: `${matchPath}/history`, i18nKey: payText(t, "PAY_MENU_HISTORY") },
  ];
  return <CitizenHomeCard header={payText(t, "ACTION_TEST_HPPAY")} links={links} Icon={() => <CaseIcon className="fill-path-primary-main" />} />;
};
