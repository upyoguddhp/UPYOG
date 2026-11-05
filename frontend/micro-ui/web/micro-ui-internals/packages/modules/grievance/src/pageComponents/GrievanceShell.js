import React from "react";
import { useHistory } from "react-router-dom";
import { GRV_PAGES } from "../config/grievanceConfig";
import { grvText } from "../config/grievanceMessages";
import { GRVActions, GRVBtn, GRVCrumbs, GRVInfoBar, GRVPage, GRVPageHead, GRVStepper, GRVTricolour } from "./GrievanceLayout";

// step pages live at <module>/new/<route>
export const basePathOf = (history) => history.location.pathname.replace(/\/[^/]+\/?$/, "");

export const NAV_STEPS = [...GRV_PAGES, { key: "review", route: "check", head: "GRV_STEP_REVIEW" }];

// Common frame of every step: crumbs, title, stepper, one card and the Back / Next bar.
const GrievanceShell = ({ t, pageKey, children, onNext, onBack, nextLabel, nextIcon = "arrow", autoOpen }) => {
  const history = useHistory();
  const tt = (k, p) => grvText(t, k, p);
  const index = Math.max(0, NAV_STEPS.findIndex((s) => s.key === pageKey));
  const page = NAV_STEPS[index];
  const nextStep = NAV_STEPS[index + 1];
  return (
    <div className="npt-wrap">
      <GRVCrumbs t={t} />
      <GRVPageHead title={tt("GRV_TITLE")} sub={tt("GRV_PAGE_SUB")}>
        <GRVInfoBar t={t} steps={NAV_STEPS} active={index} total={NAV_STEPS.length} autoOpen={!!autoOpen} />
      </GRVPageHead>
      <GRVStepper t={t} steps={NAV_STEPS} active={index} onGo={(s) => history.push(`${basePathOf(history)}/${s.route}`)} />
      <GRVPage>
        <section className="npt-card">
          <GRVTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt(page.head)}</h2>
            {page.hint ? <p className="npt-card__hint">{tt(page.hint)}</p> : null}
            {children}
          </div>
        </section>
      </GRVPage>
      <GRVActions
        left={index > 0 ? <GRVBtn kind="ghost" onClick={onBack || (() => history.goBack())}>{tt("GRV_BTN_BACK")}</GRVBtn> : null}
        note={nextStep && onNext ? tt("GRV_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={onNext ? <GRVBtn kind="primary" icon={nextIcon} onClick={onNext}>{nextLabel || tt("GRV_BTN_NEXT")}</GRVBtn> : null}
      />
    </div>
  );
};

export default GrievanceShell;
