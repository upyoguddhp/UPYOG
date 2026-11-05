import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import SevaLoader from "./SevaLoader";
import { activeRole as getActiveRole, activeTenant, applyContext, contexts, loadAllRoles } from "./employeeContext";

const words = (code) => String(code).split("_").map((w) => (w ? w[0] + w.slice(1).toLowerCase() : w)).join(" ");
const cityName = (t, tenantId) => {
  const key = `TENANT_TENANTS_${String(tenantId).replace(/\./g, "_").toUpperCase()}`;
  const v = t(key);
  if (v && v !== key) return v;
  return tenantId === Digit.ULBService.getStateId() ? t("EMP_STATE_LEVEL") : words(String(tenantId).split(".").pop());
};
const roleName = (t, code) => {
  const key = `ACCESSCONTROL_ROLES_ROLES_${code}`;
  const v = t(key);
  return v && v !== key ? v : words(code);
};

/* chip in the top bar showing "role - city"; opens a searchable list of every city and role the employee holds */
const ContextSwitcher = () => {
  const { t } = useTranslation();
  const tt = (k) => t(k);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const input = useRef(null);
  const city = activeTenant();
  const activeRole = getActiveRole();
  const [state, setState] = useState({ loading: false, error: "", tick: 0 });
  const all = useMemo(() => contexts(), [open, state.tick]);

  const fetchRoles = (force) => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    loadAllRoles(force)
      .then(() => setState((s) => ({ loading: false, error: "", tick: s.tick + 1 })))
      .catch((e) => setState((s) => ({ ...s, loading: false, error: (e && e.response && e.response.data && e.response.data.Errors && e.response.data.Errors[0] && e.response.data.Errors[0].message) || tt("EMP_SWITCH_FAILED") })));
  };

  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    fetchRoles(false);
    setTimeout(() => input.current && input.current.focus(), 30);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  const needle = q.trim().toLowerCase();
  const groups = all
    .map((g) => ({ ...g, name: cityName(t, g.tenantId) }))
    .map((g) => ({ ...g, roles: g.roles.filter((r) => !needle || g.name.toLowerCase().indexOf(needle) >= 0 || roleName(t, r).toLowerCase().indexOf(needle) >= 0) }))
    .filter((g) => g.roles.length)
    .sort((a, b) => (a.tenantId === city ? -1 : b.tenantId === city ? 1 : a.name.localeCompare(b.name)));

  return (
    <React.Fragment>
      <button type="button" className="ctxChip" onClick={() => { setQ(""); setOpen(true); }} aria-haspopup="dialog">
        <span className="ctxChip__role">{activeRole ? roleName(t, activeRole) : tt("EMP_ALL_ROLES")}</span>
        <span className="ctxChip__city">{cityName(t, city)}</span>
      </button>
      {open ? (
        <div className="ctxModal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="ctxModal__card" role="dialog" aria-modal="true" aria-label={tt("EMP_SWITCH_TITLE")}>
            <header>
              <div>
                <h2>{tt("EMP_SWITCH_TITLE")}</h2>
                <p>{tt("EMP_SWITCH_HINT")}</p>
              </div>
              <button type="button" className="ctxModal__x" onClick={() => setOpen(false)} aria-label={tt("EMP_CLOSE")}>&times;</button>
            </header>
            <input ref={input} type="search" className="ctxModal__q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt("EMP_SWITCH_SEARCH")} aria-label={tt("EMP_SWITCH_SEARCH")} />
            {state.loading ? <SevaLoader message={tt("EMP_SWITCH_LOADING")} /> : null}
            {state.error ? (
              <div className="ctxModal__err" role="alert">
                <span>{state.error}</span>
                <button type="button" onClick={() => fetchRoles(true)}>{tt("EMP_RETRY")}</button>
              </div>
            ) : null}
            <div className="ctxModal__list">
              {groups.length === 0 ? <p className="ctxModal__none">{tt("EMP_SWITCH_NONE")}</p> : null}
              {groups.map((g) => (
                <section key={g.tenantId} className={g.tenantId === city ? "is-current" : ""}>
                  <h3>{g.name}{g.tenantId === city ? <em>{tt("EMP_SWITCH_CURRENT")}</em> : null}</h3>
                  <div className="ctxModal__roles">
                    {g.roles.length > 1 && !needle ? (
                      <button type="button" className={g.tenantId === city && !activeRole ? "is-on" : ""} onClick={() => applyContext({ tenantId: g.tenantId, role: "" })}>{tt("EMP_ALL_ROLES")}</button>
                    ) : null}
                    {g.roles.map((r) => (
                      <button key={r} type="button" className={g.tenantId === city && activeRole === r ? "is-on" : ""} onClick={() => applyContext({ tenantId: g.tenantId, role: r })}>{roleName(t, r)}</button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </React.Fragment>
  );
};

export default ContextSwitcher;
