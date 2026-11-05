import { CardLabelError, SevaLoader, TextInput, Toast } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Link, useHistory } from "react-router-dom";
import { NEW_TL_STEPS, NTL_PAGES } from "../../config/newTLConfig";
import { ntlText } from "../../config/newTLMessages";
import { apiErrorMessage, propertyAddressOf, propertyToSelection } from "../../utils/newTL";
import { NTLActions, NTLBtn, NTLCrumbs, NTLIcon, NTLInfoBar, NTLPage, NTLPageHead, NTLStepper, NTLTricolour } from "./NTLLayout";

export const NTL_REGISTER_PROPERTY_PATH = "/digit-ui/citizen/property/new-registration";

// search modes: how the citizen looks the property up
const MODES = [
  { key: "mine", label: "NTL_PS_MODE_MINE" },
  { key: "propertyIds", label: "NTL_PS_MODE_ID", ph: "NTL_PS_PH_ID" },
  { key: "mobileNumber", label: "NTL_PS_MODE_MOBILE", ph: "NTL_PS_PH_MOBILE", digits: 10 },
  { key: "oldpropertyids", label: "NTL_PS_MODE_OLD", ph: "NTL_PS_PH_OLD" },
];

const basePathOf = (history) => history.location.pathname.replace(/\/[^/]+\/?$/, "");

const statusLabel = (tt, s) => (s === "ACTIVE" ? tt("NTL_PS_STATUS_ACTIVE") : s === "INACTIVE" ? tt("NTL_PS_STATUS_INACTIVE") : tt("NTL_PS_STATUS_PROGRESS"));

/**
 * Step 1: find and pick the property the trade runs from. Search is scoped to one ULB tenant,
 * so District + ULB come first. Result cards are selectable; choosing one prefills location + owner.
 */
const NTLProperty = ({ t, onSelect, formData = {}, goBack }) => {
  const history = useHistory();
  const tt = (k, p) => ntlText(t, k, p);
  const step = NEW_TL_STEPS.find((s) => s.custom === "property");
  const steps = NTL_PAGES;
  const index = steps.findIndex((s) => s.key === step.key);
  const navSteps = [...steps, { key: "review", route: "check", head: "NTL_STEP_REVIEW" }];
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
    ["NTL_PROPERTY_SEARCH", tenantId, criteria && criteria.mode, criteria && criteria.term],
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
    if (!v) return setErrors({ term: "NTL_E_REQUIRED" });
    if (modeDef.digits && !/^[6-9]\d{9}$/.test(v)) return setErrors({ term: "NTL_E_MOBILE" });
    setErrors({});
    setPicked(null);
    setSubmitted({ mode, term: v });
  };

  const onNext = () => {
    if (!picked) {
      setErrors({ pick: "NTL_PS_E_PICK" });
      setToast({ error: true, label: tt("NTL_PS_E_PICK") });
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
      <NTLCrumbs t={t} />
      <NTLPageHead title={tt("NTL_MENU_NEW_REGISTRATION")} sub={tt("NTL_PAGE_SUB")}>
        <NTLInfoBar t={t} steps={navSteps} active={index} total={navSteps.length} autoOpen={true} />
      </NTLPageHead>
      <NTLStepper t={t} steps={navSteps} active={index} onGo={goTo} />
      <NTLPage>
        <section className="npt-card">
          <NTLTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt(step.head)}</h2>
            <p className="npt-card__hint">{tt(step.hint)}</p>

            <div className="ntl-ps">
              <div className="ntl-ps__modes" role="tablist" aria-label={tt("NTL_PS_FIND_BY")}>
                {MODES.map((m) => (
                  <button key={m.key} type="button" role="tab" aria-selected={mode === m.key} className={`npt-chip${mode === m.key ? " is-on" : ""}`} onClick={() => { setMode(m.key); setTerm(""); setSubmitted(null); setPicked(null); setErrors({}); }}>
                    {tt(m.label)}
                  </button>
                ))}
              </div>

              {mode === "mine" ? (
                <p className="ntl-ps__hint">{tt("NTL_PS_MINE_HINT", { mobile: info.mobileNumber || "" })}</p>
              ) : (
                <form className="ntl-ps__bar" onSubmit={(e) => { e.preventDefault(); run(); }}>
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
                  <NTLBtn kind="primary" icon="search" onClick={run}>{tt("NTL_PS_SEARCH")}</NTLBtn>
                </form>
              )}

              <div className="ntl-ps__results" aria-live="polite">
                {!(criteria && criteria.term) ? (
                  <p className="ntl-ps__hint">{tt(mode === "mine" ? "NTL_PS_NO_MOBILE" : "NTL_PS_ENTER_TERM")}</p>
                ) : searching ? (
                  <SevaLoader message={tt("NTL_PS_SEARCHING")} />
                ) : search.isError ? (
                  <div className="npt-lookup-error" role="alert">
                    <span>{apiErrorMessage(search.error, tt("NTL_PS_FAILED"))}</span>
                    <button type="button" className="npt-link" onClick={() => search.refetch()}>{tt("NTL_RETRY")}</button>
                  </div>
                ) : searched && results.length === 0 ? (
                  <div className="npt-empty">
                    <NTLIcon name="building" size={36} />
                    <strong>{tt("NTL_PS_EMPTY")}</strong>
                    <p>{tt("NTL_PS_EMPTY_HINT")}</p>
                  </div>
                ) : searched ? (
                  <ul className="ntl-ps__list" role="listbox" aria-label={tt("NTL_PS_RESULTS")}>
                    {results.map((p) => {
                      const on = picked && picked.propertyId === p.propertyId;
                      const ex = (p.address && p.address.additionalDetails) || {};
                      return (
                        <li key={p.propertyId}>
                          <button type="button" role="option" aria-selected={!!on} className={`ntl-ps__card${on ? " is-on" : ""}`} onClick={() => pick(p)}>
                            <span className="ntl-ps__radio" aria-hidden="true">{on ? <NTLIcon name="check" size={14} /> : null}</span>
                            <span className="ntl-ps__main">
                              <strong>{p.propertyId}</strong>
                              <span>{(p.owners || []).map((o) => o.name).filter(Boolean).join(", ") || "-"}</span>
                              <small>{propertyAddressOf(p) || "-"}</small>
                              <small>{[(p.tenantId || "").split(".")[1] && `${tt("NTL_F_ulbName")}: ${(p.tenantId || "").split(".")[1]}`, ex.wardNumber && `${tt("NTL_F_wardNumber")}: ${ex.wardNumber}`, ex.zone && `${tt("NTL_F_zone")}: ${ex.zone}`].filter(Boolean).join(" · ")}</small>
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
                <div className="ntl-ps__picked" role="status">
                  <NTLIcon name="check" size={18} />
                  <span>{tt("NTL_PS_PICKED", { id: picked.propertyId })}</span>
                </div>
              ) : null}

              <p className="ntl-ps__register">
                {tt("NTL_PS_NOT_FOUND")}{" "}
                <Link to={NTL_REGISTER_PROPERTY_PATH} className="npt-link">{tt("NTL_PS_REGISTER_LINK")}</Link>
              </p>
            </div>
          </div>
        </section>
      </NTLPage>
      <NTLActions
        left={goBack ? <NTLBtn kind="ghost" onClick={goBack}>{tt("NTL_BTN_BACK")}</NTLBtn> : null}
        note={nextStep ? tt("NTL_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={<NTLBtn kind="primary" icon="arrow" onClick={onNext}>{tt("NTL_BTN_NEXT")}</NTLBtn>}
      />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </div>
  );
};

export default NTLProperty;
