/*
 * The employee works in one city and one role (or all roles) at a time. The login response carries every role the
 * employee holds; the live user keeps only the active subset, so the full list is stored apart ("Employee.allRoles").
 */
export const allRoles = () => {
  const cur = (Digit.UserService.getUser() || {}).info?.roles || [];
  const kept = Digit.SessionStorage.get("Employee.allRoles") || [];
  const merged = kept.concat(cur.filter((r) => !kept.some((k) => k.code === r.code && k.tenantId === r.tenantId)));
  if (merged.length !== kept.length) Digit.SessionStorage.set("Employee.allRoles", merged);
  return merged;
};

export const activeTenant = () => Digit.SessionStorage.get("Employee.tenantId") || Digit.ULBService.getCurrentTenantId();

// roles held in a city; state-level roles (hp) apply everywhere
export const rolesIn = (tenantId, roles = allRoles()) => {
  const state = Digit.ULBService.getStateId();
  const here = roles.filter((r) => r.tenantId === tenantId);
  return here.length ? here.concat(roles.filter((r) => r.tenantId === state)) : roles;
};

export const roleChoices = () => {
  const seen = {};
  return rolesIn(activeTenant()).filter((r) => (seen[r.code] ? false : (seen[r.code] = true)));
};

// role = "" for every role of the city
export const applyContext = ({ tenantId, role }) => {
  const data = Digit.UserService.getUser();
  const city = tenantId || activeTenant();
  const inCity = rolesIn(city);
  const chosen = role ? inCity.filter((r) => r.code === role) : inCity;
  data.info.roles = chosen.length ? chosen : inCity;
  data.info.tenantId = city;
  Digit.SessionStorage.set("Employee.tenantId", city);
  Digit.SessionStorage.set("Employee.activeRole", role || "");
  Digit.UserService.setUser(data);
  window.location.assign("/digit-ui/employee/hpwork/inbox");
};

// every city the employee holds roles in, each with its distinct roles
export const contexts = () => {
  const by = {};
  allRoles().forEach((r) => {
    if (!r.tenantId) return;
    by[r.tenantId] = by[r.tenantId] || {};
    by[r.tenantId][r.code] = true;
  });
  return Object.keys(by).map((tenantId) => ({ tenantId, roles: Object.keys(by[tenantId]) }));
};

// the complete role / city list comes from the user service (/user/_details), so it needs no fresh sign-in
let rolesLoad = null;
export const loadAllRoles = (force) => {
  if (rolesLoad && !force) return rolesLoad;
  const token = (Digit.UserService.getUser() || {}).access_token;
  rolesLoad = Digit.CustomService.getResponse({
    url: "/user/_details",
    // the gateway authorises by tenantId and falls back to "pg" (not authorized) when it is missing
    params: { access_token: token, tenantId: activeTenant() },
    data: { RequestInfo: { authToken: token } },
  })
    .then((res) => {
      const found = (res && (res.roles || (res.user || {}).roles || (res.UserRequest || {}).roles || (res.userRequest || {}).roles)) || [];
      const roles = found.filter((r) => r && r.code && r.tenantId).map((r) => ({ code: r.code, name: r.name, tenantId: r.tenantId }));
      if (roles.length) Digit.SessionStorage.set("Employee.allRoles", roles);
      return allRoles();
    })
    .catch((e) => {
      rolesLoad = null;
      throw e;
    });
  return rolesLoad;
};

// the role being worked as: the stored choice, else the only role the live session holds, else "" (every role)
export const activeRole = () => {
  const stored = Digit.SessionStorage.get("Employee.activeRole");
  if (stored) return stored;
  const live = Array.from(new Set(((Digit.UserService.getUser() || {}).info?.roles || []).map((r) => r.code)));
  return live.length === 1 ? live[0] : "";
};
