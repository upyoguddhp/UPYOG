import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import SiteShell from "../SiteShell";
import SevaLoader from "../../../../components/SevaLoader";
import AuthAlert from "../../../../components/AuthAlert";
import { describeAuthError, exchangeSsoToken, readSsoToken, saveSession } from "../../../../components/SevaLoader/authSession";

/** Landing page the SSO returns to: swaps the SSO token for a portal session, then moves on. */
const SsoCallback = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const history = useHistory();
  const location = useLocation();
  const [error, setError] = useState(null);
  const ran = useRef(false);

  const run = async () => {
    setError(null);
    try {
      const token = readSsoToken(location.search);
      const response = await exchangeSsoToken(token);
      const { isEmployee } = saveSession(response, Digit.ULBService.getStateId());
      let target = "";
      try {
        target = sessionStorage.getItem("POST_LOGIN_REDIRECT") || "";
        sessionStorage.removeItem("POST_LOGIN_REDIRECT");
      } catch (e) {
        /* ignore */
      }
      const safe = target.startsWith("/digit-ui/") ? target : "";
      history.replace(safe || (isEmployee ? "/digit-ui/employee" : "/digit-ui/citizen/dashboard"));
    } catch (e) {
      setError(describeAuthError(e, tt));
    }
  };

  useEffect(() => {
    if (ran.current) return; // the token is single use: never exchange it twice
    ran.current = true;
    run();
  }, []);

  return (
    <SiteShell activeId="login" title={tt("AUTH_SIGNING_IN", "Signing you in")}>
      {error ? (
        <div className="AuthPage">
          <AuthAlert
            title={error.title}
            message={error.message}
            actionLabel={tt("AUTH_BACK_TO_LOGIN", "Back to login")}
            onAction={() => history.replace("/digit-ui/citizen/login")}
          />
        </div>
      ) : (
        <SevaLoader message={tt("AUTH_VERIFYING", "Verifying your sign-in, please wait...")} />
      )}
    </SiteShell>
  );
};

export default SsoCallback;
