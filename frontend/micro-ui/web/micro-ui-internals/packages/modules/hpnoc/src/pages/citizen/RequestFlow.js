import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { HNC_PAGES, HNC_SESSION_KEY } from "../../config/hpnocConfig";
import HpnocDocuments from "../../pageComponents/HpnocDocuments";
import HpnocStep from "../../pageComponents/HpnocStep";
import HpnocAcknowledgement from "./Acknowledgement";
import HpnocCheckPage from "./CheckPage";

// New request: one route per step (session backed), documents, review, acknowledgement.
const RequestFlow = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(HNC_SESSION_KEY, {});

  // leaving the flow re-arms the "Before you apply" popup for the next visit
  React.useEffect(() => () => {
    try { sessionStorage.removeItem("hnc_tips_seen"); } catch (e) {}
  }, []);

  const handleSelect = (key, data) => {
    setParams({ ...params, [key]: { ...params[key], ...data } });
    const current = pathname.split("/").pop();
    const i = HNC_PAGES.findIndex((p) => p.route === current);
    history.push(`${match.url}/${(HNC_PAGES[i + 1] || {}).route || "check"}`);
  };

  return (
    <Switch>
      {HNC_PAGES.map((page) => (
        <Route path={`${match.path}/${page.route}`} key={page.route}>
          {page.custom === "documents" ? (
            <HpnocDocuments t={t} onSelect={handleSelect} />
          ) : (
            <HpnocStep t={t} pageKey={page.key} formData={params} onSelect={handleSelect} />
          )}
        </Route>
      ))}
      <Route path={`${match.path}/check`}>
        <HpnocCheckPage t={t} params={params} setParams={setParams} basePath={match.url} />
      </Route>
      <Route path={`${match.path}/acknowledgement`}>
        <HpnocAcknowledgement t={t} params={params} clearParams={clearParams} root={match.url} />
      </Route>
      <Route>
        <Redirect to={`${match.url}/noc`} />
      </Route>
    </Switch>
  );
};

export default RequestFlow;
