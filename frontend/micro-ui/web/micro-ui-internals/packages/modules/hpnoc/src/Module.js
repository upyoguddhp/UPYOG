import { CaseIcon, CitizenHomeCard } from "@upyog/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { rqsText } from "./config/hpnocMessages";
import HpnocApp from "./pages/citizen/HpnocApp";

// HP citizen NOC services ("HPNOC" in MDMS citymodule) — routed at /digit-ui/citizen/hpnoc
export const HPNOCModule = ({ stateCode, userType }) => {
  const language = Digit.StoreData.getCurrentLanguage();
  Digit.Services.useStore({ stateCode, moduleCode: "HPNOC", language });
  return userType === "employee" ? null : <HpnocApp />;
};

export const HPNOCLinks = ({ matchPath }) => {
  const { t } = useTranslation();
  const links = [
    { link: `${matchPath}/new/noc`, i18nKey: rqsText(t, "HNC_MENU_NEW") },
    { link: `${matchPath}/my-requests`, i18nKey: rqsText(t, "HNC_MENU_LIST") },
  ];
  return <CitizenHomeCard header={rqsText(t, "ACTION_TEST_HPNOC")} links={links} Icon={() => <CaseIcon className="fill-path-primary-main" />} />;
};
