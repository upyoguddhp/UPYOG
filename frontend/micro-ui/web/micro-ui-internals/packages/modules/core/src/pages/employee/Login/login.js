import { Loader } from "@upyog/digit-ui-react-components";
import PropTypes from "prop-types";
import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import SevaLoader from "../../../components/SevaLoader";
import AuthAlert from "../../../components/AuthAlert";
import { siteDefaults } from "../../citizen/Home/Landing/config";
import { FooterScene } from "../../citizen/Home/Landing/SiteChrome";

/* set employee details to enable backward compatiable */
const setEmployeeDetail = (userObject, token) => {
  let locale = JSON.parse(sessionStorage.getItem("Digit.locale"))?.value || "en_IN";
  localStorage.setItem("Employee.tenant-id", userObject?.tenantId);
  localStorage.setItem("tenant-id", userObject?.tenantId);
  localStorage.setItem("citizen.userRequestObject", JSON.stringify(userObject));
  localStorage.setItem("locale", locale);
  localStorage.setItem("Employee.locale", locale);
  localStorage.setItem("token", token);
  localStorage.setItem("Employee.token", token);
  localStorage.setItem("user-info", JSON.stringify(userObject));
  localStorage.setItem("Employee.user-info", JSON.stringify(userObject));
};

const DEFAULT_OFFICIAL_SSO_URL = "https://himparivar.hp.gov.in/sso-admin/GovLogin?service_id=22&app_unique=ED003";

/** Turns an API failure into something the official can act on. */
const loginErrorFor = (err, tt) => {
  const status = err?.response?.status;
  const apiMsg = err?.response?.data?.error_description || err?.response?.data?.Errors?.[0]?.message || "";
  const lower = apiMsg.toLowerCase();
  if (!err?.response && (!navigator.onLine || /network|failed to fetch/i.test(err?.message || ""))) {
    return { title: tt("AUTH_ERR_NETWORK_T"), message: tt("AUTH_ERR_NETWORK") };
  }
  if (lower.includes("locked") || lower.includes("lock")) {
    return { title: tt("AUTH_ERR_LOCKED_T"), message: tt("AUTH_ERR_LOCKED") };
  }
  if (status >= 500) {
    return { title: tt("AUTH_ERR_SERVER_T"), message: tt("AUTH_ERR_SERVER") };
  }
  if (status === 400 || status === 401 || lower.includes("unauthorized login")) {
    return {
      title: tt("AUTH_ERR_BAD_CREDS_T"),
      message: tt("AUTH_ERR_BAD_CREDS"),
    };
  }
  return { title: tt("AUTH_ERR_GENERIC_T"), message: apiMsg || tt("AUTH_ERR_GENERIC") };
};

const tenantsOf = (info) => [...new Set((info?.roles || []).map((r) => r.tenantId).filter(Boolean))];
const rolesIn = (info, tenantId) => {
  const seen = new Set();
  return (info?.roles || []).filter((r) => r.tenantId === tenantId && !seen.has(r.code) && seen.add(r.code));
};

