import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useLocation, useRouteMatch, useHistory } from "react-router-dom";
import { AppModules } from "../../components/AppModules";
import ErrorBoundary from "../../components/ErrorBoundaries";
import TopBarSideBar from "../../components/TopBarSideBar";
import EmployeeShell from "../../components/EmployeeShell";
import ChangePassword from "./ChangePassword";
import ForgotPassword from "./ForgotPassword";
import LanguageSelection from "./LanguageSelection";
import EmployeeLogin from "./Login";
import UserProfile from "../citizen/Home/UserProfile";
import ErrorComponent from "../../components/ErrorComponent";
import { PrivateRoute } from "@upyog/digit-ui-react-components";

const userScreensExempted = ["user/profile", "user/error"];

const EmployeeApp = ({
  stateInfo,
  userDetails,
  CITIZEN,
  cityDetails,
  mobileView,
  handleUserDropdownSelection,
  logoUrl,
  DSO,
  stateCode,
  modules,
  appTenants,
  sourceUrl,
  pathname,
  initData,
}) => {
  const history = useHistory();
  const { t } = useTranslation();
  const { path } = useRouteMatch();
  const location = useLocation();
  const showLanguageChange = location?.pathname?.includes("language-selection");
  const isUserProfile = userScreensExempted.some((url) => location?.pathname?.includes(url));
  useEffect(() => {
    console.log("isMobile", window.Digit.Utils.browser.isMobile(),window.innerWidth)
    Digit.UserService.setType("employee");
  }, []);
  sourceUrl = "https://s3.ap-south-1.amazonaws.com/egov-qa-assets";
  const pdfUrl = "https://pg-egov-assets.s3.ap-south-1.amazonaws.com/Upyog+Code+and+Copyright+License_v1.pdf"

  // profile screen sits inside the same shell as the rest of the employee app
  if (location?.pathname?.includes("user/profile")) {
    return (
      <div className="employee">
        <EmployeeShell>
          <PrivateRoute path={`${path}/user/profile`}>
            <UserProfile stateCode={stateCode} userType={"employee"} cityDetails={cityDetails} />
          </PrivateRoute>
        </EmployeeShell>
      </div>
    );
  }

  return (
    <div className="employee">
      <Switch>
        <Route path={`${path}/user`}>
          {isUserProfile && (
            <TopBarSideBar
              t={t}
              stateInfo={stateInfo}
              userDetails={userDetails}
              CITIZEN={CITIZEN}
              cityDetails={cityDetails}
              mobileView={mobileView}
              handleUserDropdownSelection={handleUserDropdownSelection}
              logoUrl={logoUrl}
              showSidebar={isUserProfile ? true : false}
              showLanguageChange={!showLanguageChange}
            />
          )}
          <div
            className={isUserProfile ? "grounded-container" : "loginContainer"}
            style={
              isUserProfile
                ? { padding: 0, paddingTop: "80px", marginLeft: mobileView ? "" : "64px" }
                : { "--banner-url": `url(${stateInfo?.bannerUrl})`, padding: "0px" }
            }
          >
            <div className="loginnn">
              {/* <picture>
              <source media="(min-width: 760px)" src="https://i.postimg.cc/wxnnKGtG/Banner-18-10-22-1.png" style={{"position":"absolute","height":"100%","width":"100%"}}/>
                <source media="(min-width: 400px)" srcset="https://i.postimg.cc/9Q7jT6Dd/Banner-Image-2.png" style={{"position":"absolute","height":"100%","width":"100%"}}/>
                </picture> */}
            <Switch>
              <Route path={`${path}/user/login`}>
                <EmployeeLogin />
              </Route>
              <Route path={`${path}/user/forgot-password`}>
                <ForgotPassword />
              </Route>
              <Route path={`${path}/user/change-password`}>
                <ChangePassword />
              </Route>
              <PrivateRoute path={`${path}/user/profile`}>
                <UserProfile stateCode={stateCode} userType={"employee"} cityDetails={cityDetails} />
              </PrivateRoute>
              <Route path={`${path}/user/error`}>
                <ErrorComponent
                  initData={initData}
                  goToHome={() => {
                    history.push("/digit-ui/employee");
                  }}
                />
              </Route>
              <Route path={`${path}/user/language-selection`}>
                <LanguageSelection />
              </Route>
              <Route>
                <Redirect to={`${path}/user/language-selection`} />
              </Route>
            </Switch>
            </div>
          </div>
        </Route>
        <Route>
          <EmployeeShell>
            <ErrorBoundary initData={initData}>
              <AppModules stateCode={stateCode} userType="employee" modules={modules} appTenants={appTenants} />
            </ErrorBoundary>
          </EmployeeShell>
        </Route>
        <Route>
          <Redirect to={`${path}/user/language-selection`} />
        </Route>
      </Switch>
    </div>
  );
};

export default EmployeeApp;
