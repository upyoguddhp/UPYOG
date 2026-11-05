import { EmployeeModuleCard, CaseIcon } from "@upyog/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { wrkText } from "./config/hpworkMessages";
import HpworkApp from "./pages/employee/HpworkApp";

// HP employee Work module ("HPWORK" in MDMS citymodule) — routed at /digit-ui/employee/hpwork
export const HPWORKModule = ({ stateCode, userType }) => {
  const language = Digit.StoreData.getCurrentLanguage();
  Digit.Services.useStore({ stateCode, moduleCode: "HPWORK", language });
  return userType === "employee" ? <HpworkApp /> : null;
};

// home-page card of the employee dashboard
export const HPWORKCard = () => {
  const { t } = useTranslation();
  const user = Digit.UserService.getUser();
  if (!user || (user.info || {}).type !== "EMPLOYEE") return null;
  return (
    <EmployeeModuleCard
      Icon={<CaseIcon className="fill-path-primary-main" />}
      moduleName={wrkText(t, "ACTION_TEST_HPWORK")}
      kpis={[]}
      links={[
        { label: wrkText(t, "WRK_MENU_INBOX"), link: "/digit-ui/employee/hpwork/inbox" },
      ]}
    />
  );
};