const Login = ({ config: propsConfig, t, isDisabled }) => {
  const tt = (k) => t(k);
  const { data: cities, isLoading } = Digit.Hooks.useTenants();
  const { data: storeData, isLoading: isStoreLoading } = Digit.Hooks.useStore.getInitData();
  const { stateInfo } = storeData || {};
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("password"); // password | sso
  const [form, setForm] = useState({ username: "", password: "" });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  // set after a successful password check when the user is mapped to more than one tenant / role
  const [pending, setPending] = useState(null);
  const [pick, setPick] = useState({ tenant: "", role: "" });
  const errRef = useRef(null);

  const history = useHistory();
  const ssoUrl = window?.globalConfigs?.getConfig("OFFICIAL_SSO_URL") || DEFAULT_OFFICIAL_SSO_URL;

  useEffect(() => {
    if (!user) {
      return;
    }
    Digit.SessionStorage.set("citizen.userRequestObject", user);
    const filteredRoles = user?.info?.roles?.filter((role) => role.tenantId === Digit.SessionStorage.get("Employee.tenantId"));
    if (user?.info?.roles?.length > 0) user.info.roles = filteredRoles;
    Digit.UserService.setUser(user);
    setEmployeeDetail(user?.info, user?.access_token);
    let redirectPath = "/digit-ui/employee";

    /* logic to redirect back to same screen where we left off  */
    if (window?.location?.href?.includes("from=")) {
      redirectPath = decodeURIComponent(window?.location?.href?.split("from=")?.[1]) || "/digit-ui/employee";
    }

    /*  RAIN-6489 Logic to navigate to National DSS home incase user has only one role [NATADMIN]*/
    if (user?.info?.roles && user?.info?.roles?.length > 0 && user?.info?.roles?.every((e) => e.code === "NATADMIN")) {
      redirectPath = "/digit-ui/employee/dss/landing/NURT_DASHBOARD";
    }
    if (user?.info?.roles && user?.info?.roles?.length > 0 && user?.info?.roles?.every((e) => e.code === "STADMIN")) {
      redirectPath = "/digit-ui/employee/dss/landing/home";
    }

    history.replace(redirectPath);
  }, [user]);

  const fieldError = (name) => {
    if (!touched[name] && !touched.__submit) return "";
    if (name === "username" && !form.username.trim()) return tt("AUTH_ERR_USER_REQ");
    if (name === "password" && !form.password) return tt("AUTH_ERR_PASS_REQ");
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, password: true, __submit: true });
    if (!form.username.trim() || !form.password) {
      setError(null);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { UserRequest: info, ...tokens } = await Digit.UserService.employeeLogin({
        username: form.username.trim(),
        password: form.password,
      });
      const tenants = tenantsOf(info);
      if (tenants.length > 1 || (tenants.length === 1 && rolesIn(info, tenants[0]).length > 1)) {
        // more than one choice: let the official pick the tenant and role to work in
        const firstTenant = tenants.length === 1 ? tenants[0] : "";
        setPick({ tenant: firstTenant, role: "" });
        setPending({ info, tokens });
        setBusy(false);
        return;
      }
      finishLogin(info, tokens, tenants[0] || info?.tenantId, null);
    } catch (err) {
      setError(loginErrorFor(err, tt));
      setBusy(false);
      setTimeout(() => errRef.current && errRef.current.scrollIntoView({ block: "nearest" }), 50);
    }
  };

  const finishLogin = (info, tokens, tenantId, roleCode) => {
    let roles = (info?.roles || []).filter((r) => !tenantId || r.tenantId === tenantId);
    if (roleCode) roles = roles.filter((r) => r.code === roleCode);
    Digit.SessionStorage.set("Employee.tenantId", tenantId);
    // every role/city the official holds, kept so the working city and role can be switched later without signing in again
    Digit.SessionStorage.set("Employee.allRoles", info?.roles || []);
    Digit.SessionStorage.set("Employee.activeRole", roleCode || "");
    setUser({ info: { ...info, tenantId: tenantId || info?.tenantId, roles }, ...tokens });
  };

  const onConfirmPick = (e) => {
    e.preventDefault();
    setTouched((prev) => ({ ...prev, __pick: true }));
    const roleOptions = rolesIn(pending.info, pick.tenant);
    if (!pick.tenant || (roleOptions.length > 1 && !pick.role)) return;
    finishLogin(pending.info, pending.tokens, pick.tenant, roleOptions.length > 1 ? pick.role : roleOptions[0]?.code);
  };

  const onCancelPick = () => {
    setPending(null);
    setPick({ tenant: "", role: "" });
    setTouched({});
    setForm({ ...form, password: "" });
  };

  const tenantLabel = (code) => {
    const c = (cities || []).find((x) => x.code === code);
    return (c && (t(c.i18nKey) || c.name)) || code;
  };

  const onForgotPassword = () => {
    sessionStorage.getItem("User") && sessionStorage.removeItem("User");
    history.push("/digit-ui/employee/user/forgot-password");
  };

  if (isLoading || isStoreLoading) return <Loader />;

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });
  const blur = (name) => () => setTouched({ ...touched, [name]: true });

  return (
    <div className="AuthPage AuthPage--employee">
      {busy && <SevaLoader fullScreen message={tt("AUTH_SIGNING_IN_WAIT")} />}
      <div className="AuthScene" aria-hidden="true"><FooterScene /></div>
      <div className="AuthSplit">
      <aside className="AuthSplit__brand">
        <img src="/digit-ui/images/brand/CitizenSevaEmblem.png" alt="" width="120" height="120" />
        <h2>{tt("AUTH_BRAND_TITLE")}</h2>
        <p className="AuthSplit__org">{tt("AUTH_BRAND_ORG")}</p>
        <ul className="AuthSplit__points">
          <li>{tt("AUTH_POINT_1")}</li>
          <li>{tt("AUTH_POINT_2")}</li>
          <li>{tt("AUTH_POINT_3")}</li>
        </ul>
        <p className="AuthSplit__help">
          {tt("AUTH_NEED_HELP")} <a href={`tel:${String(siteDefaults.helpline || "").replace(/[^+\d]/g, "")}`}>{siteDefaults.helpline}</a>
        </p>
      </aside>
      <div className="AuthPanel">
        <img className="AuthPanel__logo" src="/digit-ui/images/brand/CitizenSevaEmblem.png" alt="" width="84" height="84" />
        <h1 className="AuthPanel__title">{tt("AUTH_OFFICIAL_LOGIN")}</h1>
        <p className="AuthPanel__sub">{tt("AUTH_OFFICIAL_SUB")}</p>

        <div className="AuthTabs" role="tablist" aria-label={tt("AUTH_LOGIN_METHOD")}>
          {[
            ["password", tt("AUTH_TAB_PASSWORD")],
            ["sso", tt("AUTH_TAB_SSO")],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              className={mode === id ? "is-active" : ""}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div ref={errRef}>
          {error ? <AuthAlert title={error.title} message={error.message} /> : null}
        </div>

        {mode === "password" && pending ? (
          <form className="AuthForm" onSubmit={onConfirmPick} noValidate>
            <p className="AuthPanel__sub">{tt("AUTH_PICK_SUB")}</p>
            <label className="AuthField">
              <span>{tt("AUTH_PICK_TENANT")}</span>
              <select value={pick.tenant} onChange={(e) => setPick({ tenant: e.target.value, role: "" })} aria-invalid={touched.__pick && !pick.tenant}>
                <option value="">{tt("AUTH_SELECT_CITY")}</option>
                {tenantsOf(pending.info).map((c) => (
                  <option key={c} value={c}>{tenantLabel(c)}</option>
                ))}
              </select>
              <em role={touched.__pick && !pick.tenant ? "alert" : undefined}>{touched.__pick && !pick.tenant ? tt("AUTH_ERR_CITY_REQ") : ""}</em>
            </label>
            {pick.tenant && rolesIn(pending.info, pick.tenant).length > 1 ? (
              <label className="AuthField">
                <span>{tt("AUTH_PICK_ROLE")}</span>
                <select value={pick.role} onChange={(e) => setPick({ ...pick, role: e.target.value })} aria-invalid={touched.__pick && !pick.role}>
                  <option value="">{tt("AUTH_SELECT_ROLE")}</option>
                  {rolesIn(pending.info, pick.tenant).map((r) => (
                    <option key={r.code} value={r.code}>{t(`ACCESSCONTROL_ROLES_ROLES_${r.code}`, { defaultValue: r.name || r.code })}</option>
                  ))}
                </select>
                <em role={touched.__pick && !pick.role ? "alert" : undefined}>{touched.__pick && !pick.role ? tt("AUTH_ERR_ROLE_REQ") : ""}</em>
              </label>
            ) : null}
            <button type="submit" className="AuthBtn AuthBtn--primary">{tt("AUTH_CONTINUE")}</button>
            <button type="button" className="AuthLink" onClick={onCancelPick}>{tt("AUTH_BACK_TO_LOGIN")}</button>
          </form>
        ) : mode === "password" ? (
          <form className="AuthForm" onSubmit={onSubmit} noValidate>
            <label className="AuthField">
              <span>{tt("CORE_LOGIN_USERNAME")}</span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={form.username}
                onChange={set("username")}
                onBlur={blur("username")}
                aria-invalid={!!fieldError("username")}
                aria-describedby="auth-err-username"
              />
              <em id="auth-err-username" role={fieldError("username") ? "alert" : undefined}>{fieldError("username")}</em>
            </label>

            <label className="AuthField">
              <span>{tt("CORE_LOGIN_PASSWORD")}</span>
              <div className="AuthField__pw">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={set("password")}
                  onBlur={blur("password")}
                  aria-invalid={!!fieldError("password")}
                  aria-describedby="auth-err-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? tt("AUTH_HIDE_PASSWORD") : tt("AUTH_SHOW_PASSWORD")}
                >
                  {showPassword ? tt("AUTH_HIDE") : tt("AUTH_SHOW")}
                </button>
              </div>
              <em id="auth-err-password" role={fieldError("password") ? "alert" : undefined}>{fieldError("password")}</em>
            </label>


            <button type="submit" className="AuthBtn AuthBtn--primary" disabled={busy || isDisabled}>
              {tt("AUTH_LOGIN")}
            </button>
            <button type="button" className="AuthLink" onClick={onForgotPassword}>
              {tt("CORE_COMMON_FORGOT_PASSWORD")}
            </button>
          </form>
        ) : (
          <div className="AuthSso">
            <p>{tt("AUTH_OFFICIAL_SSO_HELP")}</p>
            <iframe title={tt("AUTH_OFFICIAL_SSO_TITLE")} src={ssoUrl} />
            <a className="AuthLink" href={ssoUrl} target="_blank" rel="noopener noreferrer">
              {tt("AUTH_SSO_NEWTAB")}
            </a>
          </div>
        )}

        <div className="AuthPanel__alt">
          <span>{tt("AUTH_ARE_CITIZEN")}</span>
          <button type="button" className="AuthBtn AuthBtn--ghost" onClick={() => history.push("/digit-ui/citizen/login")}>
            {tt("LANDING_CITIZEN_LOGIN")}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

Login.propTypes = {
  loginParams: PropTypes.any,
};

Login.defaultProps = {
  loginParams: null,
};

export default Login;
