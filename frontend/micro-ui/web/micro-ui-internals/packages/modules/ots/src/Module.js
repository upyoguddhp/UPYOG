import { CaseIcon, CitizenHomeCard } from "@upyog/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { otsText } from "./config/otsMessages";
import OTSApp from "./pages/citizen/OTSApp";

// HP citizen One Time Settlement ("OTS" in MDMS citymodule) — routed at /digit-ui/citizen/ots
export const OTSModule = ({ stateCode, userType }) => {
  const language = Digit.StoreData.getCurrentLanguage();
  Digit.Services.useStore({ stateCode, moduleCode: "OTS", language });
  return userType === "employee" ? null : <OTSApp />;
};

export const OTSLinks = ({ matchPath }) => {
  const { t } = useTranslation();
  const links = [
    { link: `${matchPath}/new/applicant`, i18nKey: otsText(t, "OTS_MENU_NEW") },
    { link: `${matchPath}/my-applications`, i18nKey: otsText(t, "OTS_MENU_LIST") },
  ];
  return <CitizenHomeCard header={otsText(t, "ACTION_TEST_OTS")} links={links} Icon={() => <CaseIcon className="fill-path-primary-main" />} />;
};
