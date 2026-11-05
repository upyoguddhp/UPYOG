import { BackButton, WhatsappIcon, Card, CitizenHomeCard, CitizenInfoLabel, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useRouteMatch, useHistory, Link } from "react-router-dom";
import ErrorBoundary from "../../components/ErrorBoundaries";
import { AppHome, processLinkData } from "../../components/Home";
import TopBarSideBar from "../../components/TopBarSideBar";
import StaticCitizenSideBar from "../../components/TopBarSideBar/SideBar/StaticCitizenSideBar";
import CitizenHome from "./Home";
import LanguageSelection from "./Home/LanguageSelection";
import LocationSelection from "./Home/LocationSelection";
import Login from "./Login";
import UserProfile from "./Home/UserProfile";
import ErrorComponent from "../../components/ErrorComponent";
import FAQsSection from "./FAQs/FAQs";
import HowItWorks from "./HowItWorks/howItWorks";
import StaticDynamicCard from "./StaticDynamicComponent/StaticDynamicCard";
import AcknowledgementCF from "../../components/AcknowledgementCF";
import CitizenFeedback from "../../components/CitizenFeedback";
import Search from "./SearchApp";
import QRCode from "./QRCode";
import ChallanQRCode from "./ChallanQRCode";
import ActionDock from "../../components/ActionDock";
import { getWebsitePage } from "./Website";
import CitizenShell from "./Dashboard/CitizenShell";
import AllServices from "./Dashboard/AllServices";
import { applyStoredAccessibility } from "../../components/AccessibilityTools/settings";
const sidebarHiddenFor = [
  "/digit-ui/citizen/accessibility-statement",
  "digit-ui/citizen/register/name",
  "/digit-ui/citizen/select-language",
  "/digit-ui/citizen/select-location",
  "/digit-ui/citizen/login",
  "/digit-ui/citizen/register/otp",
];

// modules rendered inside the dashboard chrome (see Dashboard/CitizenShell)
const SHELL_MODULES = ["PROPERTY", "NewTL", "PTR", "BOOKING", "FEEDBACK", "OTS", "REQSVC", "HPNOC", "HPPAY", "GB", "GRIEVANCE", "MCollect"];

const getTenants = (codes, tenants) => {
  return tenants.filter((tenant) => codes.map((item) => item.code).includes(tenant.code));
};

