import { CardLabelError, SevaLoader, TextInput, Toast } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Link, useHistory } from "react-router-dom";
import { NEW_GRB_STEPS, GRB_PAGES } from "../../config/newGRBConfig";
import { grbText } from "../../config/newGRBMessages";
import { apiErrorMessage, propertyAddressOf, propertyToSelection } from "../../utils/newGRB";
import { GRBActions, GRBBtn, GRBCrumbs, GRBIcon, GRBInfoBar, GRBPage, GRBPageHead, GRBStepper, GRBTricolour } from "./GRBLayout";

export const GRB_REGISTER_PROPERTY_PATH = "/digit-ui/citizen/property/new-registration";

// search modes: how the citizen looks the property up
const MODES = [
  { key: "mine", label: "GRB_PS_MODE_MINE" },
  { key: "propertyIds", label: "GRB_PS_MODE_ID", ph: "GRB_PS_PH_ID" },
  { key: "mobileNumber", label: "GRB_PS_MODE_MOBILE", ph: "GRB_PS_PH_MOBILE", digits: 10 },
  { key: "oldpropertyids", label: "GRB_PS_MODE_OLD", ph: "GRB_PS_PH_OLD" },
];

const basePathOf = (history) => history.location.pathname.replace(/\/[^/]+\/?$/, "");

const statusLabel = (tt, s) => (s === "ACTIVE" ? tt("GRB_PS_STATUS_ACTIVE") : s === "INACTIVE" ? tt("GRB_PS_STATUS_INACTIVE") : tt("GRB_PS_STATUS_PROGRESS"));

/**
 * Step 1: find and pick the property the garbage account is for. Search runs across all ULBs of the state tenant,
 * * Result cards are selectable; choosing one prefills location + owner.
 */
