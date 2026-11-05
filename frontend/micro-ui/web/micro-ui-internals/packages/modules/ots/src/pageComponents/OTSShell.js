import React from "react";
import { useHistory } from "react-router-dom";
import { OTS_NAV_STEPS } from "../config/otsConfig";
import { otsText } from "../config/otsMessages";
import { OTSActions, OTSBtn, OTSCrumbs, OTSInfoBar, OTSPage, OTSPageHead, OTSStepper, OTSTricolour } from "./OTSLayout";

// step pages live at <module>/new/<route>
export const basePathOf = (history) => history.location.pathname.replace(/\/[^/]+\/?$/, "");

// Common frame of every step: crumbs, title, stepper, one card and the Back / Next bar.
const OTSShell = ({ t, pageKey, children, onNext, onBack, nextLabel, nextIcon = "arrow", aside, autoOpen }) => {
  const history = useHistory();
  const tt = (k, p) => otsText(t, k, p);
  const index = Math.max(0, OTS_NAV_STEPS.findIndex((s) => s.key === pageKey));
  const page = OTS_NAV_STEPS[index];
  const nextStep = OTS_NAV_STEPS[index + 1];
  return (
    <div className="npt-wrap">
      <OTSCrumbs t={t} />
      <OTSPageHead title={tt("OTS_TITLE")} sub={tt("OTS_PAGE_SUB")}>
        <OTSInfoBar t={t} steps={OTS_NAV_STEPS} active={index} total={OTS_NAV_STEPS.length} autoOpen={!!autoOpen} />
      </OTSPageHead>
      <OTSStepper t={t} steps={OTS_NAV_STEPS} active={index} onGo={(s) => history.push(`${basePathOf(history)}/${s.route}`)} />
      <OTSPage aside={aside}>
        <section className="npt-card">
          <OTSTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt(page.head)}</h2>
            {page.hint ? <p className="npt-card__hint">{tt(page.hint)}</p> : null}
            {children}
          </div>
        </section>
      </OTSPage>
      <OTSActions
        left={index > 0 ? <OTSBtn kind="ghost" onClick={onBack || (() => history.goBack())}>{tt("OTS_BTN_BACK")}</OTSBtn> : null}
        note={nextStep && onNext ? tt("OTS_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={onNext ? <OTSBtn kind="primary" icon={nextIcon} onClick={onNext}>{nextLabel || tt("OTS_BTN_NEXT")}</OTSBtn> : null}
      />
    </div>
  );
};

export default OTSShell;
