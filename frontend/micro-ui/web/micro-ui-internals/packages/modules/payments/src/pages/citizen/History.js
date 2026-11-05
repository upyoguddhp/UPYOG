import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useRouteMatch } from "react-router-dom";
import { payText } from "../../config/payMessages";
import { PAYCrumbs, PAYError, PAYIcon, PAYPageHead, PAYTabs } from "../../pageComponents/PayLayout";
import SearchSelect from "../../pageComponents/SearchSelect";
import { PAY_SERVICES, PayApi, apiErrorMessage, consumerCodesOf, fmtTime, getUser, humanise, inr, paymentsOf, receiptNoOf, serviceOf, serviceOfPayment, ulbOf } from "../../utils/pay";

const PAGE = 20;
export const statusLabel = (tt, s) => (s ? (tt(`PAY_ST_${s}`) !== `PAY_ST_${s}` ? tt(`PAY_ST_${s}`) : humanise(s)) : "");

// Every payment recorded against the citizen's mobile number, newest first.
const History = () => {
  const { t } = useTranslation();
  const tt = (k, p) => payText(t, k, p);
  const root = useRouteMatch().url.replace(/\/history\/?$/, "");
  const user = useMemo(getUser, []);
  const [service, setService] = useState("");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);

  const { data, isLoading, isError, error, refetch } = useQuery(["PAY_HISTORY", user.mobileNumber], () => PayApi.searchPayments(user, { limit: 500 }), { refetchOnWindowFocus: false, retry: 1 });
  const all = useMemo(() => [...paymentsOf(data)].sort((a, b) => (b.transactionDate || 0) - (a.transactionDate || 0)), [data]);
  const options = PAY_SERVICES.filter((s) => all.some((p) => serviceOfPayment(p) === s.code)).map((s) => ({ value: s.code, label: tt(s.key) }));
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((p) => (!service || serviceOfPayment(p) === service) && (!term || [receiptNoOf(p), consumerCodesOf(p).join(" "), ulbOf(p.tenantId)].join(" ").toLowerCase().includes(term)));
  }, [all, service, q]);

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("PAY_LOADING_HISTORY")} /></div>;
  return (
    <div className="npt-wrap pay-wrap">
      <PAYCrumbs t={t} current={tt("PAY_CRUMB_HISTORY")} />
      <PAYPageHead title={tt("PAY_HISTORY_TITLE")} sub={tt("PAY_HISTORY_SUB")} />
      <PAYTabs t={t} active="history" root={root} />
      {isError ? (
        <PAYError t={t} message={apiErrorMessage(error, tt("PAY_HISTORY_FAILED"))} onRetry={() => refetch()} />
      ) : all.length === 0 ? (
        <div className="npt-empty">
          <PAYIcon name="receipt" size={40} />
          <strong>{tt("PAY_HISTORY_EMPTY")}</strong>
          <p>{tt("PAY_HISTORY_EMPTY_SUB")}</p>
          <Link to={`${root}/dues`} className="npt-btn npt-btn--primary"><span>{tt("PAY_BACK_DUES")}</span></Link>
        </div>
      ) : (
        <React.Fragment>
          <div className="bkg-filters">
            <div className="bkg-field">
              <span>{tt("PAY_FILTER_SERVICE")}</span>
              <SearchSelect value={service} options={options} onChange={(v) => { setService(v); setShown(PAGE); }} allLabel={tt("PAY_ALL")} searchPlaceholder={tt("PAY_SEARCH_LIST")} emptyLabel={tt("PAY_NO_RESULTS")} ariaLabel={tt("PAY_FILTER_SERVICE")} />
            </div>
            <label className="npt-search bkg-filters__search">
              <PAYIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("PAY_HISTORY_SEARCH_PH")} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} aria-label={tt("PAY_HISTORY_SEARCH_PH")} />
            </label>
          </div>
          {list.length === 0 ? (
            <div className="npt-empty">
              <PAYIcon name="search" size={40} />
              <strong>{tt("PAY_NO_RESULTS")}</strong>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => { setQ(""); setService(""); }}><span>{tt("PAY_CLEAR_FILTERS")}</span></button>
            </div>
          ) : (
            <ul className="npt-prop-list">
              {list.slice(0, shown).map((p) => {
                const rn = receiptNoOf(p);
                const svc = serviceOfPayment(p);
                return (
                  <li className="npt-prop is-approved" key={p.id}>
                    <span className="npt-prop__ico"><PAYIcon name="receipt" size={22} /></span>
                    <div className="npt-prop__main">
                      <strong>{rn || p.transactionNumber}</strong>
                      <span>{[svc ? (serviceOf(svc).key ? tt(serviceOf(svc).key) : serviceOf(svc).label) : "", consumerCodesOf(p).join(", ")].filter(Boolean).join(" · ")}</span>
                      <small>{[inr(p.totalAmountPaid), fmtTime(p.transactionDate), ulbOf(p.tenantId), humanise(p.paymentMode)].filter(Boolean).join(" · ")}</small>
                    </div>
                    <span className="npt-badge npt-badge--approved">{statusLabel(tt, p.paymentStatus)}</span>
                    {rn ? <Link className="npt-btn npt-btn--ghost" to={`${root}/receipt/${encodeURIComponent(rn)}`}><span>{tt("PAY_VIEW_RECEIPT")}</span></Link> : null}
                  </li>
                );
              })}
            </ul>
          )}
          {list.length > shown ? <div className="bkg-more"><button type="button" className="npt-btn npt-btn--ghost" onClick={() => setShown(shown + PAGE)}><span>{tt("PAY_SHOW_MORE")}</span></button></div> : null}
        </React.Fragment>
      )}
    </div>
  );
};

export default History;