const Home = ({
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
  const { isLoading: islinkDataLoading, data: linkData, isFetched: isLinkDataFetched } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "ACCESSCONTROL-ACTIONS-TEST",
    [
      {
        name: "actions-test",
        filter: "[?(@.url == 'digit-ui-card')]",
      },
    ],
    {
      select: (data) => {
        const formattedData = data?.["ACCESSCONTROL-ACTIONS-TEST"]?.["actions-test"]
          ?.filter((el) => el.enabled === true)
          .reduce((a, b) => {
            a[b.parentModule] = a[b.parentModule]?.length > 0 ? [b, ...a[b.parentModule]] : [b];
            return a;
          }, {});
        return formattedData;
      },
    }
  );
  const isMobile = window.Digit.Utils.browser.isMobile();
  const classname = Digit.Hooks.fsm.useRouteSubscription(pathname);
  React.useEffect(() => {
    applyStoredAccessibility(); // saved accessibility preferences apply on every citizen page
  }, []);
  const { t } = useTranslation();
  const { path } = useRouteMatch();
  sourceUrl = "https://s3.ap-south-1.amazonaws.com/egov-qa-assets";
  const pdfUrl = "https://pg-egov-assets.s3.ap-south-1.amazonaws.com/Upyog+Code+and+Copyright+License_v1.pdf"
  const history = useHistory();
  const handleClickOnWhatsApp = (obj) => {
    window.open(obj);
  };

  const hideSidebar = sidebarHiddenFor.some((e) => window.location.href.includes(e));
  const appRoutes = modules.map(({ code, tenants }, index) => {
    const Module = Digit.ComponentRegistryService.getComponent(`${code}Module`);
    return Module ? (
      <Route key={index} path={`${path}/${code.toLowerCase()}`}>
        <Module stateCode={stateCode} moduleCode={code} userType="citizen" tenants={getTenants(tenants, appTenants)} />
      </Route>
    ) : null;
  });

  const ModuleLevelLinkHomePages = modules.map(({ code, bannerImage }, index) => {
    let Links = Digit.ComponentRegistryService.getComponent(`${code}Links`) || (() => <React.Fragment />);
    let mdmsDataObj = isLinkDataFetched ? processLinkData(linkData, code, t) : undefined;

    //if (mdmsDataObj?.header === "ACTION_TEST_WS") {
      mdmsDataObj?.links && mdmsDataObj?.links.sort((a, b) => {
        return a.orderNumber - b.orderNumber;
      });
    // }
    return (
      <React.Fragment>
        <Route key={index} path={`${path}/${code.toLowerCase()}-home`}>
          <div className="moduleLinkHomePage">
            <img src={ "https://nugp-assets.s3.ap-south-1.amazonaws.com/nugp+asset/Banner+UPYOG+%281920x500%29B+%282%29.jpg"||bannerImage || stateInfo?.bannerUrl} alt="noimagefound" />
            <BackButton className="moduleLinkHomePageBackButton" />
           {isMobile? <h4 style={{top: "calc(16vw + 40px)",left:"1.5rem",position:"absolute",color:"white"}}>{t("MODULE_" + code.toUpperCase(), { defaultValue: code })}</h4>:<h1>{t("MODULE_" + code.toUpperCase(), { defaultValue: code })}</h1>}
            <div className="moduleLinkHomePageModuleLinks">
              {mdmsDataObj && (
                <CitizenHomeCard
                  header={t(mdmsDataObj?.header, { defaultValue: code })}
                  links={mdmsDataObj?.links}
                  Icon={() => <span />}
                  Info={
                    code === "OBPS"
                      ? () => (
                          <CitizenInfoLabel
                            style={{ margin: "0px", padding: "10px" }}
                            info={t("CS_FILE_APPLICATION_INFO_LABEL")}
                            text={t(`BPA_CITIZEN_HOME_STAKEHOLDER_INCLUDES_INFO_LABEL`)}
                          />
                        )
                      : null
                  }
                  isInfo={code === "OBPS" ? true : false}
                />
              )}
              {/* <Links key={index} matchPath={`/digit-ui/citizen/${code.toLowerCase()}`} userType={"citizen"} /> */}
            </div>
            <StaticDynamicCard moduleCode={code?.toUpperCase()}/>
          </div>
        </Route>
        <Route key={"faq" + index} path={`${path}/${code.toLowerCase()}-faq`}>
          <FAQsSection module={code?.toUpperCase()} />
        </Route>
        <Route key={"hiw" + index} path={`${path}/${code.toLowerCase()}-how-it-works`}>
          <HowItWorks module={code?.toUpperCase()} />
        </Route>
      </React.Fragment>
    );
  });

  // Landing + website pages: standalone pages with their own header and footer
  const isLanding = pathname?.replace(/\/+$/, "") === "/digit-ui/citizen";
  const WebsitePage = getWebsitePage(pathname);
  if (isLanding || WebsitePage) {
    return (
      <div className={`${classname || ""} CitizenLandingShell`}>
        {isLanding ? <CitizenHome /> : <WebsitePage />}
        <ActionDock />
      </div>
    );
  }

  // "All services" uses the dashboard chrome too
  if (new RegExp(`^${path}/all-services/?$`).test(pathname || "")) {
    return (
      <div className={`${classname || ""} CitizenLandingShell`}>
        <CitizenShell active="svc">
          <AllServices linkData={linkData} isLoading={islinkDataLoading} />
        </CitizenShell>
        <ActionDock />
      </div>
    );
  }

  // the stock PGR screens are replaced by the Grievance module
  if (new RegExp(`^${path}/pgr(/|$)`).test(pathname || "")) {
    return <Redirect to={/create-complaint/.test(pathname) ? `${path}/grievance/new/grievance` : `${path}/grievance/my-grievances`} />;
  }

  // Service modules that use the dashboard chrome (side nav + tab bar) instead of the legacy top bar
  const shellModule = (modules || []).find((m) => SHELL_MODULES.includes(m.code) && new RegExp(`^${path}/${m.code.toLowerCase()}(/|$)`).test(pathname || ""));
  const ShellModuleApp = shellModule && Digit.ComponentRegistryService.getComponent(`${shellModule.code}Module`);
  if (ShellModuleApp) {
    return (
      <div className={`${classname || ""} CitizenLandingShell`}>
        <CitizenShell active="apps">
          <Route path={`${path}/${shellModule.code.toLowerCase()}`}>
            <ShellModuleApp stateCode={stateCode} moduleCode={shellModule.code} userType="citizen" tenants={getTenants(shellModule.tenants, appTenants)} />
          </Route>
        </CitizenShell>
        <ActionDock />
      </div>
    );
  }

  return (
    <div className={classname}>
      <TopBarSideBar
        t={t}
        stateInfo={stateInfo}
        userDetails={userDetails}
        CITIZEN={CITIZEN}
        cityDetails={cityDetails}
        mobileView={mobileView}
        handleUserDropdownSelection={handleUserDropdownSelection}
        logoUrl={logoUrl}
        showSidebar={true}
        linkData={linkData}
        islinkDataLoading={islinkDataLoading}
      />

      <div className={`main center-container citizen-home-container mb-25`}>
        {hideSidebar ? null : (
          <div className="SideBarStatic">
            <StaticCitizenSideBar linkData={linkData} islinkDataLoading={islinkDataLoading} />
          </div>
        )}

        <Switch>
          <Route exact path={path}>
            <CitizenHome />
          </Route>

          <PrivateRoute path={`${path}/feedback`} component={CitizenFeedback}></PrivateRoute>
          <PrivateRoute path={`${path}/feedback-acknowledgement`} component={AcknowledgementCF}></PrivateRoute>

          <Route exact path={`${path}/select-language`}>
            <LanguageSelection />
          </Route>

          <Route exact path={`${path}/select-location`}>
            <LocationSelection />
          </Route>
          <Route path={`${path}/error`}>
            <ErrorComponent
              initData={initData}
              goToHome={() => {
                history.push("/digit-ui/citizen");
              }}
            />
          </Route>
          <Route path={`${path}/all-services`}>
            <AppHome
              userType="citizen"
              modules={modules}
              getCitizenMenu={linkData}
              fetchedCitizen={isLinkDataFetched}
              isLoading={islinkDataLoading}
            />
          </Route>

          <Route path={`${path}/login`}>
            <Login stateCode={stateCode} />
          </Route>

          <Route path={`${path}/register`}>
            <Login stateCode={stateCode} isUserRegistered={false} />
          </Route>

          <PrivateRoute path={`${path}/user/profile`}>
            <UserProfile stateCode={stateCode} userType={"citizen"} cityDetails={cityDetails} />
          </PrivateRoute>

          <Route path={`${path}/Audit`}>
            <Search/>
          </Route>
          <Route path={`${path}/payment/verification`}>
         <QRCode></QRCode>
          </Route>
          <Route path={`${path}/challan/details`}>
         <ChallanQRCode></ChallanQRCode>
          </Route>
          <ErrorBoundary initData={initData}>
            {appRoutes}
            {ModuleLevelLinkHomePages}
          </ErrorBoundary>
        </Switch>
      </div>

      <ActionDock />

      <div style={{ width: '100%', position: 'fixed', bottom: 0,backgroundColor:"white",textAlign:"center" }}>
        <div style={{ display: 'flex', justifyContent: 'center', color:"black" }}>
          {/* <span style={{ cursor: "pointer", fontSize: window.Digit.Utils.browser.isMobile()?"12px":"14px", fontWeight: "400"}} onClick={() => { window.open('https://www.digit.org/', '_blank').focus();}} >Powered by DIGIT</span>
          <span style={{ margin: "0 10px" ,fontSize: window.Digit.Utils.browser.isMobile()?"12px":"14px"}}>|</span> */}
          
        </div>
        <div className="upyog-copyright-footer-web">
          <span className="" style={{ cursor: "pointer", fontSize:  window.Digit.Utils.browser.isMobile()?"12px":"14px", fontWeight: "400"}} onClick={() => { window.open('https://niua.in/', '_blank').focus();}} >Copyright © 2022 National Institute of Urban Affairs</span>
          </div>
      </div>
    </div>
  );
};

export default Home;
