import { Toast } from "@upyog/digit-ui-react-components";
import React from "react";
import { Link } from "react-router-dom";
import { NTL_TYPE_KEYS } from "../../../../config/newTLConfig";
import { ntlText } from "../../../../config/newTLMessages";
import { NTLActions, NTLBtn, NTLCrumbs, NTLPage, NTLPageHead, NTLTricolour } from "../../../../pageComponents/NewTL/NTLLayout";

const fmt = (ms) => (ms ? new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-");
const humanise = (s = "") => String(s).replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

// First screen of renew / modify / close: what will happen, then an explicit confirm.
const LifecycleStart = ({ t, mode, cfg, row, resume, viewLink, onContinue, error, onClearError }) => {
  const tt = (k, p) => ntlText(t, k, p);
  const M = mode.toUpperCase();
  const rows = [
    [tt("NTL_VIEW_APPNO"), row.applicationNumber],
    [tt("NTL_F_businessName"), row.tradeName],
    [tt("NTL_LC_TYPE"), tt(NTL_TYPE_KEYS[row.applicationType] || "NTL_TYPE_NEW")],
    [tt("NTL_VIEW_STATUS"), t(`WF_NEWTL_${row.status}`, { defaultValue: humanise(row.status) })],
    [tt("NTL_LC_VALID_TILL"), fmt(row.validTo)],
  ];
  return (
    <div className="npt-wrap">
      <NTLCrumbs t={t} current={tt(cfg.title)} />
      <NTLPageHead title={tt(cfg.title)} sub={tt(`NTL_LC_${M}_SUB`)} />
      <NTLPage>
        <section className="npt-card">
          <NTLTricolour />
          <div className="npt-card__body">
            <dl className="npt-review-grid">
              {rows.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v || "-"}</dd></div>
              ))}
            </dl>
            <h3 className="npt-section__title">{tt("NTL_LC_CONFIRM_TITLE")}</h3>
            <ul className="npt-review-docs">
              {[1, 2, 3].map((n) => <li key={n}>{tt(`NTL_LC_${M}_P${n}`)}</li>)}
            </ul>
            {mode === "close" ? <div className="npt-lookup-error" role="alert">{tt("NTL_LC_CLOSE_WARN")}</div> : null}
          </div>
        </section>
      </NTLPage>
      <NTLActions
        left={<Link to={viewLink} className="npt-btn npt-btn--ghost"><span>{tt("NTL_LC_CANCEL")}</span></Link>}
        right={<NTLBtn kind="primary" icon="arrow" onClick={onContinue}>{mode === "close" ? tt("NTL_LC_CONFIRM_CLOSE") : resume ? tt(`NTL_LC_BTN_CONTINUE_${M}`) : tt("NTL_LC_CONTINUE")}</NTLBtn>}
      />
      {error ? <Toast error={true} label={error} onClose={onClearError} /> : null}
    </div>
  );
};

export default LifecycleStart;
