/**
 * Prefixes a relative API path with the optional dev backend origin (window.__API_BASE_URL__, set from
 * REACT_APP_API_BASE_URL in web/src/index.js). Use it for plain fetch() calls; axios calls are
 * prefixed by the interceptor in libraries Request.js. Empty base (the default) keeps same-origin.
 */
export const apiUrl = (path) => {
  const base = (typeof window !== "undefined" && window.__API_BASE_URL__) || "";
  return base && typeof path === "string" && path.startsWith("/") ? `${base.replace(/\/+$/, "")}${path}` : path;
};
