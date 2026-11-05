import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useParams, useRouteMatch } from "react-router-dom";
import { payText } from "../../config/payMessages";
import { PAYBtn, PAYCrumbs, PAYError, PAYGrid, PAYPageHead } from "../../pageComponents/PayLayout";
import { PayApi, apiErrorMessage, asArray, consumerCodesOf, fmtDate, fmtTime, getUser, humanise, inr, paymentsOf, receiptNoOf, serviceOf, serviceOfPayment, ulbOf } from "../../utils/pay";

// One receipt: summary of the payment and what it paid for, printable.
const ReceiptView = () => {
  const { t } = useTranslation();
  const tt = (k, p) => payText(t, k, p);
  const { receiptNumber } = useParams();
  const rn = decodeURIComponent(receiptNumber);
  const root = useRouteMatch().url.replace(/\/receipt\/.*$/, "");
  const user = useMemo(getUser, []);

  const { data, isLoading, isError, error, refetch } = useQuery(["PAY_RECEIPT", rn], () => PayApi.searchPayments(user, { receiptNumbers: rn }), { refetchOnWindowFocus: false, retry: 1 });
  const p = paymentsOf(data).find((x) => receiptNoOf(x) === rn) || paymentsOf(data)[0];
  const crumbs = <PAYCrumbs t={t} current={rn} middle={{ to: `${root}/history`, label: tt("PAY_CRUMB_HISTORY") }} />;

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("PAY_LOADING_HISTORY")} /></div>;
  if (isError || !p) {
    return (
      <div className="npt-wrap">
        {crumbs}
        <PAYPageHead title={tt("PAY_RECEIPT_TITLE")} sub={rn} />
        <PAYError t={t} message={isError ? apiErrorMessage(error, tt("PAY_RECEIPT_FAILED")) : tt("PAY_RECEIPT_NOTFOUND")} onRetry={isError ? () => refetch() : null} />
      </div>
    );
  }
  const detail = asArray(p.paymentDetails)[0] || {};
  const bill = detail.bill || {};
  const svc = serviceOfPayment(p);
  const lines = asArray(p.paymentDetails).map((d) => ({ code: (d.bill || {}).consumerCode, receipt: d.receiptNumber, paid: d.totalAmountPaid, svc: d.businessService, billNo: (d.bill || {}).billNumber }));

  return (
    <div className="npt-wrap npt-printview">
      {crumbs}
      <PAYPageHead title={tt("PAY_RECEIPT_TITLE")} sub={rn}>
        <PAYBtn kind="ghost" icon="print" onClick={() => window.print()}>{tt("PAY_PRINT")}</PAYBtn>
      </PAYPageHead>
      <section className="npt-card bkg-pane">
        <h3>{tt("PAY_RECEIPT_TITLE")}</h3>
        <PAYGrid rows={[
          [tt("PAY_RECEIPT_NO"), rn],
          [tt("PAY_RECEIPT_DATE"), fmtDate(detail.receiptDate || p.transactionDate)],
          [tt("PAY_PAID_ON"), fmtTime(p.transactionDate)],
          [tt("PAY_SERVICE"), svc ? (serviceOf(svc).key ? tt(serviceOf(svc).key) : serviceOf(svc).label) : ""],
          [tt("PAY_ULB"), ulbOf(p.tenantId)],
          [tt("PAY_PAID"), inr(p.totalAmountPaid)],
          [tt("PAY_MODE"), humanise(p.paymentMode)],
          [tt("PAY_INSTRUMENT"), p.instrumentNumber || p.transactionNumber],
          [tt("PAY_PAYER"), bill.payerName || p.payerName || user.name],
          [tt("PAY_PAYER_MOBILE"), p.mobileNumber || bill.mobileNumber || user.mobileNumber],
        ]} />
      </section>
      <section className="npt-card bkg-pane">
        <h3>{tt("PAY_BILL_LINES")}</h3>
        <ul className="pay-lines">
          {lines.map((l, i) => (
            <li key={`${l.code}-${i}`}>
              <span><strong>{l.code}</strong><small>{[l.svc ? (serviceOf(l.svc).key ? tt(serviceOf(l.svc).key) : serviceOf(l.svc).label) : "", l.billNo ? `${tt("PAY_BILL_NO")} ${l.billNo}` : "", l.receipt].filter(Boolean).join(" · ")}</small></span>
              <b>{inr(l.paid)}</b>
            </li>
          ))}
        </ul>
        <p className="npt-card__hint">{tt("PAY_RECEIPT_NOTE")}</p>
      </section>
      <p className="bkg-back"><Link to={`${root}/history`} className="npt-btn npt-btn--ghost"><span>{tt("PAY_RECEIPT_BACK")}</span></Link></p>
    </div>
  );
};

export default ReceiptView;
