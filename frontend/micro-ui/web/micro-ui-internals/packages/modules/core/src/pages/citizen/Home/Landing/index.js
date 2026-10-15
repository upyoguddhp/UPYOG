import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import HeroSearch from "./HeroSearch";
import TrackApplication from "./TrackApplication";
import ServicesExplorer from "./ServicesExplorer";
import HowItWorks from "./HowItWorks";
import HelpCenter from "./HelpCenter";
import HeroVideo from "./HeroVideo";
import Welcome from "./Welcome";
import { UtilityBar, SiteHeader, SiteFooter, StatsBand, NewsUpdates } from "./SiteChrome";
import { getHelpLinks, openLink } from "../../../../components/ActionDock/helpLinks";
import { ALL_SERVICES_URL, LOGIN_URL, popularSearches, siteDefaults } from "./config";
import { buildFooterColumns, buildLegalLinks, buildSiteNav } from "../../Website/siteNav";

/** Module codes that can actually be opened for this tenant. */
const enabledModuleCodes = (modules = []) =>
  modules
    .map((m) => m?.code)
    .filter((c) => c && (Digit.ComponentRegistryService.getComponent(`${c}Module`) || Digit.ComponentRegistryService.getComponent(`${c}Links`)));

/** Turns an MDMS uiHomePage card into explorer items, dropping links to modules that are not enabled. */
const toItems = (card, t, codes) => {
  const lower = codes.map((c) => c.toLowerCase());
  return (card?.props || [])
    .filter((p) => p?.enabled !== false && p?.navigationUrl)
    .filter((p) => {
      // A link into a module is shown only when that module is enabled for the tenant.
      // /citizen/<code>-home and /citizen/<code>/... are both treated as module routes
      // when <code> resolves to a registered module; other routes are always kept.
      const m = /\/citizen\/([a-z0-9]+)(?:-home)?(?:\/|$)/i.exec(p.navigationUrl);
      if (!m) return true;
      const seg = m[1];
      const cap = seg.charAt(0).toUpperCase() + seg.slice(1);
      const registered = [seg, seg.toUpperCase(), cap].some(
        (n) => Digit.ComponentRegistryService.getComponent(`${n}Module`) || Digit.ComponentRegistryService.getComponent(`${n}Links`)
      );
      return !registered || lower.includes(seg.toLowerCase());
    })
    .map((p) => ({ code: p.code, label: t(p.label, { defaultValue: p.name }), url: p.navigationUrl }));
};

/**
 * Citizen landing page (route: /digit-ui/citizen).
 * Content is driven by MDMS `common-masters.uiHomePage`; all URLs come from MDMS
 * so each ULB can reconfigure the page without a code change.
 *
 * Optional MDMS keys used for the help section:
 *   uiHomePage.whatsAppBannerDesktop.navigationUrl  -> chat assistant
 *   uiHomePage.supportTicket.navigationUrl          -> support ticket
 */
