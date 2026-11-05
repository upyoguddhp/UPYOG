import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { GRV_PAGES, GRV_SESSION_KEY } from "../../config/grievanceConfig";
import GrievanceDocuments from "../../pageComponents/GrievanceDocuments";
import GrievanceStep from "../../pageComponents/GrievanceStep";
import GrievanceAcknowledgement from "./Acknowledgement";
import GrievanceCheckPage from "./CheckPage";

// New grievance: one route per step (session backed), documents, review, acknowledgement.
const GrievanceFlow = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(GRV_SESSION_KEY, {});

  // leaving the flow re-arms the "Before you apply" popup for the next visit
  React.useEffect(() => () => {
    try { sessionStorage.removeItem("grv_tips_seen"); } catch (e) {}
  }, []);

  const handleSelect = (key, data) => {
    setParams({ ...params, [key]: { ...params[key], ...data } });
    const current = pathname.split("/").pop();
    const i = GRV_PAGES.findIndex((p) => p.route === current);
    history.push(`${match.url}/${(GRV_PAGES[i + 1] || {}).route || "check"}`);
  };

  return (
    <Switch>
      {GRV_PAGES.map((page) => (
        <Route path={`${match.path}/${page.route}`} key={page.route}>
          {page.custom === "documents" ? (
            <GrievanceDocuments t={t} onSelect={handleSelect} />
          ) : (
            <GrievanceStep t={t} pageKey={page.key} formData={params} onSelect={handleSelect} />
          )}
        </Route>
      ))}
      <Route path={`${match.path}/check`}>
        <GrievanceCheckPage t={t} params={params} setParams={setParams} basePath={match.url} />
      </Route>
      <Route path={`${match.path}/acknowledgement`}>
        <GrievanceAcknowledgement t={t} params={params} clearParams={clearParams} root={match.url} />
      </Route>
      <Route>
        <Redirect to={`${match.url}/grievance`} />
      </Route>
    </Switch>
  );
};

export default GrievanceFlow;