const GRBProperty = ({ t, onSelect, formData = {}, goBack }) => {
  const history = useHistory();
  const tt = (k, p) => grbText(t, k, p);
  const step = NEW_GRB_STEPS.find((s) => s.custom === "property");
  const steps = GRB_PAGES;
  const index = steps.findIndex((s) => s.key === step.key);
  const navSteps = [...steps, { key: "review", route: "check", head: "GRB_STEP_REVIEW" }];
  const saved = formData[step.key] || {};
  const info = (Digit.UserService.getUser() || {}).info || {};

  const [mode, setMode] = useState("mine");
  const [term, setTerm] = useState("");
  const [submitted, setSubmitted] = useState(null); // { mode, term } actually searched
  const [picked, setPicked] = useState(saved.propertyId ? saved : null);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const stateId = Digit.ULBService.getStateId();
  // property-services searches every ULB under the state tenant, so no district / ULB is needed up front
  const tenantId = stateId;
  const criteria = mode === "mine" ? { mode: "mine", term: info.mobileNumber } : submitted;

  const search = useQuery(
    ["GRB_PROPERTY_SEARCH", tenantId, criteria && criteria.mode, criteria && criteria.term],
    () => {
      const key = criteria.mode === "mine" ? "mobileNumber" : criteria.mode;
      return Digit.PTService.search({ tenantId, filters: { [key]: criteria.term } });
    },
    { enabled: !!(criteria && criteria.term), refetchOnWindowFocus: false, retry: 1 }
  );

  const results = useMemo(() => {
    const list = (search.data && search.data.Properties) || [];
    // newest first, one card per property id
    const seen = new Set();
    return [...list]
      .sort((a, b) => ((b.auditDetails || {}).createdTime || 0) - ((a.auditDetails || {}).createdTime || 0))
      .filter((p) => (seen.has(p.propertyId) ? false : seen.add(p.propertyId)));
  }, [search.data]);

  const modeDef = MODES.find((m) => m.key === mode);

  const run = () => {
    const v = term.trim();
    if (!v) return setErrors({ term: "GRB_E_REQUIRED" });
    if (modeDef.digits && !/^[6-9]\d{9}$/.test(v)) return setErrors({ term: "GRB_E_MOBILE" });
    setErrors({});
    setPicked(null);
    setSubmitted({ mode, term: v });
  };

  const onNext = () => {
    if (!picked) {
      setErrors({ pick: "GRB_PS_E_PICK" });
      setToast({ error: true, label: tt("GRB_PS_E_PICK") });
      return;
    }
    onSelect(step.key, picked);
  };

  const pick = (p) => {
    setPicked(propertyToSelection(p));
    setErrors({});
  };

  const searching = !!(criteria && criteria.term) && search.isLoading;
  const searched = !!(criteria && criteria.term) && !search.isLoading && !search.isError;
  const goTo = (s) => history.push(`${basePathOf(history)}/${s.route}`);
  const nextStep = navSteps[index + 1];

  return (
    <div className="npt-wrap">
      <GRBCrumbs t={t} />
      <GRBPageHead title={tt("GRB_MENU_NEW_REGISTRATION")} sub={tt("GRB_PAGE_SUB")}>
        <GRBInfoBar t={t} steps={navSteps} active={index} total={navSteps.length} autoOpen={true} />
      </GRBPageHead>
      <GRBStepper t={t} steps={navSteps} active={index} onGo={goTo} />
      <GRBPage>
        <section className="npt-card">
          <GRBTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt(step.head)}</h2>
            <p className="npt-card__hint">{tt(step.hint)}</p>

            <div className="grb-ps">
              <div className="grb-ps__modes" role="tablist" aria-label={tt("GRB_PS_FIND_BY")}>
                {MODES.map((m) => (
                  <button key={m.key} type="button" role="tab" aria-selected={mode === m.key} className={`npt-chip${mode === m.key ? " is-on" : ""}`} onClick={() => { setMode(m.key); setTerm(""); setSubmitted(null); setPicked(null); setErrors({}); }}>
                    {tt(m.label)}
                  </button>
                ))}
              </div>

              {mode === "mine" ? (
                <p className="grb-ps__hint">{tt("GRB_PS_MINE_HINT", { mobile: info.mobileNumber || "" })}</p>
              ) : (
                <form className="grb-ps__bar" onSubmit={(e) => { e.preventDefault(); run(); }}>
                  <div className={`npt-field${errors.term ? " has-error" : ""}`}>
                    <TextInput
                      name="psTerm"
                      value={term}
                      maxlength={modeDef.digits || 30}
                      placeholder={tt(modeDef.ph)}
                      onChange={(e) => { const v = e.target.value; setTerm(modeDef.digits ? v.replace(/\D/g, "") : v); setErrors({}); }}
                    />
                    {errors.term ? <CardLabelError>{tt(errors.term)}</CardLabelError> : null}
                  </div>
                  <GRBBtn kind="primary" icon="search" onClick={run}>{tt("GRB_PS_SEARCH")}</GRBBtn>
                </form>
              )}

              <div className="grb-ps__results" aria-live="polite">
                {!(criteria && criteria.term) ? (
                  <p className="grb-ps__hint">{tt(mode === "mine" ? "GRB_PS_NO_MOBILE" : "GRB_PS_ENTER_TERM")}</p>
                ) : searching ? (
                  <SevaLoader message={tt("GRB_PS_SEARCHING")} />
                ) : search.isError ? (
                  <div className="npt-lookup-error" role="alert">
                    <span>{apiErrorMessage(search.error, tt("GRB_PS_FAILED"))}</span>
                    <button type="button" className="npt-link" onClick={() => search.refetch()}>{tt("GRB_RETRY")}</button>
                  </div>
                ) : searched && results.length === 0 ? (
                  <div className="npt-empty">
                    <GRBIcon name="building" size={36} />
                    <strong>{tt("GRB_PS_EMPTY")}</strong>
                    <p>{tt("GRB_PS_EMPTY_HINT")}</p>
                  </div>
                ) : searched ? (
                  <ul className="grb-ps__list" role="listbox" aria-label={tt("GRB_PS_RESULTS")}>
                    {results.map((p) => {
                      const on = picked && picked.propertyId === p.propertyId;
                      const ex = (p.address && p.address.additionalDetails) || {};
                      return (
                        <li key={p.propertyId}>
                          <button type="button" role="option" aria-selected={!!on} className={`grb-ps__card${on ? " is-on" : ""}`} onClick={() => pick(p)}>
                            <span className="grb-ps__radio" aria-hidden="true">{on ? <GRBIcon name="check" size={14} /> : null}</span>
                            <span className="grb-ps__main">
                              <strong>{p.propertyId}</strong>
                              <span>{(p.owners || []).map((o) => o.name).filter(Boolean).join(", ") || "-"}</span>
                              <small>{propertyAddressOf(p) || "-"}</small>
                              <small>{[(p.tenantId || "").split(".")[1] && `${tt("GRB_F_ulbName")}: ${(p.tenantId || "").split(".")[1]}`, ex.wardNumber && `${tt("GRB_F_wardNumber")}: ${ex.wardNumber}`, ex.zone && `${tt("GRB_F_zone")}: ${ex.zone}`].filter(Boolean).join(" · ")}</small>
                            </span>
                            <span className={`npt-badge npt-badge--${p.status === "ACTIVE" ? "approved" : "progress"}`}>{statusLabel(tt, p.status)}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                {errors.pick ? <CardLabelError>{tt(errors.pick)}</CardLabelError> : null}
              </div>

              {picked ? (
                <div className="grb-ps__picked" role="status">
                  <GRBIcon name="check" size={18} />
                  <span>{tt("GRB_PS_PICKED", { id: picked.propertyId })}</span>
                </div>
              ) : null}

              <p className="grb-ps__register">
                {tt("GRB_PS_NOT_FOUND")}{" "}
                <Link to={GRB_REGISTER_PROPERTY_PATH} className="npt-link">{tt("GRB_PS_REGISTER_LINK")}</Link>
              </p>
            </div>
          </div>
        </section>
      </GRBPage>
      <GRBActions
        left={goBack ? <GRBBtn kind="ghost" onClick={goBack}>{tt("GRB_BTN_BACK")}</GRBBtn> : null}
        note={nextStep ? tt("GRB_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={<GRBBtn kind="primary" icon="arrow" onClick={onNext}>{tt("GRB_BTN_NEXT")}</GRBBtn>}
      />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </div>
  );
};

export default GRBProperty;
