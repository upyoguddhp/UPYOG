import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import Icon from "../pages/citizen/Home/Landing/Icons";
import { siteDefaults } from "../pages/citizen/Home/Landing/config";
import { firstName, initials } from "../pages/citizen/Dashboard/helpers";
import ContextSwitcher from "./ContextSwitcher";
import ChangeLanguage from "./ChangeLanguage";
import AccessibilityTools from "./AccessibilityTools";
import LogoutDialog from "./Dialog/LogoutDialog";

const BASE = "/digit-ui/employee";

/**
 * Signed-in employee layout: the same top bar, side nav (desktop) and bottom tab bar (phones) as the citizen dashboard,
 * so both sides of Citizen Seva look alike. Modules render inside it.
 */
const EmployeeShell = ({ children }) => {
  const { t } = useTranslation();
  const tt = (k) => t(k);
  const history = useHistory();
  const { pathname, search } = useLocation();
  const info = (Digit.UserService.getUser() || {}).info || {};
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const menuRef = useRef(null);
  const go = (url) => url && history.push(url);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const inInbox = pathname.indexOf("/hpwork") >= 0;
  const inProfile = pathname.indexOf("/user/profile") >= 0;
  const nav = [
    { id: "inbox", icon: "list", label: tt("EMP_NAV_INBOX"), on: () => go(`${BASE}/hpwork/inbox`), active: inInbox },
    { id: "modules", icon: "building", label: tt("EMP_NAV_MODULES"), on: () => go(`${BASE}?home=1`), active: !inInbox && !inProfile && /home=1/.test(search) },
    { id: "me", icon: "user", label: tt("DASH_NAV_PROFILE"), on: () => go(`${BASE}/user/profile`), active: inProfile },
  ];

  return (
    <div className="Dash DashShell DashShell--employee">
      <header className="DashTop">
        <button type="button" className="DashTop__brand" onClick={() => go(`${BASE}/hpwork/inbox`)} aria-label={tt("EMP_GO_HOME")}>
          <img src="/digit-ui/images/brand/HPLogo.png" alt="" height="38" />
          <img src="/digit-ui/images/brand/CitizenSevaLogo.png" alt="Citizen Seva" height="30" />
        </button>
        <span className="DashShell__spacer" />
        <div className="DashTop__tools">
          <ContextSwitcher />
          <AccessibilityTools compact buttonClassName="TopBarA11yBtn" />
          <ChangeLanguage dropdown={true} />
        </div>
        <div className="DashTop__user" ref={menuRef}>
          <button type="button" className="DashTop__avatarBtn" onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu}>
            <span className="DashTop__avatar" aria-hidden="true">{initials(info.name)}</span>
            <span className="DashTop__name">{firstName(info.name) || tt("EMP_EMPLOYEE")}</span>
          </button>
          {menu && (
            <div className="DashTop__menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setMenu(false); go(`${BASE}/user/profile`); }}>{tt("DASH_NAV_PROFILE")}</button>
              <button type="button" role="menuitem" onClick={() => { setMenu(false); setConfirm(true); }}>{tt("LANDING_LOGOUT")}</button>
            </div>
          )}
        </div>
      </header>

      <aside className="DashSide" aria-label={tt("EMP_NAV_LABEL")}>
        <nav>
          {nav.map((n) => (
            <button key={n.id} type="button" className={`DashSide__link${n.active ? " is-active" : ""}`} onClick={n.on} aria-current={n.active ? "page" : undefined}>
              <Icon name={n.icon} size={20} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="DashSide__help">
          <strong>{tt("DASH_NEED_HELP")}</strong>
          <p>{tt("DASH_HELPLINE")} {siteDefaults.helpline}</p>
          <small>{siteDefaults.helplineHours}</small>
        </div>
      </aside>

      <main id="dash-main" className="DashMain DashMain--fluid" tabIndex={-1}>
        {children}
      </main>

      <nav className="DashTabbar" aria-label={tt("EMP_NAV_LABEL")}>
        {nav.map((n) => (
          <button key={n.id} type="button" className={n.active ? "is-active" : ""} onClick={n.on}>
            <Icon name={n.icon} size={22} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      {confirm && <LogoutDialog onSelect={() => { Digit.UserService.logout(); setConfirm(false); }} onCancel={() => setConfirm(false)} onDismiss={() => setConfirm(false)} />}
    </div>
  );
};

export default EmployeeShell;
