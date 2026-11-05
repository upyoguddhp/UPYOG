import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { grbPagesFor } from "../../../config/newGRBConfig";
import GRBDetails from "../../../pageComponents/NewGRB/GRBDetails";
import GRBDocuments from "../../../pageComponents/NewGRB/GRBDocuments";
import { GRB_MODIFY_SESSION_KEY } from "../../../utils/newGRB";
import GRBCheckPage from "./CheckPage";
import LifecycleEntry from "./LifecycleEntry";
import ModifyAcknowledgement from "./ModifyAcknowledgement";

// Modification of an approved garbage account: confirm (+dues check, workflow hand-back) -> details -> documents -> review -> acknowledgement.
// Pages are the registration ones; the property stays as filed. Values live in their own session key.
const ModifyGarbage = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(GRB_MODIFY_SESSION_KEY, {});
  const pages = grbPagesFor({ _mode: "MODIFICATION" });
  const started = params && params._mode === "MODIFICATION";

  const goNext = () => {
    const current = pathname.split("/").pop();
    const i = pages.findIndex((s) => s.route === current);
    history.push(`${match.url}/${(pages[i + 1] || {}).route || "check"}`);
  };
  const merge = (key, data, many) => {
    const parts = many || { [key]: data };
    const next = { ...params };
    Object.keys(parts).forEach((k) => { next[k] = { ...params[k], ...parts[k] }; });
    setParams(next);
  };
  const handleSelect = (key, data, many) => { merge(key, data, many); goNext(); };
  const handleDraft = (key, data, many) => merge(key, data, many);

  // deep links / refresh without a started modification go back to the confirm step
  const guard = (node) => (started ? node : <Redirect to={match.url} />);

  return (
    <Switch>
      <Route exact path={match.path}>
        <LifecycleEntry kind="modify" params={params} setParams={setParams} />
      </Route>
      <Route path={`${match.path}/details`}>{guard(<GRBDetails onSelect={handleSelect} onDraft={handleDraft} t={t} formData={params} />)}</Route>
      <Route path={`${match.path}/documents`}>{guard(<GRBDocuments onSelect={handleSelect} t={t} formData={params} />)}</Route>
      <Route path={`${match.path}/check`}>{guard(<GRBCheckPage params={params} setParams={setParams} t={t} basePath={match.url} />)}</Route>
      <Route path={`${match.path}/acknowledgement`}>
        <ModifyAcknowledgement params={params} clearParams={clearParams} t={t} />
      </Route>
      <Route><Redirect to={match.url} /></Route>
    </Switch>
  );
};

export default ModifyGarbage;
