import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { ntlText } from "../../../../config/newTLMessages";
import { NTLBtn, NTLCrumbs, NTLIcon } from "../../../../pageComponents/NewTL/NTLLayout";

// Acknowledgement after renew / modify / close was sent to the ULB.
const LifecycleAck = ({ t, mode, cfg, params, root, clearParams }) => {
  const tt = (k, p) => ntlText(t, k, p);
  const [copied, setCopied] = useState(false);
  const result = params && params._result;
  if (!result || !params._done) return <Redirect to={`${root}/my-registrations`} />;
  const copy = () => {
    try {
      navigator.clipboard && navigator.clipboard.writeText(result.applicationNumber).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (e) {
      setCopied(false);
    }
  };
  return (
    <div className="npt-wrap">
      <NTLCrumbs t={t} current={tt(cfg.title)} />
      <section className="npt-ack">
        <div className="npt-ack__banner">
          <span className="npt-ack__tick"><NTLIcon name="check" size={30} /></span>
          <div>
            <h1>{tt(`NTL_LC_ACK_${mode.toUpperCase()}`)}</h1>
            <p>{tt("NTL_LC_ACK_SUB")}</p>
          </div>
          <div className="npt-ack__id">
            <small>{tt("NTL_ACK_APP_NO")}</small>
            <strong>{result.applicationNumber}</strong>
            <button type="button" onClick={copy} aria-live="polite"><NTLIcon name="copy" size={16} /> {copied ? tt("NTL_COPIED") : tt("NTL_COPY_ID")}</button>
          </div>
        </div>
        <div className="npt-ack__grid">
          <section className="npt-side">
            <h2>{tt("NTL_ACK_NEXT_TITLE")}</h2>
            <div className="npt-ack__btns">
              <Link to={`${root}/my-registrations`} onClick={clearParams} className="npt-btn npt-btn--primary"><NTLIcon name="list" size={18} /><span>{tt("NTL_ACK_GO_APPS")}</span></Link>
              <Link to={`${root}/application/${encodeURIComponent(result.applicationNumber)}?tenantId=${encodeURIComponent(result.tenantId)}`} onClick={clearParams} className="npt-btn npt-btn--ghost"><span>{tt("NTL_LC_VIEW_APP")}</span></Link>
              <NTLBtn kind="ghost" icon="print" onClick={() => window.print()}>{tt("NTL_PRINT")}</NTLBtn>
            </div>
            <p className="npt-side__note">{tt("NTL_ACK_HINT")}</p>
          </section>
        </div>
      </section>
    </div>
  );
};

export default LifecycleAck;
