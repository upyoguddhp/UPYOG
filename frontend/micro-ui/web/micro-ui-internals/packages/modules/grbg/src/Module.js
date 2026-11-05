import { CaseIcon, CitizenHomeCard } from "@upyog/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { grbText } from "./config/newGRBMessages";
import NewGRBApp from "./pages/citizen/NewGRB/NewGRBApp";

// HP Garbage Collection ("GB" in MDMS citymodule) — routed at /digit-ui/citizen/gb
export const GBModule = ({ stateCode, userType }) => {
  const language = Digit.StoreData.getCurrentLanguage();
  Digit.Services.useStore({ stateCode, moduleCode: "GB", language });
  return userType === "employee" ? null : <NewGRBApp />;
};

export const GBLinks = ({ matchPath }) => {
  const { t } = useTranslation();
  const links = [
    { link: `${matchPath}/new-registration`, i18nKey: grbText(t, "GRB_MENU_NEW_REGISTRATION") },
    { link: `${matchPath}/my-registrations`, i18nKey: grbText(t, "GRB_MENU_MY_APPLICATIONS") },
  ];
  return <CitizenHomeCard header={grbText(t, "ACTION_TEST_GB")} links={links} Icon={() => <CaseIcon className="fill-path-primary-main" />} />;
};