const LandingPage = ({ uiHomePage, modules, stateInfo, languages, tenants, whatsNew }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get("q") || "");
  const [activeGroup, setActiveGroup] = useState(null);
  const [language, setLanguage] = useState(Digit.StoreData.getCurrentLanguage());
  const [city, setCity] = useState(Digit.ULBService.getCitizenCurrentTenant(true) || "");

  // same query/key as pages/citizen/index.js -> served from cache, no extra request
  const { data: linkData } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "ACCESSCONTROL-ACTIONS-TEST",
    [{ name: "actions-test", filter: "[?(@.url == 'digit-ui-card')]" }],
    {
      select: (data) =>
        data?.["ACCESSCONTROL-ACTIONS-TEST"]?.["actions-test"]
          ?.filter((el) => el.enabled === true)
          .reduce((a, b) => {
            a[b.parentModule] = a[b.parentModule]?.length > 0 ? [b, ...a[b.parentModule]] : [b];
            return a;
          }, {}),
    }
  );

  // modules that are enabled, registered and actually have service links
  const codes = useMemo(() => enabledModuleCodes(modules).filter((c) => linkData?.[c]?.length > 0), [modules, linkData]);

  const groups = useMemo(() => {
    const out = [];
    const used = new Set();
    const citizen = toItems(uiHomePage?.citizenServicesCard, t, codes);
    const info = toItems(uiHomePage?.informationAndUpdatesCard, t, codes);
    citizen.concat(info).forEach((i) => used.add((i.url || "").toLowerCase()));

    // services of every module enabled for this tenant (what "All services" would list)
    const moduleItems = codes
      .map((c) => ({
        code: `MODULE_${c}`,
        label: t(Digit.Utils.locale.getTransformedLocale(`ACTION_TEST_${c}`), { defaultValue: c }),
        url: `/digit-ui/citizen/${c.toLowerCase()}-home`,
      }))
      .filter((i) => !used.has(i.url.toLowerCase()));

    if (citizen.length)
      out.push({ id: "citizen", label: t(uiHomePage?.citizenServicesCard?.headerLabel, { defaultValue: "Citizen services" }), items: citizen });
    if (moduleItems.length)
      out.push({ id: "modules", label: t("LANDING_ALL_MODULES", { defaultValue: "More services" }), items: moduleItems });
    if (info.length)
      out.push({ id: "info", label: t(uiHomePage?.informationAndUpdatesCard?.headerLabel, { defaultValue: "Information & updates" }), items: info });
    return out;
  }, [uiHomePage, codes, t]);

  const user = Digit.UserService?.getUser();
  const isLoggedIn = !!user?.access_token;

  const links = getHelpLinks({ uiHomePage, modules });
  const go = (url) => openLink(history, url);
  const openGrievance = links.grievance ? () => go(links.grievance) : null;
  const openTicket = links.ticket ? () => go(links.ticket) : null;
  const openChat = links.chat ? () => go(links.chat) : null;

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToServices = () => scrollTo("landing-services");

  const findService = (q) => groups.flatMap((g) => g.items).find((it) => it.label.toLowerCase().includes(q));

  const onSearchSubmit = () => {
    const q = query.trim().toLowerCase();
    const hit = q && findService(q);
    if (hit) return go(hit.url);
    scrollToServices();
  };

  // match whole route segments (/citizen/<code> or /citizen/<code>-home) so "pt" does not match "ptr"
  const findPopular = (p) => {
    const re = new RegExp(`/citizen/${p.match}(-home)?(/|$)`, "i");
    return groups.flatMap((g) => g.items).find((it) => re.test(it.url || ""));
  };
  // only offer shortcuts that resolve to a real, enabled service
  const popular = popularSearches.filter((p) => !!findPopular(p));
  const onPopular = (p) => {
    const hit = findPopular(p);
    if (hit) go(hit.url);
  };

  // Application tracking currently needs a signed-in citizen: route accordingly.
  const onTrack = () => history.push(isLoggedIn ? ALL_SERVICES_URL : LOGIN_URL);

  const changeLanguage = (value) => {
    Digit.LocalizationService.changeLanguage(value, stateInfo?.code || Digit.ULBService.getStateId());
    setLanguage(value);
  };
  const changeCity = (code) => {
    const t0 = tenants.find((x) => x.code === code);
    Digit.SessionStorage.set("CITIZEN.COMMON.HOME.CITY", t0 || null);
    setCity(code);
  };
  const logout = async () => {
    await Digit.UserService.logout();
  };

  // primary navigation and footer are shared with every website page (Website/siteNav.js)
  const hasServices = groups.length > 0;
  const siteGo = (url) => go(url);
  const nav = buildSiteNav({
    t,
    go: siteGo,
    activeId: "home",
    scrollServices: scrollToServices,
    links: links,
    hasServices,
  });

  const tt = (key, text) => t(key, { defaultValue: text });
  const topServices = groups.flatMap((g) => g.items).slice(0, 4);
  const footerColumns = buildFooterColumns({ t, go: siteGo, servicesTop: topServices, links });

  // arriving from another page: ?q= filters the services, #landing-services scrolls to them
  useEffect(() => {
    if (location.hash === "#landing-services" || new URLSearchParams(location.search).get("q")) {
      const id = setTimeout(scrollToServices, 400);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [location.hash, location.search]);

  return (
    <div className="CitizenLanding">
      <UtilityBar
        helpline={siteDefaults.helpline}
        hours={siteDefaults.helplineHours}
        languages={languages}
        selectedLanguage={language}
        onLanguage={changeLanguage}
        onSiteSearch={(q) => {
          setQuery(q);
          scrollToServices();
        }}
      />
      <SiteHeader
        stateInfo={stateInfo}
        nav={nav}
        isLoggedIn={isLoggedIn}
        userName={user?.info?.name}
        onLogin={() => history.push(LOGIN_URL)}
        onRegister={() => history.push("/digit-ui/citizen/register")}
        onLogout={logout}
        onNavigate={(item) => item.onClick && item.onClick()}
        onSearch={() => document.querySelector(".LandingSearch input")?.focus()}
      />

      <main id="landing-main">
        <section className="LandingHeroBand">
          <HeroVideo />
          <div className="LandingWrap LandingHeroBand__grid">
            <HeroSearch
              query={query}
              onQueryChange={setQuery}
              onSubmit={onSearchSubmit}
              onPopular={onPopular}
              popular={popular}
              onGrievance={openGrievance}
              onTicket={openTicket}
              onChat={openChat}
              grievanceEnabled={!!openGrievance}
              ticketEnabled={!!openTicket}
              chatEnabled={!!openChat}
              tenants={tenants}
              selectedCity={city}
              onCityChange={changeCity}
              ulbCount={tenants?.length}
            />
            <TrackApplication onTrack={onTrack} />
          </div>
        </section>

        <Welcome
          onOrgChart={() => siteGo("/digit-ui/citizen/organization-chart")}
          onServices={() => document.getElementById("landing-services")?.scrollIntoView({ behavior: "smooth" })}
        />

        {groups.length > 0 && (
          <div className="LandingBand LandingBand--sky">
          <div className="LandingWrap">
            <ServicesExplorer
              groups={groups}
              query={query}
              onQueryChange={setQuery}
              activeGroup={activeGroup || "__all"}
              onGroupChange={setActiveGroup}
              onOpen={(it) => go(it.url)}
            />
          </div>
          </div>
        )}

        <StatsBand stats={uiHomePage?.statistics} />

        <div className="LandingBand LandingBand--how">
          <div className="LandingWrap">
            <HowItWorks />
          </div>
        </div>

        <div className="LandingHelpBand">
          <div className="LandingWrap">
            <HelpCenter actions={{ grievance: openGrievance, ticket: openTicket, chat: openChat }} />
          </div>
        </div>

        <div className="LandingBand LandingBand--mint">
        <div className="LandingWrap">
          <NewsUpdates items={uiHomePage?.newsAndNotifications} onOpen={go}>
            {whatsNew}
          </NewsUpdates>
        </div>
        </div>
      </main>

      <SiteFooter
        stateInfo={stateInfo}
        columns={footerColumns}
        helpline={siteDefaults.helpline}
        legalLinks={buildLegalLinks({ t, go: siteGo })}
      />
    </div>
  );
};

export default LandingPage;
