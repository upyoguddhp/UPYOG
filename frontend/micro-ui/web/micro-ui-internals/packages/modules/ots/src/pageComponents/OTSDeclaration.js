import React from "react";
import { otsText } from "../config/otsMessages";
import { ageOn } from "../utils/ots";

// The four-clause declaration of the scheme, filled with the applicant's own particulars.
export const OTSDeclaration = ({ t, params }) => {
  const tt = (k, p) => otsText(t, k, p);
  const a = params.applicant || {};
  const s = params.shop || {};
  const address = [s.shopAddress, s.ward, s.ulbName, s.pincode].filter(Boolean).join(", ");
  return (
    <section className="ots-declaration">
      <h3 className="npt-section__title">{tt("OTS_DECL_TITLE")}</h3>
      <ol>
        <li>{tt("OTS_DECL_1")}</li>
        <li>{tt("OTS_DECL_2")}</li>
        <li>{tt("OTS_DECL_3")}</li>
        <li>{tt("OTS_DECL_4", { name: a.applicantName, parent: a.fatherName, age: ageOn(a.dateOfBirth), address })}</li>
      </ol>
      <small>{tt("OTS_DECL_NOTE")}</small>
    </section>
  );
};
