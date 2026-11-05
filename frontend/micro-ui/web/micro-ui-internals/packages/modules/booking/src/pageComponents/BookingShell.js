import React from "react";
import { useHistory } from "react-router-dom";
import { BKG_SERVICES } from "../config/bookingConfig";
import { bkgText } from "../config/bookingMessages";
import { BKGActions, BKGBtn, BKGCrumbs, BKGInfoBar, BKGPage, BKGPageHead, BKGStepper, BKGTricolour } from "./BookingLayout";

// step pages live at <module>/<svc>/new/<route>
export const basePathOf = (history) => history.location.pathname.replace(/\/[^/]+\/?$/, "");

export const navStepsOf = (svc) => [...BKG_SERVICES[svc].pages, { key: "review", route: "check", head: "BKG_STEP_REVIEW" }];

// Common frame of every step: crumbs, title, stepper, one card and the Back / Next bar.
const BookingShell = ({ t, svc, pageKey, children, onNext, onBack, nextLabel, nextIcon = "arrow", aside, autoOpen }) => {
  const history = useHistory();
  const tt = (k, p) => bkgText(t, k, p);
  const cfg = BKG_SERVICES[svc];
  const navSteps = navStepsOf(svc);
  const index = Math.max(0, navSteps.findIndex((s) => s.key === pageKey));
  const page = navSteps[index];
  const nextStep = navSteps[index + 1];
  return (
    <div className="npt-wrap">
      <BKGCrumbs t={t} svc={svc} />
      <BKGPageHead title={tt(cfg.title)} sub={tt("BKG_PAGE_SUB")}>
        <BKGInfoBar t={t} svc={svc} steps={navSteps} active={index} total={navSteps.length} autoOpen={!!autoOpen} />
      </BKGPageHead>
      <BKGStepper t={t} steps={navSteps} active={index} onGo={(s) => history.push(`${basePathOf(history)}/${s.route}`)} />
      <BKGPage aside={aside}>
        <section className="npt-card">
          <BKGTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt(page.head)}</h2>
            {page.hint ? <p className="npt-card__hint">{tt(page.hint)}</p> : null}
            {children}
          </div>
        </section>
      </BKGPage>
      <BKGActions
        left={index > 0 ? <BKGBtn kind="ghost" onClick={onBack || (() => history.goBack())}>{tt("BKG_BTN_BACK")}</BKGBtn> : null}
        note={nextStep && onNext ? tt("BKG_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={onNext ? <BKGBtn kind="primary" icon={nextIcon} onClick={onNext}>{nextLabel || tt("BKG_BTN_NEXT")}</BKGBtn> : null}
      />
    </div>
  );
};

export default BookingShell;
