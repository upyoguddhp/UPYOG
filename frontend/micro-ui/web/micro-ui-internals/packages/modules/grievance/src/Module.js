import { CaseIcon, CitizenHomeCard } from "@upyog/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { grvText } from "./config/grievanceMessages";
import GrievanceApp from "./pages/citizen/GrievanceApp";

// HP citizen Grievances (PGR) ("GRIEVANCE" in MDMS citymodule) — routed at /digit-ui/citizen/grievance
export const GRIEVANCEModule = ({ stateCode, userType }) => {
  const language = Digit.StoreData.getCurrentLanguage();
  Digit.Services.useStore({ stateCode, moduleCode: "GRIEVANCE", language });
  return userType === "employee" ? null : <GrievanceApp />;
};

export const GRIEVANCELinks = ({ matchPath }) => {
  const { t } = useTranslation();
  const links = [
    { link: `${matchPath}/new/grievance`, i18nKey: grvText(t, "GRV_MENU_NEW") },
    { link: `${matchPath}/my-grievances`, i18nKey: grvText(t, "GRV_MENU_LIST") },
  ];
  return <CitizenHomeCard header={grvText(t, "ACTION_TEST_GRIEVANCE")} links={links} Icon={() => <CaseIcon className="fill-path-primary-main" />} />;
};
