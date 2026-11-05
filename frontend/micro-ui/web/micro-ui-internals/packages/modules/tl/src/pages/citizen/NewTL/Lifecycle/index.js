import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { NTL_LIFECYCLE, NTL_PAGES } from "../../../../config/newTLConfig";
import { ntlText } from "../../../../config/newTLMessages";
import { NTLCrumbs } from "../../../../pageComponents/NewTL/NTLLayout";
import NTLDocuments from "../../../../pageComponents/NewTL/NTLDocuments";
import NTLStep from "../../../../pageComponents/NewTL/NTLStep";
import { apiErrorMessage } from "../../../../utils/newTL";
import { buildRenewalInitiatePayload, latestRow, licenceToParams, lifecycleActions } from "../../../../utils/newTLLifecycle";
import LifecycleAck from "./Ack";
import LifecycleCheck from "./Check";
import LifecycleStart from "./Start";

// Renew / modify / close an approved trade licence: /citizen/newtl/<mode>/<applicationNumber>/<step>
const LifecycleApp = () => {
  const { t } = useTranslation();
  const tt = (k, p) => ntlText(t, k, p);
  const match = useRouteMatch();
  const history = useHistory();
  const { pathname, search } = useLocation();
  const { mode, applicationNumber: raw } = match.params;
  const cfg = NTL_LIFECYCLE[mode];
  const appNo = decodeURIComponent(raw || "");
  const root = match.url.replace(/\/(renew|modify|close)\/[^/]+\/?$/, "");
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(`TL_LC_${mode}_${appNo}`, {});
  const tenantId = new URLSearchParams(search).get("tenantId") || params._tenantId || Digit.ULBService.getStateId();
  const [busy, setBusy] = useState(false);
  const [startError, setStartError] = useState(null);

  const q = useQuery(
    ["NTL_LIFECYCLE", appNo, tenantId],
    async () => ((await Digit.TLService.newTLSearch({ tenantId, applicationNumber: appNo }, "NewTL")) || {}).Licenses || [],
    { refetchOnWindowFocus: false, retry: 1 }
  );
  const rows = q.data || [];
  const row = latestRow(rows, appNo);

  // (re)fill the form from the licence whenever the row being worked on changes (e.g. a renewal row was just created)
  useEffect(() => {
    if (row && params._srcId !== row.id) setParams({ ...licenceToParams(row), _srcId: row.id, _tenantId: row.tenantId });
  }, [row && row.id]);

  const pages = cfg.pageKeys.map((k) => NTL_PAGES.find((p) => p.key === k));
  const lc = {
    pages,
    title: cfg.title,
    objectId: appNo,
    lock: mode === "renew" ? (f) => f.name !== "licensePeriod" : null,
  };
  const viewLink = `${root}/application/${encodeURIComponent(appNo)}?tenantId=${encodeURIComponent(tenantId)}`;
  const isAck = pathname.indexOf("/acknowledgement") >= 0;

  const merge = (key, data, many) => {
    const parts = many || { [key]: data };
    const next = { ...params };
    Object.keys(parts).forEach((k) => { next[k] = { ...params[k], ...parts[k] }; });
    setParams(next);
  };
  const goNext = () => {
    const current = pathname.split("/").pop();
    const i = pages.findIndex((p) => p.route === current);
    history.push(`${match.url}/${(pages[i + 1] || {}).route || "check"}`);
  };
  const handleSelect = (key, data, many) => {
    merge(key, data, many);
    goNext();
  };

  if (q.isLoading) return <div className="npt-wrap"><SevaLoader message={tt("NTL_LC_LOADING")} /></div>;
  const message = (text, retry) => (
    <div className="npt-wrap">
      <NTLCrumbs t={t} current={tt(cfg.title)} />
      <div className="npt-lookup-error" role="alert">
        <span>{text}</span>
        {retry ? <button type="button" className="npt-link" onClick={() => q.refetch()}>{tt("NTL_RETRY")}</button> : null}
      </div>
      <p style={{ marginTop: 16 }}><Link to={`${root}/my-registrations`} className="npt-btn npt-btn--ghost"><span>{tt("NTL_VIEW_BACK")}</span></Link></p>
    </div>
  );
  if (q.isError) return message(apiErrorMessage(q.error, tt("NTL_LC_LOAD_FAILED")), true);
  if (!row) return message(tt("NTL_VIEW_NOTFOUND"));
  const act = lifecycleActions(row, rows).find((a) => a.mode === mode);
  if (!act && !isAck) return message(tt("NTL_LC_NOT_ALLOWED"));
  if (!isAck && params._srcId !== row.id) return <div className="npt-wrap"><SevaLoader message={tt("NTL_LC_LOADING")} /></div>;

  const first = (pages[0] || {}).route || "check";
  // a renewal creates its own row first (as OldTheme did); modification and closure act on the approved row itself
  const proceed = async () => {
    if (mode === "renew" && !act.resume) {
      setBusy(true);
      setStartError(null);
      try {
        const res = await Digit.CustomService.getResponse({ url: "/tl-services/v1/NewTL/_renewal", params: { _: Date.now() }, data: buildRenewalInitiatePayload(row) });
        const made = res && res.Licenses && res.Licenses[0];
        if (!made || !made.id) throw new Error(tt("NTL_LC_START_FAILED"));
        await q.refetch();
      } catch (e) {
        setStartError(apiErrorMessage(e, tt("NTL_LC_START_FAILED")));
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    history.push(`${match.url}/${first}`);
  };

  if (busy) return <SevaLoader fullScreen message={tt("NTL_LC_STARTING")} />;

  return (
    <Switch>
      <Route path={`${match.path}/start`}>
        <LifecycleStart t={t} mode={mode} cfg={cfg} row={row} resume={!!act.resume} viewLink={viewLink} onContinue={proceed} error={startError} onClearError={() => setStartError(null)} />
      </Route>
      {pages.map((pg) => (
        <Route path={`${match.path}/${pg.route}`} key={pg.route}>
          {pg.custom === "documents" ? (
            <NTLDocuments onSelect={handleSelect} t={t} formData={params} lc={lc} />
          ) : (
            <NTLStep config={{ key: pg.key }} onSelect={handleSelect} onDraft={merge} t={t} formData={params} lc={lc} />
          )}
        </Route>
      ))}
      <Route path={`${match.path}/check`}>
        <LifecycleCheck t={t} mode={mode} cfg={cfg} row={row} params={params} setParams={setParams} pages={pages} basePath={match.url} />
      </Route>
      <Route path={`${match.path}/acknowledgement`}>
        <LifecycleAck t={t} mode={mode} cfg={cfg} params={params} root={root} clearParams={clearParams} />
      </Route>
      <Route>
        <Redirect to={`${match.url}/start${search}`} />
      </Route>
    </Switch>
  );
};

export default LifecycleApp;
