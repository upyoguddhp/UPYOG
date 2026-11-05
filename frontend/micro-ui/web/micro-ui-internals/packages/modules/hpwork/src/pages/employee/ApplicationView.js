import { DocViewer, SevaLoader, Toast, fetchServiceDocumentList } from "@upyog/digit-ui-react-components";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "react-query";
import { Link, useLocation, useParams, useRouteMatch } from "react-router-dom";
import { adapterByCode } from "../../adapters";
import { wrkText } from "../../config/hpworkMessages";
import ActionModal from "../../pageComponents/ActionModal";
import { WRKCrumbs, WRKGrid, WRKIcon, WRKPageHead } from "../../pageComponents/WorkLayout";
import { apiErrorMessage, assigneeRolesFor, call, defaultTenant, fetchWfDef, fmtTime, humanise, nextActionsOf, nextStateOf, processHistory, stageOf, statusText } from "../../utils/work";

// Generic employee view of one application: adapter summary, documents, workflow history and the actions the employee may take.
const ApplicationView = () => {
  const { t } = useTranslation();
  const tt = (k, p) => wrkText(t, k, p);
  const { service, id: raw } = useParams();
  const { search } = useLocation();
  const match = useRouteMatch();
  const queryClient = useQueryClient();
  const lastRec = useRef(null);
  const root = match.url.replace(/\/application\/.*$/, "");
  const id = decodeURIComponent(raw || "");
  const tenantId = new URLSearchParams(search).get("tenantId") || defaultTenant();
  const adapter = adapterByCode(service);

  const recQ = useQuery(["WRK_REC", service, id, tenantId], () => adapter.fetch(id, tenantId), { enabled: !!adapter, refetchOnWindowFocus: false, retry: 1 });
  const wfQ = useQuery(["WRK_WF", service, id, tenantId], () => processHistory(tenantId, id), { enabled: !!adapter, refetchOnWindowFocus: false, retry: 0 });
  const defQ = useQuery(["WRK_DEF", service, tenantId], () => fetchWfDef(adapter.businessService, tenantId), { enabled: !!adapter, refetchOnWindowFocus: false, retry: 0 });
  const docsQ = useQuery(["WRK_DOCS", service, id], () => fetchServiceDocumentList(adapter.dmsService, id), { enabled: !!adapter, refetchOnWindowFocus: false, retry: 0 });

  const [acting, setActing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [toast, setToast] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [fetching, setFetching] = useState(null);
  const dms = ((window.globalConfigs && window.globalConfigs.getConfig && window.globalConfigs.getConfig("DMS_URL")) || "/hpud-dms-service").replace(/\/$/, "");

  const openDoc = async (x) => {
    setFetching(x.id);
    try {
      const res = await fetch(`${dms}/dms/downloadFile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(Digit.UserService.getUser() || {}).access_token}` },
        body: JSON.stringify({ RequestInfo: { apiId: "Rainmaker" }, id: x.attachment.url }),
      });
      if (!res.ok || (res.headers.get("content-type") || "").indexOf("json") >= 0) throw new Error("download");
      setViewing({ source: await res.blob(), name: x.attachment.name || x.documentName });
    } catch (e) {
      setToast({ error: true, label: tt("WRK_DOCV_FAILED") });
    }
    setFetching(null);
  };

  const crumbsOf = (current) => <WRKCrumbs t={t} current={current} />;
  if (!adapter) return <div className="npt-wrap">{crumbsOf(id)}<div className="npt-lookup-error" role="alert"><span>{tt("WRK_VIEW_NOTFOUND")}</span></div></div>;
  if (recQ.isLoading) return <div className="npt-wrap"><SevaLoader message={tt("WRK_VIEW_LOADING")} /></div>;
  // after an action the service may stop returning an application that moved beyond this employee's roles: keep showing the last copy
  if (recQ.data) lastRec.current = recQ.data;
  const rec = recQ.data || lastRec.current;
  if ((recQ.isError && !rec) || !rec) {
    return (
      <div className="npt-wrap">
        {crumbsOf(id)}
        <WRKPageHead title={tt("WRK_VIEW_TITLE")} sub={id} />
        <div className="npt-lookup-error" role="alert">
          <span>{recQ.isError ? apiErrorMessage(recQ.error, tt("WRK_VIEW_FAILED")) : tt("WRK_VIEW_NOTFOUND")}</span>
          {recQ.isError ? <button type="button" className="npt-link" onClick={() => recQ.refetch()}>{tt("WRK_RETRY")}</button> : null}
        </div>
      </div>
    );
  }

  const sum = adapter.summary(rec);
  const history = ((wfQ.data && wfQ.data.ProcessInstances) || []).slice().sort((a, b) => (b.auditDetails || {}).createdTime - (a.auditDetails || {}).createdTime);
  // the workflow is the source of truth for where the application stands (a few records carry a stale status)
  const liveStatus = (history[0] && history[0].state && history[0].state.state) || sum.status;
  const stage = stageOf(liveStatus);
  const docs = (docsQ.data || []).filter((x) => x.attachment && x.attachment.url);
  const actions = wfQ.data ? nextActionsOf(wfQ.data).map((a) => ({ ...a, label: wrkText(t, `WRK_ACT_${a.action}`, { defaultValue: humanise(a.action) }) })) : [];
  const labelOf = (a) => (a.label === `WRK_ACT_${a.action}` ? humanise(a.action) : a.label);

  const submit = async ({ comment, assignees }) => {
    setSaving(true);
    try {
      const u = adapter.buildUpdate(rec, acting.action, { comment, assignees });
      await call(u.url, u.data, { tenantId });
      setActing(null);
      ["WRK_OV", "WRK_LIST"].forEach((k) => queryClient.invalidateQueries([k]));
      const [, wf] = await Promise.all([recQ.refetch(), wfQ.refetch()]);
      // report the state the application actually reached, not the action's name
      const pis = ((wf && wf.data && wf.data.ProcessInstances) || []).slice().sort((a, b) => (b.auditDetails || {}).createdTime - (a.auditDetails || {}).createdTime);
      const reached = statusText(t, pis[0] && pis[0].state && pis[0].state.state) || labelOf(acting);
      setDone(reached);
      setToast({ error: false, label: tt("WRK_DONE", { status: reached }) });
    } catch (e) {
      setToast({ error: true, label: apiErrorMessage(e, tt("WRK_MODAL_FAILED")) });
    }
    setSaving(false);
  };

  return (
    <div className="npt-wrap bkg-view npt-printview wrk-view">
      {crumbsOf(id)}
      <div className="npt-listhead">
        <WRKPageHead title={`${tt(adapter.labelKey)} · ${tt("WRK_VIEW_TITLE")}`} sub={id} />
        <button type="button" className="npt-btn npt-btn--ghost" onClick={() => window.print()}><WRKIcon name="print" size={18} /><span>{tt("WRK_VIEW_PRINT")}</span></button>
      </div>

      {done ? (
        <div className="wrk-done" role="status">
          <WRKIcon name="check" size={20} />
          <span>{tt("WRK_DONE", { status: done })}</span>
          <Link to={`${root}/inbox`} className="npt-btn npt-btn--ghost"><span>{tt("WRK_DONE_BACK")}</span></Link>
        </div>
      ) : null}

      <section className="npt-card bkg-pane">
        <p className="bkg-pane__status">
          <span>{tt("WRK_VIEW_STATUS")}:</span>
          <span className={`npt-badge npt-badge--${stage}`}>{statusText(t, liveStatus)}</span>
        </p>
        {sum.sections.slice(0, 1).map((s) => <WRKGrid key={s.head} rows={s.rows.map(([k, v]) => [tt(k), v])} />)}
      </section>
      {sum.sections.slice(1).map((s) => (
        <section className="npt-card bkg-pane" key={s.head}><h3>{tt(s.head)}</h3><WRKGrid rows={s.rows.map(([k, v]) => [tt(k), v])} /></section>
      ))}

      <section className="npt-card bkg-pane">
        <h3>{tt("WRK_VIEW_DOCS")}</h3>
        {docsQ.isLoading ? <SevaLoader message={tt("WRK_LOADING")} /> : docsQ.isError ? <p className="wrk-warn">{tt("WRK_DOCS_FAILED")}</p> : docs.length === 0 ? <p>{tt("WRK_VIEW_NODOCS")}</p> : (
          <ul className="bkg-docs">
            {docs.map((x) => (
              <li key={x.id}>
                <span>{x.documentName}</span>
                <button type="button" className="npt-btn npt-btn--ghost" disabled={fetching === x.id} onClick={() => openDoc(x)}><span>{tt("WRK_DOC_VIEW")}</span></button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {fetching ? <SevaLoader fullScreen message={tt("WRK_DOCV_OPENING")} /> : null}
      {viewing ? <DocViewer source={viewing.source} name={viewing.name} labels={{ close: tt("WRK_MODAL_CANCEL"), viewFailed: tt("WRK_DOCV_FAILED") }} onClose={() => setViewing(null)} /> : null}

      <section className="npt-card bkg-pane">
        <h3>{tt("WRK_VIEW_TIMELINE")}</h3>
        {wfQ.isLoading ? <SevaLoader message={tt("WRK_LOADING")} /> : wfQ.isError ? (
          <div className="npt-lookup-error" role="alert"><span>{apiErrorMessage(wfQ.error, tt("WRK_VIEW_FAILED"))}</span><button type="button" className="npt-link" onClick={() => wfQ.refetch()}>{tt("WRK_RETRY")}</button></div>
        ) : history.length === 0 ? <p>{tt("WRK_VIEW_NOHISTORY")}</p> : (
          <ol className="wrk-hist">
            {history.map((h, i) => {
              const who = (h.assigner || {}).name || "";
              const to = h.assignes && h.assignes[0] && h.assignes[0].name;
              const act = String((h.action || "")).toUpperCase();
              const histLabel = (a) => { const k = `WRK_HIST_${a}`; const v = wrkText(t, k); return v === k ? statusText(a) : v; };
              const kind = /REJECT|CLOSE/.test(act) ? "bad" : /RETURN|MODIF|REOPEN/.test(act) ? "warn" : /APPROVE|RESOLVE|PAY/.test(act) ? "good" : "info";
              const when = fmtTime((h.auditDetails || {}).createdTime);
              return (
                <li key={h.id || i} className={`wrk-hist__item is-${kind}${i === 0 ? " is-now" : ""}`}>
                  <span className="wrk-hist__dot" aria-hidden="true"><WRKIcon name={kind === "bad" ? "close" : kind === "warn" ? "list" : "check"} size={14} /></span>
                  <div className="wrk-hist__card">
                    <div className="wrk-hist__top">
                      <strong>{histLabel(act)}</strong>
                      <span className={`npt-badge npt-badge--${stageOf((h.state || {}).state)}`}>{statusText(t, (h.state || {}).state)}</span>
                      {i === 0 ? <em className="wrk-hist__now">{tt("WRK_HIST_CURRENT")}</em> : null}
                    </div>
                    <div className="wrk-hist__meta">
                      <span className="wrk-hist__who"><i aria-hidden="true">{(who || "S").trim().charAt(0).toUpperCase()}</i>{who || tt("WRK_HIST_SYSTEM")}</span>
                      {to ? <span className="wrk-hist__to">{tt("WRK_ASSIGNED_TO")} {to}</span> : null}
                      <time>{when}</time>
                    </div>
                    {h.comment && h.comment.trim() && h.comment.trim() !== ".." ? <blockquote className="wrk-hist__note">{h.comment}</blockquote> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="npt-card bkg-pane wrk-actions">
        <h3>{tt("WRK_ACTIONS")}</h3>
        {wfQ.isLoading ? null : actions.length === 0 ? <p>{tt("WRK_ACTIONS_NONE")}</p> : (
          <div className="wrk-actions__row">
            {actions.map((a) => {
              const danger = /REJECT|RETURN/.test(a.action);
              return <button key={a.action} type="button" className={`npt-btn ${danger ? "npt-btn--ghost" : "npt-btn--primary"}`} onClick={() => setActing(a)}><span>{labelOf(a)}</span></button>;
            })}
          </div>
        )}
      </section>

      {acting ? (
        <ActionModal action={{ ...acting, label: labelOf(acting) }} tenantId={tenantId} commentMax={adapter.commentMax} assigneeRoles={assigneeRolesFor(defQ.data, acting.nextState || nextStateOf(defQ.data, wfQ.data, acting.action))} saving={saving} onSubmit={submit} onClose={() => !saving && setActing(null)} />
      ) : null}
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
      <p className="bkg-back"><Link to={`${root}/inbox`} className="npt-btn npt-btn--ghost"><span>{tt("WRK_BACK")}</span></Link></p>
    </div>
  );
};

export default ApplicationView;
