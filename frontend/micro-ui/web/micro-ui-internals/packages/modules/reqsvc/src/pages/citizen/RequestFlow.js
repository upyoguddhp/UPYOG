import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { RQS_PAGES, RQS_SESSION_KEY } from "../../config/reqsvcConfig";
import ReqsvcDocuments from "../../pageComponents/ReqsvcDocuments";
import ReqsvcStep from "../../pageComponents/ReqsvcStep";
import ReqsvcAcknowledgement from "./Acknowledgement";
import ReqsvcCheckPage from "./CheckPage";

// New request: one route per step (session backed), documents, review, acknowledgement.
const RequestFlow = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(RQS_SESSION_KEY, {});

  // leaving the flow re-arms the "Before you apply" popup for the next visit
  React.useEffect(() => () => {
    try { sessionStorage.removeItem("rqs_tips_seen"); } catch (e) {}
  }, []);

  const handleSelect = (key, data) => {
    setParams({ ...params, [key]: { ...params[key], ...data } });
    const current = pathname.split("/").pop();
    const i = RQS_PAGES.findIndex((p) => p.route === current);
    history.push(`${match.url}/${(RQS_PAGES[i + 1] || {}).route || "check"}`);
  };

  return (
    <Switch>
      {RQS_PAGES.map((page) => (
        <Route path={`${match.path}/${page.route}`} key={page.route}>
          {page.custom === "documents" ? (
            <ReqsvcDocuments t={t} onSelect={handleSelect} />
          ) : (
            <ReqsvcStep t={t} pageKey={page.key} formData={params} onSelect={handleSelect} />
          )}
        </Route>
      ))}
      <Route path={`${match.path}/check`}>
        <ReqsvcCheckPage t={t} params={params} setParams={setParams} basePath={match.url} />
      </Route>
      <Route path={`${match.path}/acknowledgement`}>
        <ReqsvcAcknowledgement t={t} params={params} clearParams={clearParams} root={match.url} />
      </Route>
      <Route>
        <Redirect to={`${match.url}/request`} />
      </Route>
    </Switch>
  );
};

export default RequestFlow;
