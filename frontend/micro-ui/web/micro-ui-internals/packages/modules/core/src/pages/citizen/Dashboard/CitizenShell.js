import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import Icon from "../Home/Landing/Icons";
import { siteDefaults } from "../Home/Landing/config";
import SevaLoader from "../../../components/SevaLoader";
import { DASH_BASE, DASH_URL, firstName, initials } from "./helpers";

/**
 * Signed-in citizen layout (top bar + side nav on desktop / bottom tab bar on phones), the same
 * chrome as the dashboard. Service modules (e.g. Property Tax) render inside it so every
 * application screen looks like part of the dashboard. `active` picks the highlighted nav item.
 */
const CitizenShell = ({ active = "apps", children }) => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const history = useHistory();
  const user = Digit.UserService?.getUser();
  const info = user?.info || {};
  const signedIn = !!user?.access_token;
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const go = (url) => url && history.push(url);

  useEffect(() => {
    if (!signedIn) history.replace({ pathname: `${DASH_BASE}/login`, search: `?from=${encodeURIComponent(window.location.pathname)}` });
  }, [signedIn, history]);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const logout = async () => {
    try {
      await Digit.UserService.logout();
    } catch (e) {
      /* session is cleared by the service either way */
    }
  };

  if (!signedIn) return <SevaLoader fullScreen message={tt("DASH_REDIRECT_LOGIN", "Taking you to sign in...")} />;

  const nav = [
    { id: "home", icon: "home", label: tt("DASH_NAV_DASHBOARD", "Dashboard"), on: () => go(DASH_URL) },
    { id: "apps", icon: "list", label: tt("DASH_NAV_APPLICATIONS", "My applications"), on: () => go(`${DASH_URL}#dash-apps`) },
    { id: "dues", icon: "pay", label: tt("DASH_NAV_DUES", "Dues & payments"), on: () => go(`${DASH_URL}#dash-dues`) },
    { id: "grv", icon: "megaphone", label: tt("DASH_NAV_GRIEVANCES", "Grievances"), on: () => go(`${DASH_BASE}/grievance/my-grievances`) },
    { id: "svc", icon: "building", label: tt("DASH_NAV_SERVICES", "All services"), on: () => go(`${DASH_BASE}/all-services`) },
    { id: "me", icon: "user", label: tt("DASH_NAV_PROFILE", "Profile"), on: () => go(`${DASH_BASE}/user/profile`) },
  ];

  return (
    <div className="Dash DashShell">
      <a className="LandingSkip" href="#dash-main">{tt("LANDING_SKIP", "Skip to main content")}</a>

      <header className="DashTop">
        <button type="button" className="DashTop__brand" onClick={() => go(DASH_BASE)} aria-label={tt("DASH_GO_HOME", "Go to Citizen Seva home")}>
          <img src="/digit-ui/images/brand/HPLogo.png" alt="" height="38" />
          <img src="/digit-ui/images/brand/CitizenSevaLogo.png" alt="Citizen Seva" height="30" />
        </button>
        <span className="DashShell__spacer" />
        <div className="DashTop__user" ref={menuRef}>
          <button type="button" className="DashTop__avatarBtn" onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu}>
            <span className="DashTop__avatar" aria-hidden="true">{initials(info.name)}</span>
            <span className="DashTop__name">{firstName(info.name) || tt("DASH_CITIZEN", "Citizen")}</span>
          </button>
          {menu && (
            <div className="DashTop__menu" role="menu">
              <button type="button" role="menuitem" onClick={() => go(`${DASH_BASE}/user/profile`)}>{tt("DASH_NAV_PROFILE", "Profile")}</button>
              <button type="button" role="menuitem" onClick={() => go(DASH_BASE)}>{tt("DASH_PORTAL_HOME", "Portal home")}</button>
              <button type="button" role="menuitem" onClick={logout}>{tt("LANDING_LOGOUT", "Logout")}</button>
            </div>
          )}
        </div>
      </header>

      <aside className="DashSide" aria-label={tt("DASH_NAV_LABEL", "Dashboard menu")}>
        <nav>
          {nav.map((n) => (
            <button key={n.id} type="button" className={`DashSide__link${n.id === active ? " is-active" : ""}`} onClick={n.on} aria-current={n.id === active ? "page" : undefined}>
              <Icon name={n.icon} size={20} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="DashSide__help">
          <strong>{tt("DASH_NEED_HELP", "Need help?")}</strong>
          <p>{tt("DASH_HELPLINE", "Call")} {siteDefaults.helpline}</p>
          <small>{siteDefaults.helplineHours}</small>
        </div>
      </aside>

      <main id="dash-main" className="DashMain DashMain--fluid" tabIndex={-1}>
        {children}
      </main>

      <nav className="DashTabbar" aria-label={tt("DASH_NAV_LABEL", "Dashboard menu")}>
        {[nav[0], nav[1], nav[2], nav[4], nav[5]].map((n) => (
          <button key={n.id} type="button" className={n.id === active ? "is-active" : ""} onClick={n.on}>
            <Icon name={n.icon} size={22} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default CitizenShell;
