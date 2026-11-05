import React from "react";
import { useHistory } from "react-router-dom";
import { HNC_PAGES } from "../config/hpnocConfig";
import { rqsText } from "../config/hpnocMessages";
import { HNCActions, HNCBtn, HNCCrumbs, HNCInfoBar, HNCPage, HNCPageHead, HNCStepper, HNCTricolour } from "./HpnocLayout";

// step pages live at <module>/new/<route>
export const basePathOf = (history) => history.location.pathname.replace(/\/[^/]+\/?$/, "");

export const NAV_STEPS = [...HNC_PAGES, { key: "review", route: "check", head: "HNC_STEP_REVIEW" }];

// Common frame of every step: crumbs, title, stepper, one card and the Back / Next bar.
const HpnocShell = ({ t, pageKey, children, onNext, onBack, nextLabel, nextIcon = "arrow", autoOpen }) => {
  const history = useHistory();
  const tt = (k, p) => rqsText(t, k, p);
  const index = Math.max(0, NAV_STEPS.findIndex((s) => s.key === pageKey));
  const page = NAV_STEPS[index];
  const nextStep = NAV_STEPS[index + 1];
  return (
    <div className="npt-wrap">
      <HNCCrumbs t={t} />
      <HNCPageHead title={tt("HNC_TITLE")} sub={tt("HNC_PAGE_SUB")}>
        <HNCInfoBar t={t} steps={NAV_STEPS} active={index} total={NAV_STEPS.length} autoOpen={!!autoOpen} />
      </HNCPageHead>
      <HNCStepper t={t} steps={NAV_STEPS} active={index} onGo={(s) => history.push(`${basePathOf(history)}/${s.route}`)} />
      <HNCPage>
        <section className="npt-card">
          <HNCTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt(page.head)}</h2>
            {page.hint ? <p className="npt-card__hint">{tt(page.hint)}</p> : null}
            {children}
          </div>
        </section>
      </HNCPage>
      <HNCActions
        left={index > 0 ? <HNCBtn kind="ghost" onClick={onBack || (() => history.goBack())}>{tt("HNC_BTN_BACK")}</HNCBtn> : null}
        note={nextStep && onNext ? tt("HNC_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={onNext ? <HNCBtn kind="primary" icon={nextIcon} onClick={onNext}>{nextLabel || tt("HNC_BTN_NEXT")}</HNCBtn> : null}
      />
    </div>
  );
};

export default HpnocShell;
