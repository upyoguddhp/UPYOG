import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useLocation, useRouteMatch } from "react-router-dom";
import { payText } from "../../config/payMessages";
import { PAYCrumbs, PAYGrid, PAYIcon, PAYPageHead } from "../../pageComponents/PayLayout";
import { PayApi, fmtTime, getUser, inr, paymentsOf, receiptNoOf } from "../../utils/pay";

const LOOK = {
  SUCCESS: { icon: "check", cls: "ok", title: "PAY_RESULT_SUCCESS", sub: "PAY_RESULT_SUCCESS_SUB" },
  FAILURE: { icon: "x", cls: "bad", title: "PAY_RESULT_FAILURE", sub: "PAY_RESULT_FAILURE_SUB" },
  PENDING: { icon: "clock", cls: "wait", title: "PAY_RESULT_PENDING", sub: "PAY_RESULT_PENDING_SUB" },
  CANCELLED: { icon: "x", cls: "bad", title: "PAY_RESULT_CANCELLED", sub: "PAY_DISMISSED" },
  ERROR: { icon: "alert", cls: "bad", title: "PAY_RESULT_FAILURE", sub: "PAY_CREATE_FAILED" },
};

// Outcome of a payment attempt. The state comes from the pay flow; a refresh drops it.
const PayResult = () => {
  const { t } = useTranslation();
  const tt = (k, p) => payText(t, k, p);
  const { state } = useLocation();
  const root = useRouteMatch().url.replace(/\/result\/?$/, "");
  const user = useMemo(getUser, []);
  const look = state && LOOK[state.status];
  const codes = ((state && state.rows) || []).map((r) => r.consumerCode).filter(Boolean);

  // on success, find the receipt the collection service issued for these consumer codes
  const receipt = useQuery(
    ["PAY_RESULT_RECEIPT", state && state.txnId],
    async () => {
      const list = paymentsOf(await PayApi.searchPayments(user, { consumerCodes: codes.join(","), limit: 5 }));
      return list.sort((a, b) => (b.transactionDate || 0) - (a.transactionDate || 0))[0] || null;
    },
    { enabled: !!(state && state.status === "SUCCESS" && codes.length), refetchOnWindowFocus: false, retry: 2, retryDelay: 3000 }
  );

  if (!look) {
    return (
      <div className="npt-wrap">
        <PAYCrumbs t={t} current={tt("PAY_CRUMB_RESULT")} middle={{ to: `${root}/dues`, label: tt("PAY_CRUMB_DUES") }} />
        <PAYPageHead title={tt("PAY_RESULT_TITLE")} />
        <div className="npt-empty">
          <PAYIcon name="alert" size={40} />
          <strong>{tt("PAY_RESULT_NONE")}</strong>
          <Link to={`${root}/dues`} className="npt-btn npt-btn--primary"><span>{tt("PAY_BACK_DUES")}</span></Link>
        </div>
      </div>
    );
  }
  const rn = receipt.data ? receiptNoOf(receipt.data) : "";
  return (
    <div className="npt-wrap npt-printview">
      <PAYCrumbs t={t} current={tt("PAY_CRUMB_RESULT")} middle={{ to: `${root}/dues`, label: tt("PAY_CRUMB_DUES") }} />
      <section className={`npt-card pay-result pay-result--${look.cls}`} role="status">
        <span className="pay-result__ico"><PAYIcon name={look.icon} size={34} /></span>
        <h1>{tt(look.title)}</h1>
        <p>{state.message || tt(look.sub)}</p>
        <PAYGrid rows={[
          [tt("PAY_AMOUNT"), state.amount ? inr(state.amount) : ""],
          [tt("PAY_TXN_ID"), state.txnId],
          [tt("PAY_CONSUMER"), codes.join(", ")],
          [tt("PAY_PAID_ON"), state.status === "SUCCESS" ? fmtTime(Date.now()) : ""],
        ].filter((r) => r[1])} />
        {state.status === "SUCCESS" && receipt.isLoading ? <SevaLoader message={tt("PAY_CONFIRMING")} /> : null}
        <div className="pay-result__actions">
          {rn ? <Link to={`${root}/receipt/${encodeURIComponent(rn)}`} className="npt-btn npt-btn--primary"><PAYIcon name="receipt" size={18} /><span>{tt("PAY_VIEW_RECEIPT")}</span></Link> : null}
          {state.status === "SUCCESS" || state.status === "PENDING" ? <Link to={`${root}/history`} className="npt-btn npt-btn--ghost"><span>{tt("PAY_GO_HISTORY")}</span></Link> : <Link to={`${root}/dues`} className="npt-btn npt-btn--primary"><span>{tt("PAY_TRY_AGAIN")}</span></Link>}
          {state.status === "SUCCESS" ? <Link to={`${root}/dues`} className="npt-btn npt-btn--ghost"><span>{tt("PAY_BACK_DUES")}</span></Link> : null}
        </div>
      </section>
    </div>
  );
};

export default PayResult;
