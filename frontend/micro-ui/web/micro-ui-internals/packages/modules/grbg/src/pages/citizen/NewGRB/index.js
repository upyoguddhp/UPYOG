import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { GRB_PAGES } from "../../../config/newGRBConfig";
import { GRB_SESSION_KEY } from "../../../utils/newGRB";
import GRBDocuments from "../../../pageComponents/NewGRB/GRBDocuments";
import GRBProperty from "../../../pageComponents/NewGRB/GRBProperty";
import GRBDetails from "../../../pageComponents/NewGRB/GRBDetails";
import GRBCheckPage from "./CheckPage";
import GRBAcknowledgement from "./Acknowledgement";

// HP Garbage Collection (GB) registration: Property search first, then one route per step, session-backed,
// then documents, review + acknowledgement.
const NewGarbageRegistration = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(GRB_SESSION_KEY, {});

  // leaving the flow re-arms the "Before you apply" popup for the next visit
  React.useEffect(() => () => {
    try { sessionStorage.removeItem("grb_tips_seen"); } catch (e) {}
  }, []);

  const goNext = () => {
    const current = pathname.split("/").pop();
    const i = GRB_PAGES.findIndex((s) => s.route === current);
    history.push(`${match.path}/${(GRB_PAGES[i + 1] || {}).route || "check"}`);
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
      {GRB_PAGES.map((step) => (
        <Route path={`${match.path}/${step.route}`} key={step.route}>
          {step.custom === "documents" ? (
            <GRBDocuments onSelect={handleSelect} t={t} formData={params} />
          ) : step.custom === "property" ? (
            <GRBProperty onSelect={handleSelect} t={t} formData={params} />
          ) : (
            <GRBDetails onSelect={handleSelect} onDraft={handleDraft} t={t} formData={params} />
          )}
        </Route>
      ))}
      <Route path={`${match.path}/check`}>
        <GRBCheckPage params={params} setParams={setParams} t={t} basePath={match.path} />
      </Route>
      <Route path={`${match.path}/acknowledgement`}>
        <GRBAcknowledgement params={params} clearParams={clearParams} t={t} />
      </Route>
      <Route>
        <Redirect to={`${match.path}/${GRB_PAGES[0].route}`} />
      </Route>
    </Switch>
  );
};

export default NewGarbageRegistration;
