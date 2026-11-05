import { CaseIcon, CitizenHomeCard } from "@upyog/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { rqsText } from "./config/reqsvcMessages";
import ReqsvcApp from "./pages/citizen/ReqsvcApp";

// HP citizen Request Services ("REQSVC" in MDMS citymodule) — routed at /digit-ui/citizen/reqsvc
export const REQSVCModule = ({ stateCode, userType }) => {
  const language = Digit.StoreData.getCurrentLanguage();
  Digit.Services.useStore({ stateCode, moduleCode: "REQSVC", language });
  return userType === "employee" ? null : <ReqsvcApp />;
};

export const REQSVCLinks = ({ matchPath }) => {
  const { t } = useTranslation();
  const links = [
    { link: `${matchPath}/new/request`, i18nKey: rqsText(t, "RQS_MENU_NEW") },
    { link: `${matchPath}/my-requests`, i18nKey: rqsText(t, "RQS_MENU_LIST") },
  ];
  return <CitizenHomeCard header={rqsText(t, "ACTION_TEST_REQSVC")} links={links} Icon={() => <CaseIcon className="fill-path-primary-main" />} />;
};
