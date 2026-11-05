import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import SiteShell from "../SiteShell";
import SevaLoader from "../../../../components/SevaLoader";
import AuthAlert from "../../../../components/AuthAlert";
import { describeAuthError, loadSsoScript, openSso, ssoConfig } from "../../../../components/SevaLoader/authSession";

const STEPS = [
  ["AUTH_STEP_1", "Choose Citizen Login and sign in with your HP Single Sign-On (SSO) account."],
  ["AUTH_STEP_2", "Citizen Seva verifies you with the SSO. No separate registration or password is needed here."],
  ["AUTH_STEP_3", "You return to Citizen Seva and continue where you left off."],
];

const CitizenLogin = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const history = useHistory();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const query = new URLSearchParams(location.search);
  const from = location.state?.from || query.get("from") || "";
  const isLoggedIn = !!Digit.UserService.getUser()?.access_token;

  useEffect(() => () => {
    mounted.current = false;
  }, []);

  // already signed in: go straight on
  useEffect(() => {
    if (isLoggedIn) history.replace(from || "/digit-ui/citizen");
  }, [isLoggedIn]);

  // some SSO builds post the token back instead of redirecting
  useEffect(() => {
    let origin = "";
    try {
      origin = new URL(ssoConfig().scriptUrl).origin;
    } catch (e) {
      /* ignore */
    }
    const onMessage = (e) => {
      if (!origin || e.origin !== origin) return;
      const token = typeof e.data === "string" ? e.data : e.data?.token;
      if (token && typeof token === "string") {
        history.replace(`/digit-ui/citizen/sso-callback?token=${encodeURIComponent(token)}`);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [history]);

  const startSso = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      if (from) {
        try {
          sessionStorage.setItem("POST_LOGIN_REDIRECT", from);
        } catch (e) {
          /* storage blocked: fall back to home after login */
        }
      }
      await loadSsoScript();
      openSso(ssoConfig().serviceId, "login", "user_type");
    } catch (e) {
      if (mounted.current) setError(describeAuthError(e, tt));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [from]);

  return (
    <SiteShell activeId="login" title={tt("AUTH_CITIZEN_LOGIN", "Citizen Login")} subtitle={tt("AUTH_CITIZEN_SUB", "Sign in with HP Single Sign-On")}>
      {busy && <SevaLoader fullScreen message={tt("AUTH_OPENING_SSO", "Opening Single Sign-On, please wait...")} />}
      <div className="AuthPage">
        <div className="AuthCard">
          <div className="AuthCard__side">
            <img src="/digit-ui/images/brand/CitizenSevaEmblem.png" alt="" width="132" height="132" />
            <h2>{tt("AUTH_WELCOME", "Welcome to Citizen Seva")}</h2>
            <p>{tt("AUTH_WELCOME_SUB", "Citizens sign in through the Himachal Pradesh Single Sign-On. We do not create separate citizen accounts on this portal.")}</p>
          </div>

          <div className="AuthCard__main">
            <h2 className="AuthCard__title">{tt("AUTH_CITIZEN_LOGIN", "Citizen Login")}</h2>

            {error ? (
              <AuthAlert
                title={error.title}
                message={error.message}
                actionLabel={tt("AUTH_TRY_AGAIN", "Try again")}
                onAction={startSso}
              />
            ) : null}

            <button type="button" className="AuthBtn AuthBtn--primary" onClick={startSso} disabled={busy}>
              <span className="AuthBtn__icon" aria-hidden="true">&#128274;</span>
              {tt("AUTH_LOGIN_WITH_SSO", "Login with HP Single Sign-On")}
            </button>

            <p className="AuthHint">
              {tt("AUTH_NO_SSO", "Don't have an SSO account?")}{" "}
              {tt("AUTH_NO_SSO_HELP", "Use \"Sign Up\" on the Single Sign-On window to create one, then log in here.")}
            </p>

            <ol className="AuthSteps">
              {STEPS.map(([k, d]) => (
                <li key={k}>{tt(k, d)}</li>
              ))}
            </ol>

            <div className="AuthCard__alt">
              <span>{tt("AUTH_ARE_OFFICIAL", "Are you a Government official?")}</span>
              <button type="button" className="AuthBtn AuthBtn--ghost" onClick={() => history.push("/digit-ui/employee/user/login")}>
                {tt("LANDING_OFFICIAL_LOGIN", "Official Login")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
};

export default CitizenLogin;
