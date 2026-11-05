import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { NTL_PAGES } from "../../../config/newTLConfig";
import { NTL_SESSION_KEY } from "../../../utils/newTL";
import NTLDocuments from "../../../pageComponents/NewTL/NTLDocuments";
import NTLProperty from "../../../pageComponents/NewTL/NTLProperty";
import NTLStep from "../../../pageComponents/NewTL/NTLStep";
import NTLCheckPage from "./CheckPage";
import NTLAcknowledgement from "./Acknowledgement";

// HP Trade Licence (NewTL) registration: Property search first, then one route per step, session-backed,
// then documents, review + acknowledgement.
const NewTradeRegistration = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(NTL_SESSION_KEY, {});

  // leaving the flow re-arms the "Before you apply" popup for the next visit
  React.useEffect(() => () => {
    try { sessionStorage.removeItem("ntl_tips_seen"); } catch (e) {}
  }, []);

  const goNext = () => {
    const current = pathname.split("/").pop();
    const i = NTL_PAGES.findIndex((s) => s.route === current);
    history.push(`${match.path}/${(NTL_PAGES[i + 1] || {}).route || "check"}`);
  };

  // `many` = { sectionKey: values } when one page holds several sections
  const merge = (key, data, many) => {
    const parts = many || { [key]: data };
    const next = { ...params };
    Object.keys(parts).forEach((k) => { next[k] = { ...params[k], ...parts[k] }; });
    setParams(next);
  };

  const handleSelect = (key, data, many) => {
    merge(key, data, many);
    goNext();
  };

  // save the half-filled step without moving on
  const handleDraft = (key, data, many) => merge(key, data, many);

  return (
    <Switch>
      {NTL_PAGES.map((step) => (
        <Route path={`${match.path}/${step.route}`} key={step.route}>
          {step.custom === "documents" ? (
            <NTLDocuments onSelect={handleSelect} t={t} formData={params} />
          ) : step.custom === "property" ? (
            <NTLProperty onSelect={handleSelect} t={t} formData={params} />
          ) : (
            <NTLStep config={{ key: step.key }} onSelect={handleSelect} onDraft={handleDraft} t={t} formData={params} />
          )}
        </Route>
      ))}
      <Route path={`${match.path}/check`}>
        <NTLCheckPage params={params} setParams={setParams} t={t} basePath={match.path} />
      </Route>
      <Route path={`${match.path}/acknowledgement`}>
        <NTLAcknowledgement params={params} clearParams={clearParams} t={t} />
      </Route>
      <Route>
        <Redirect to={`${match.path}/${NTL_PAGES[0].route}`} />
      </Route>
    </Switch>
  );
};

export default NewTradeRegistration;
