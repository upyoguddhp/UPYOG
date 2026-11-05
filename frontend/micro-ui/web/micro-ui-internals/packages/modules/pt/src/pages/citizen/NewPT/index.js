import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { NEW_PT_STEPS } from "../../../config/newPTConfig";
import { NPT_SESSION_KEY, stepsFor } from "../../../utils/newPT";
import NPTStep from "../../../pageComponents/NewPT/NPTStep";
import NPTDocuments from "../../../pageComponents/NewPT/NPTDocuments";
import NPTCheckPage from "./CheckPage";
import NPTAcknowledgement from "./Acknowledgement";

// HP Property registration: one route per step (co-owner only when asked for), session-backed,
// then review + acknowledgement. Shared by citizens and employees.
const NewPropertyRegistration = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(NPT_SESSION_KEY, {});

  // leaving the flow re-arms the "Before you apply" popup for the next visit
  React.useEffect(() => () => {
    try { sessionStorage.removeItem("npt_tips_seen"); } catch (e) {}
  }, []);

  const goNext = (nextParams) => {
    const steps = stepsFor(nextParams);
    const current = pathname.split("/").pop();
    const i = steps.findIndex((s) => s.route === current);
    history.push(`${match.path}/${steps[i + 1]?.route || "check"}`);
  };

  const handleSelect = (key, data) => {
    const next = { ...params, [key]: { ...params[key], ...data } };
    setParams(next);
    goNext(next);
  };

  // save the half-filled step without moving on
  const handleDraft = (key, data) => setParams({ ...params, [key]: { ...params[key], ...data } });

  return (
    <Switch>
      {NEW_PT_STEPS.map((step) => (
        <Route path={`${match.path}/${step.route}`} key={step.route}>
          {step.custom === "documents" ? (
            <NPTDocuments onSelect={handleSelect} t={t} formData={params} />
          ) : (
            <NPTStep config={{ key: step.key }} onSelect={handleSelect} onDraft={handleDraft} t={t} formData={params} />
          )}
        </Route>
      ))}
      <Route path={`${match.path}/check`}>
        <NPTCheckPage params={params} setParams={setParams} t={t} basePath={match.path} />
      </Route>
      <Route path={`${match.path}/acknowledgement`}>
        <NPTAcknowledgement params={params} clearParams={clearParams} t={t} />
      </Route>
      <Route>
        <Redirect to={`${match.path}/${NEW_PT_STEPS[0].route}`} />
      </Route>
    </Switch>
  );
};

export default NewPropertyRegistration;
