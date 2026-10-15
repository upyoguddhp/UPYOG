import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { SiteFooter, SiteHeader, UtilityBar } from "../Home/Landing/SiteChrome";
import { siteDefaults } from "../Home/Landing/config";
import { getHelpLinks, openLink } from "../../../components/ActionDock/helpLinks";
import { applyStoredAccessibility } from "../../../components/AccessibilityTools/settings";
import { buildFooterColumns, buildLegalLinks, buildSiteNav } from "./siteNav";
import { ROUTES } from "./config";

/**
 * Shared layout of every website page: utility bar, header with navigation,
 * page banner (breadcrumb + title), content, footer.
 * Pages render inside <SiteShell activeId="..." title="..." ...>.
 */
const SiteShell = ({ activeId, title, subtitle, icon, children }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { data: initData } = Digit.Hooks.useStore.getInitData();
  const { stateInfo, languages, uiHomePage, modules, tenants } = initData || {};
  const links = getHelpLinks({ uiHomePage, modules });
  const [language, setLanguage] = useState(Digit.StoreData.getCurrentLanguage());
  const user = Digit.UserService?.getUser();
  const isLoggedIn = !!user?.access_token;
  const tt = (k, d) => t(k, { defaultValue: d });

  useEffect(() => {
    applyStoredAccessibility();
    window.scrollTo({ top: 0 });
    if (title) document.title = `${title} | ${tt("LANDING_BRAND", "Citizen Seva")}`;
  }, [title]);

  const go = (url) => openLink(history, url);

  const changeLanguage = (value) => {
    Digit.LocalizationService.changeLanguage(value, stateInfo?.code || Digit.ULBService.getStateId());
    setLanguage(value);
  };

  const nav = buildSiteNav({ t, go, activeId, links, hasServices: true });

  return (
    <div className="CitizenLanding SitePage">
      <UtilityBar
        helpline={siteDefaults.helpline}
        hours={siteDefaults.helplineHours}
        languages={languages}
        selectedLanguage={language}
        onLanguage={changeLanguage}
        onSiteSearch={(q) => history.push(`${ROUTES.home}?q=${encodeURIComponent(q)}`)}
      />
      <SiteHeader
        stateInfo={stateInfo}
        nav={nav}
        isLoggedIn={isLoggedIn}
        userName={user?.info?.name}
        onLogin={() => history.push("/digit-ui/citizen/login")}
        onRegister={() => history.push("/digit-ui/citizen/register")}
        onLogout={async () => {
          await Digit.UserService.logout();
        }}
        onNavigate={(item) => item.onClick && item.onClick()}
        onSearch={() => document.querySelector(".LandingUtility__search button")?.click()}
      />

      <section className="SiteBanner">
        <div className="LandingWrap SiteBanner__inner">
          <nav className="SiteBanner__crumbs" aria-label={tt("SITE_BREADCRUMB", "Breadcrumb")}>
            <button type="button" onClick={() => go(ROUTES.home)}>{tt("SITE_NAV_HOME", "Home")}</button>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{title}</span>
          </nav>
          <div className="SiteBanner__title">
            {icon ? <span className="SiteBanner__icon" aria-hidden="true">{icon}</span> : null}
            <div>
              <h1>{title}</h1>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
          </div>
        </div>
      </section>

      <main id="landing-main" className="SitePage__main">
        <div className="LandingWrap">{children}</div>
      </main>

      <SiteFooter
        stateInfo={stateInfo}
        columns={buildFooterColumns({ t, go, servicesTop: [], links })}
        helpline={siteDefaults.helpline}
        legalLinks={buildLegalLinks({ t, go })}
      />
    </div>
  );
};

export default SiteShell;
