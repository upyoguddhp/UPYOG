/** Shared helpers for the SSO / official login flows. */

const DEFAULT_SSO_SCRIPT = "https://sso.hp.gov.in/nodeapi/iframe/sso-iframe.js";

const cfg = (key, fallback) => (window?.globalConfigs?.getConfig && window.globalConfigs.getConfig(key)) || fallback;

export const ssoConfig = () => ({
  scriptUrl: cfg("SSO_SCRIPT_URL", DEFAULT_SSO_SCRIPT),
  // environment specific: set SSO_SERVICE_ID in globalConfigs.js (no built-in default)
  serviceId: String(cfg("SSO_SERVICE_ID", "")).trim(),
});

// The SSO script declares getIframeSSO with a top-level let/const/function, so it may not be a
// property of window. Indirect eval reads the global scope either way.
const globalEval = eval; // eslint-disable-line no-eval
const readSsoFn = () => {
  try {
    const fn = globalEval("typeof getIframeSSO === 'function' ? getIframeSSO : null");
    return fn || (typeof window.getIframeSSO === "function" ? window.getIframeSSO : null);
  } catch (e) {
    return null;
  }
};

/**
 * The SSO script looks up .backdrop and .iframe-container in the page and throws if they are
 * missing. They live directly under <body>, outside React, because the script moves and removes
 * nodes inside them.
 */
const ensureSsoHosts = () => {
  if (!document.querySelector(".backdrop")) {
    const b = document.createElement("div");
    b.className = "backdrop";
    document.body.appendChild(b);
  }
  if (!document.querySelector(".iframe-container")) {
    const c = document.createElement("div");
    c.className = "iframe-container";
    c.setAttribute("role", "dialog");
    c.setAttribute("aria-label", "HP Single Sign-On");
    document.body.appendChild(c);
  }
};

/** Opens the SSO login iframe. */
export const openSso = (serviceId, mode = "login", userType = "user_type") => {
  const fn = readSsoFn();
  if (!fn) throw new Error("SSO_UNAVAILABLE");
  if (!serviceId) throw new Error("SSO_NOT_CONFIGURED");
  ensureSsoHosts();
  return fn(serviceId, mode, userType);
};

let scriptPromise = null;
/** Loads the HP SSO iframe script once (never re-injects it: a second copy throws a redeclaration error). */
export const loadSsoScript = () => {
  if (readSsoFn()) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  const { scriptUrl } = ssoConfig();
  scriptPromise = new Promise((resolve, reject) => {
    let el = document.querySelector("script[data-seva-sso]");
    if (el) {
      // an earlier attempt already added it; wait for it instead of adding another
      if (readSsoFn()) return resolve();
      el.addEventListener("load", () => (readSsoFn() ? resolve() : reject(new Error("SSO_UNAVAILABLE"))));
      el.addEventListener("error", () => reject(new Error("SSO_SCRIPT_BLOCKED")));
      return undefined;
    }
    el = document.createElement("script");
    el.src = scriptUrl;
    el.async = true;
    el.setAttribute("data-seva-sso", "true");
    el.onload = () => (readSsoFn() ? resolve() : reject(new Error("SSO_UNAVAILABLE")));
    el.onerror = () => {
      el.remove(); // a failed copy can be retried cleanly
      reject(new Error("SSO_SCRIPT_BLOCKED"));
    };
    document.body.appendChild(el);
    return undefined;
  }).catch((e) => {
    scriptPromise = null; // allow a retry
    throw e;
  });
  return scriptPromise;
};

