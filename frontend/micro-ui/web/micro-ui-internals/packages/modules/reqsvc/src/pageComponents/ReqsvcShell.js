import React from "react";
import { useHistory } from "react-router-dom";
import { RQS_PAGES } from "../config/reqsvcConfig";
import { rqsText } from "../config/reqsvcMessages";
import { RQSActions, RQSBtn, RQSCrumbs, RQSInfoBar, RQSPage, RQSPageHead, RQSStepper, RQSTricolour } from "./ReqsvcLayout";

// step pages live at <module>/new/<route>
export const basePathOf = (history) => history.location.pathname.replace(/\/[^/]+\/?$/, "");

export const NAV_STEPS = [...RQS_PAGES, { key: "review", route: "check", head: "RQS_STEP_REVIEW" }];

// Common frame of every step: crumbs, title, stepper, one card and the Back / Next bar.
const ReqsvcShell = ({ t, pageKey, children, onNext, onBack, nextLabel, nextIcon = "arrow", autoOpen }) => {
  const history = useHistory();
  const tt = (k, p) => rqsText(t, k, p);
  const index = Math.max(0, NAV_STEPS.findIndex((s) => s.key === pageKey));
  const page = NAV_STEPS[index];
  const nextStep = NAV_STEPS[index + 1];
  return (
    <div className="npt-wrap">
      <RQSCrumbs t={t} />
      <RQSPageHead title={tt("RQS_TITLE")} sub={tt("RQS_PAGE_SUB")}>
        <RQSInfoBar t={t} steps={NAV_STEPS} active={index} total={NAV_STEPS.length} autoOpen={!!autoOpen} />
      </RQSPageHead>
      <RQSStepper t={t} steps={NAV_STEPS} active={index} onGo={(s) => history.push(`${basePathOf(history)}/${s.route}`)} />
      <RQSPage>
        <section className="npt-card">
          <RQSTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt(page.head)}</h2>
            {page.hint ? <p className="npt-card__hint">{tt(page.hint)}</p> : null}
            {children}
          </div>
        </section>
      </RQSPage>
      <RQSActions
        left={index > 0 ? <RQSBtn kind="ghost" onClick={onBack || (() => history.goBack())}>{tt("RQS_BTN_BACK")}</RQSBtn> : null}
        note={nextStep && onNext ? tt("RQS_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={onNext ? <RQSBtn kind="primary" icon={nextIcon} onClick={onNext}>{nextLabel || tt("RQS_BTN_NEXT")}</RQSBtn> : null}
      />
    </div>
  );
};

export default ReqsvcShell;
