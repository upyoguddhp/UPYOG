import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { OTS_PAGES, OTS_SESSION_KEY } from "../../config/otsConfig";
import OTSDocuments from "../../pageComponents/OTSDocuments";
import OTSLoans from "../../pageComponents/OTSLoans";
import OTSSettlement from "../../pageComponents/OTSSettlement";
import OTSStep from "../../pageComponents/OTSStep";
import OTSAcknowledgement from "./Acknowledgement";
import OTSCheckPage from "./CheckPage";

// New application: one route per step (session backed), documents, review, acknowledgement.
const OTSFlow = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(OTS_SESSION_KEY, {});

  // leaving the flow re-arms the "Before you apply" popup for the next visit
  React.useEffect(() => () => {
    try { sessionStorage.removeItem("ots_tips_seen"); } catch (e) {}
  }, []);

  const handleSelect = (key, data) => {
    setParams({ ...params, [key]: { ...params[key], ...data } });
    const current = pathname.split("/").pop();
    const i = OTS_PAGES.findIndex((p) => p.route === current);
    history.push(`${match.url}/${(OTS_PAGES[i + 1] || {}).route || "check"}`);
  };

  const component = (page) => {
    if (page.custom === "documents") return <OTSDocuments t={t} onSelect={handleSelect} />;
    if (page.custom === "loans") return <OTSLoans t={t} formData={params} onSelect={handleSelect} />;
    if (page.custom === "settlement") return <OTSSettlement t={t} formData={params} onSelect={handleSelect} />;
    return <OTSStep t={t} pageKey={page.key} formData={params} onSelect={handleSelect} />;
  };

  return (
    <Switch>
      {OTS_PAGES.map((page) => (
        <Route path={`${match.path}/${page.route}`} key={page.route}>{component(page)}</Route>
      ))}
      <Route path={`${match.path}/check`}>
        <OTSCheckPage t={t} params={params} setParams={setParams} basePath={match.url} />
      </Route>
      <Route path={`${match.path}/acknowledgement`}>
        <OTSAcknowledgement t={t} params={params} clearParams={clearParams} root={match.url} />
      </Route>
      <Route>
        <Redirect to={`${match.url}/applicant`} />
      </Route>
    </Switch>
  );
};

export default OTSFlow;
