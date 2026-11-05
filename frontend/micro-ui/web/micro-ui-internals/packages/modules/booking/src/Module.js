import { CaseIcon, CitizenHomeCard } from "@upyog/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { bkgText } from "./config/bookingMessages";
import BookingApp from "./pages/citizen/BookingApp";

// HP citizen bookings: advertisement sites and community halls ("BOOKING" in MDMS citymodule) — routed at /digit-ui/citizen/booking
export const BOOKINGModule = ({ stateCode, userType }) => {
  const language = Digit.StoreData.getCurrentLanguage();
  Digit.Services.useStore({ stateCode, moduleCode: "BOOKING", language });
  return userType === "employee" ? null : <BookingApp />;
};

export const BOOKINGLinks = ({ matchPath }) => {
  const { t } = useTranslation();
  const links = [
    { link: `${matchPath}/site/new/select`, i18nKey: bkgText(t, "BKG_MENU_SITE_NEW") },
    { link: `${matchPath}/site/my-bookings`, i18nKey: bkgText(t, "BKG_MENU_SITE_LIST") },
    { link: `${matchPath}/asset/new/select`, i18nKey: bkgText(t, "BKG_MENU_ASSET_NEW") },
    { link: `${matchPath}/asset/my-bookings`, i18nKey: bkgText(t, "BKG_MENU_ASSET_LIST") },
  ];
  return <CitizenHomeCard header={bkgText(t, "ACTION_TEST_BOOKING")} links={links} Icon={() => <CaseIcon className="fill-path-primary-main" />} />;
};
