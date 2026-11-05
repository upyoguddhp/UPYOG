import React from "react";
import { Link, Redirect, useRouteMatch } from "react-router-dom";
import { grbText } from "../../../config/newGRBMessages";
import { GRBBtn, GRBCrumbs, GRBIcon } from "../../../pageComponents/NewGRB/GRBLayout";

// Shown after a modification is forwarded to the ULB verifier.
const ModifyAcknowledgement = ({ params, clearParams, t }) => {
  const match = useRouteMatch();
  const tt = (k, p) => grbText(t, k, p);
  const appNo = params && params._appNo;
  const root = match.path.replace(/\/modify\/.*$/, "");
  if (!appNo) return <Redirect to={`${root}/my-registrations`} />;
  return (
    <div className="npt-wrap">
      <GRBCrumbs t={t} current={tt("GRB_LC_MODIFY_ACK_TITLE")} />
      <section className="npt-ack">
        <div className="npt-ack__banner">
          <span className="npt-ack__tick"><GRBIcon name="check" size={30} /></span>
          <div>
            <h1>{tt("GRB_LC_MODIFY_ACK_TITLE")}</h1>
            <p>{tt("GRB_LC_MODIFY_ACK_SUB")}</p>
          </div>
          <div className="npt-ack__id"><small>{tt("GRB_ACK_APP_NO")}</small><strong>{appNo}</strong></div>
        </div>
        <div className="npt-ack__btns" style={{ padding: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to={`${root}/application/${encodeURIComponent(appNo)}`} onClick={clearParams} className="npt-btn npt-btn--primary">
            <GRBIcon name="list" size={18} /><span>{tt("GRB_LC_BACK")}</span>
          </Link>
          <Link to={`${root}/my-registrations`} onClick={clearParams} className="npt-btn npt-btn--ghost"><span>{tt("GRB_ACK_GO_APPS")}</span></Link>
          <GRBBtn kind="ghost" icon="print" onClick={() => window.print()}>{tt("GRB_PRINT")}</GRBBtn>
        </div>
      </section>
    </div>
  );
};

export default ModifyAcknowledgement;
