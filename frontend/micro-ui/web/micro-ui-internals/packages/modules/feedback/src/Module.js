import { CaseIcon, CitizenHomeCard } from "@upyog/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { fdbText } from "./config/feedbackMessages";
import FeedbackApp from "./pages/citizen/FeedbackApp";

// HP citizen feedback ("FEEDBACK" in MDMS citymodule) — routed at /digit-ui/citizen/feedback
export const FEEDBACKModule = ({ stateCode, userType }) => {
  const language = Digit.StoreData.getCurrentLanguage();
  Digit.Services.useStore({ stateCode, moduleCode: "FEEDBACK", language });
  return userType === "employee" ? null : <FeedbackApp />;
};

export const FEEDBACKLinks = ({ matchPath }) => {
  const { t } = useTranslation();
  const links = [
    { link: `${matchPath}/new`, i18nKey: fdbText(t, "FDB_MENU_NEW") },
    { link: `${matchPath}/my-feedback`, i18nKey: fdbText(t, "FDB_MENU_LIST") },
  ];
  return <CitizenHomeCard header={fdbText(t, "ACTION_TEST_FEEDBACK")} links={links} Icon={() => <CaseIcon className="fill-path-primary-main" />} />;
};
