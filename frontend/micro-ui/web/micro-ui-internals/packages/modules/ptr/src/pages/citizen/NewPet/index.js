import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { NPR_PAGES } from "../../../config/newPetConfig";
import { NPR_SESSION_KEY } from "../../../utils/newPet";
import NPRDocuments from "../../../pageComponents/NewPet/NPRDocuments";
import NPRProperty from "../../../pageComponents/NewPet/NPRProperty";
import NPRStep from "../../../pageComponents/NewPet/NPRStep";
import NPRCheckPage from "./CheckPage";
import NPRAcknowledgement from "./Acknowledgement";

// HP Pet registration (NewPet): one route per page, session-backed, then documents, review + acknowledgement.
const NewPetRegistration = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(NPR_SESSION_KEY, {});

  // leaving the flow re-arms the "Before you apply" popup for the next visit
  React.useEffect(() => () => {
    try { sessionStorage.removeItem("npr_tips_seen"); } catch (e) {}
  }, []);

  const goNext = () => {
    const current = pathname.split("/").pop();
    const i = NPR_PAGES.findIndex((s) => s.route === current);
    history.push(`${match.path}/${(NPR_PAGES[i + 1] || {}).route || "check"}`);
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
      {NPR_PAGES.map((step) => (
        <Route path={`${match.path}/${step.route}`} key={step.route}>
          {step.custom === "documents" ? (
            <NPRDocuments onSelect={handleSelect} t={t} formData={params} />
          ) : step.custom === "property" ? (
            <NPRProperty onSelect={handleSelect} t={t} formData={params} />
          ) : (
            <NPRStep config={{ key: step.key }} onSelect={handleSelect} onDraft={handleDraft} t={t} formData={params} />
          )}
        </Route>
      ))}
      <Route path={`${match.path}/check`}>
        <NPRCheckPage params={params} setParams={setParams} t={t} basePath={match.path} />
      </Route>
      <Route path={`${match.path}/acknowledgement`}>
        <NPRAcknowledgement params={params} clearParams={clearParams} t={t} />
      </Route>
      <Route>
        <Redirect to={`${match.path}/${NPR_PAGES[0].route}`} />
      </Route>
    </Switch>
  );
};

export default NewPetRegistration;
