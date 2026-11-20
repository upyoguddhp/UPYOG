import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, Redirect } from "react-router-dom";
import { wrkText } from "../../config/hpworkMessages";
import { WRKIcon, WRKPageHead, WRKBack } from "../../pageComponents/WorkLayout";
import { canManageMasters, fetchSchemas } from "../../utils/masters";
import { apiErrorMessage } from "../../utils/work";

const ALL = "*";
const moduleOf = (code) => (code.indexOf(".") > 0 ? code.split(".")[0] : "");
const nameOf = (code) => (code.indexOf(".") > 0 ? code.split(".").slice(1).join(".") : code);
const readSaved = () => { try { return sessionStorage.getItem("wrk-mst-module") || ALL; } catch (e) { return ALL; } };

/* Two panes: modules on the left (pills on a phone), the selected module's masters as compact rows on the right. */
const Masters = () => {
  const { t } = useTranslation();
  const tt = (k, p) => wrkText(t, k, p);
  const [q, setQ] = useState("");
  const [mod, setMod] = useState(readSaved);
  const allowed = canManageMasters();
  const schemas = useQuery(["WRK_MST_SCHEMAS"], fetchSchemas, { enabled: allowed, refetchOnWindowFocus: false, retry: 0 });

  const term = q.trim().toLowerCase();
  const matches = useMemo(() => (schemas.data || []).filter((s) => !term || `${s.code} ${s.description}`.toLowerCase().includes(term)), [schemas.data, term]);
  const modules = useMemo(() => {
    const by = {};
    matches.forEach((s) => { const m = moduleOf(s.code) || tt("WRK_MST_OTHER"); by[m] = (by[m] || 0) + 1; });
    return Object.keys(by).sort((a, b) => a.localeCompare(b)).map((name) => ({ name, n: by[name] }));
  }, [matches]);

  if (!allowed) return <Redirect to="/digit-ui/employee/hpwork/inbox" />;
  const pick = (m) => { setMod(m); try { sessionStorage.setItem("wrk-mst-module", m); } catch (e) {} };
  const active = mod !== ALL && modules.some((m) => m.name === mod) ? mod : ALL;
  const rows = matches.filter((s) => active === ALL || (moduleOf(s.code) || tt("WRK_MST_OTHER")) === active);

  return (
    <div className="npt-wrap wrk-masters">
      <nav className="npt-crumbs" aria-label="Breadcrumb"><WRKBack /><a href="/digit-ui/employee">{tt("WRK_CRUMB_HOME")}</a><span>›</span><strong aria-current="page">{tt("WRK_MST_TITLE")}</strong></nav>
      <WRKPageHead title={tt("WRK_MST_TITLE")} sub={tt("WRK_MST_SUB")} />

      {schemas.isLoading ? <SevaLoader message={tt("WRK_LOADING")} /> : null}
      {schemas.isError ? <div className="npt-lookup-error" role="alert"><span>{apiErrorMessage(schemas.error, tt("WRK_MST_SCHEMAS_FAILED"))}</span><button type="button" className="npt-link" onClick={() => schemas.refetch()}>{tt("WRK_RETRY")}</button></div> : null}

      {schemas.data ? (
        <div className="wrk-mst">
          <aside className="wrk-mst__side" aria-label={tt("WRK_MST_MODULES")}>
            <label className="npt-search wrk-mst__q">
              <WRKIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("WRK_MST_SEARCH")} aria-label={tt("WRK_MST_SEARCH")} onChange={(e) => setQ(e.target.value)} />
            </label>
            <ul className="wrk-mst__mods">
              <li><button type="button" className={`wrk-mod${active === ALL ? " is-on" : ""}`} aria-pressed={active === ALL} onClick={() => pick(ALL)}><span>{tt("WRK_MST_ALLMOD")}</span><em>{matches.length}</em></button></li>
              {modules.map((m) => (
                <li key={m.name}><button type="button" className={`wrk-mod${active === m.name ? " is-on" : ""}`} aria-pressed={active === m.name} onClick={() => pick(m.name)}><span>{m.name}</span><em>{m.n}</em></button></li>
              ))}
            </ul>
          </aside>

          <section className="wrk-mst__main" aria-live="polite">
            <header className="wrk-mst__head">
              <h2>{active === ALL ? tt("WRK_MST_ALLMOD") : active}</h2>
              <span>{tt("WRK_MST_COUNT", { n: rows.length, total: (schemas.data || []).length })}</span>
            </header>
            {!rows.length ? <div className="npt-empty"><WRKIcon name="search" size={40} /><strong>{tt("WRK_MST_NONE")}</strong></div> : (
              <ul className="wrk-mst__rows">
                {rows.map((s) => (
                  <li key={s.code}>
                    <Link to={`/digit-ui/employee/hpwork/masters/${encodeURIComponent(s.code)}`} className={`wrk-mrow${s.active ? "" : " is-off"}`}>
                      <span className="wrk-mrow__t"><strong>{nameOf(s.code)}</strong>{active === ALL && moduleOf(s.code) ? <em>{moduleOf(s.code)}</em> : null}</span>
                      <small>{s.description && s.description !== s.code ? s.description : s.code}</small>
                      <span className="wrk-mrow__go" aria-hidden="true">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default Masters;