/** Plain-language error for the user, never a raw exception. */
export const describeAuthError = (err, tt) => {
  const msg = err?.message || "";
  const status = err?.response?.status || err?.status;
  const apiMsg = err?.response?.data?.error_description || err?.response?.data?.Errors?.[0]?.message;
  if (msg === "SSO_SCRIPT_BLOCKED") {
    return {
      title: tt("AUTH_ERR_SSO_BLOCKED_T"),
      message: tt("AUTH_ERR_SSO_BLOCKED"),
    };
  }
  if (msg === "SSO_UNAVAILABLE") {
    return {
      title: tt("AUTH_ERR_SSO_UNAVAILABLE_T"),
      message: tt("AUTH_ERR_SSO_UNAVAILABLE"),
    };
  }
  if (msg === "SSO_NOT_CONFIGURED") {
    return {
      title: tt("AUTH_ERR_SSO_CONFIG_T"),
      message: tt("AUTH_ERR_SSO_CONFIG"),
    };
  }
  if (msg === "NO_TOKEN") {
    return {
      title: tt("AUTH_ERR_NO_TOKEN_T"),
      message: tt("AUTH_ERR_NO_TOKEN"),
    };
  }
  if (status === 401 || status === 400 || status === 403) {
    return {
      title: tt("AUTH_ERR_REJECTED_T"),
      message: apiMsg || tt("AUTH_ERR_REJECTED"),
    };
  }
  if (status >= 500) {
    return {
      title: tt("AUTH_ERR_SERVER_T"),
      message: tt("AUTH_ERR_SERVER"),
    };
  }
  if (!navigator.onLine || msg === "Failed to fetch" || msg === "Network Error") {
    return {
      title: tt("AUTH_ERR_NETWORK_T"),
      message: tt("AUTH_ERR_NETWORK"),
    };
  }
  return {
    title: tt("AUTH_ERR_GENERIC_T"),
    message: apiMsg || tt("AUTH_ERR_GENERIC"),
  };
};

/** Persists a login response ({ UserRequest, access_token, ... }) the way the OTP / password flows do. */
export const saveSession = (response, stateCode) => {
  const { ResponseInfo, UserRequest: info, ...tokens } = response || {};
  if (!info || !tokens.access_token) throw new Error("NO_TOKEN");
  const isEmployee = String(info.type || "").toUpperCase() === "EMPLOYEE";
  const prefix = isEmployee ? "Employee" : "Citizen";
  const tenant = isEmployee ? info.tenantId : stateCode || Digit.ULBService.getStateId();
  const user = { info, ...tokens };
  const locale =
    JSON.parse(sessionStorage.getItem("Digit.initData") || "null")?.value?.selectedLanguage ||
    JSON.parse(sessionStorage.getItem("Digit.locale") || "null")?.value ||
    "en_IN";

  Digit.UserService.setType(isEmployee ? "employee" : "citizen");
  Digit.SessionStorage.set("citizen.userRequestObject", user);
  if (isEmployee) Digit.SessionStorage.set("Employee.tenantId", info.tenantId);
  Digit.UserService.setUser(user);

  localStorage.setItem(`${prefix}.tenant-id`, tenant);
  localStorage.setItem("tenant-id", tenant);
  localStorage.setItem("citizen.userRequestObject", JSON.stringify(info));
  localStorage.setItem("locale", locale);
  localStorage.setItem(`${prefix}.locale`, locale);
  localStorage.setItem("token", tokens.access_token);
  localStorage.setItem(`${prefix}.token`, tokens.access_token);
  localStorage.setItem("user-info", JSON.stringify(info));
  localStorage.setItem(`${prefix}.user-info`, JSON.stringify(info));
  return { user, isEmployee };
};

/** Exchanges the token handed back by the SSO for a portal session (egov-user /_landingPage). */
export const exchangeSsoToken = async (token) => {
  if (!token) throw new Error("NO_TOKEN");
  const res = await fetch("/user/_landingPage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    /* non-JSON body */
  }
  if (!res.ok) {
    const err = new Error(data?.Errors?.[0]?.message || "SSO_REJECTED");
    err.status = res.status;
    err.response = { status: res.status, data };
    throw err;
  }
  return data;
};

/** token can arrive as ?token=, or inside a nested ?redirect=...?token= (older SSO return format). */
export const readSsoToken = (search) => {
  const q = new URLSearchParams(search || "");
  let token = q.get("token");
  if (!token) {
    const redirect = q.get("redirect") || "";
    const inner = redirect.includes("?") ? redirect.split("?")[1] : "";
    token = new URLSearchParams(inner).get("token");
  }
  return token || null;
};
