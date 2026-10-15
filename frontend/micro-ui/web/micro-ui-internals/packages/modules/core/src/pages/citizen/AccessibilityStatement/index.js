import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { featureList, limitations, statementConfig } from "./config";

/**
 * Accessibility Statement page (GIGW requirement).
 * Route: /digit-ui/citizen/accessibility-statement
 */
const AccessibilityStatement = ({ embedded = false }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const tt = (k, d) => t(k, { defaultValue: d });
  const c = statementConfig;

  const status = {
    pending: tt("A11Y_STMT_STATUS_PENDING", "This portal is designed to meet GIGW 3.0 and WCAG 2.1 Level AA. A formal accessibility audit is pending, so conformance has not yet been certified."),
    partial: tt("A11Y_STMT_STATUS_PARTIAL", "This portal is partially conformant with GIGW 3.0 and WCAG 2.1 Level AA. Some content does not yet fully meet the requirements."),
    conformant: tt("A11Y_STMT_STATUS_CONFORMANT", "This portal conforms to GIGW 3.0 and WCAG 2.1 Level AA."),
  }[c.auditStatus];

  const phone = c.contact.phone;

  return (
    <div className="A11yStatement" id="accessibility-statement">
      <div className="A11yStatement__inner">
        {embedded ? null : (
          <React.Fragment>
            <button type="button" className="A11yStatement__back" onClick={() => history.push("/digit-ui/citizen")}>
              ← {tt("A11Y_STMT_BACK", "Back to home")}
            </button>
            <h1>{tt("A11Y_STMT_TITLE", "Accessibility Statement")}</h1>
          </React.Fragment>
        )}
        <p className="A11yStatement__meta">
          {tt("A11Y_STMT_REVIEWED", "Last reviewed")}: {c.lastReviewed}
          {c.auditedOn ? ` · ${tt("A11Y_STMT_AUDITED", "Audited on")}: ${c.auditedOn}` : ""}
        </p>

        <section>
          <h2>{tt("A11Y_STMT_COMMITMENT", "Our commitment")}</h2>
          <p>
            {tt(
              "A11Y_STMT_COMMITMENT_TEXT",
              "The Department of Urban Development is committed to making this portal usable by everyone, including persons with disabilities and senior citizens, in line with the Rights of Persons with Disabilities Act, 2016 and the Guidelines for Indian Government Websites (GIGW)."
            )}
          </p>
        </section>

        <section>
          <h2>{tt("A11Y_STMT_CONFORMANCE", "Conformance status")}</h2>
          <p>{status}</p>
        </section>

        <section>
          <h2>{tt("A11Y_STMT_FEATURES", "Accessibility features available")}</h2>
          <p>{tt("A11Y_STMT_FEATURES_INTRO", "Open the accessibility icon in the top bar to use these tools:")}</p>
          <ul>
            {featureList.map((f) => (
              <li key={f.id}>{tt(f.key, f.text)}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>{tt("A11Y_STMT_LIMITS", "Known limitations")}</h2>
          <ul>
            {limitations.map((l) => (
              <li key={l.id}>{tt(l.key, l.text)}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>{tt("A11Y_STMT_FEEDBACK", "Feedback and assistance")}</h2>
          <p>
            {tt(
              "A11Y_STMT_FEEDBACK_TEXT",
              "If you cannot access any part of this portal, or need information in another format, please contact us and describe the problem and the page address."
            )}
          </p>
          <dl className="A11yStatement__contact">
            {c.contact.name ? (
              <React.Fragment>
                <dt>{tt("A11Y_STMT_OFFICER", "Nodal officer")}</dt>
                <dd>{c.contact.name}</dd>
              </React.Fragment>
            ) : null}
            {phone ? (
              <React.Fragment>
                <dt>{tt("A11Y_STMT_PHONE", "Helpline")}</dt>
                <dd>
                  <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>
                  {c.contact.hours ? ` (${c.contact.hours})` : ""}
                </dd>
              </React.Fragment>
            ) : null}
            {c.contact.email ? (
              <React.Fragment>
                <dt>{tt("A11Y_STMT_EMAIL", "Email")}</dt>
                <dd><a href={`mailto:${c.contact.email}`}>{c.contact.email}</a></dd>
              </React.Fragment>
            ) : null}
            {c.contact.postalAddress ? (
              <React.Fragment>
                <dt>{tt("A11Y_STMT_ADDRESS", "Address")}</dt>
                <dd>{c.contact.postalAddress}</dd>
              </React.Fragment>
            ) : null}
          </dl>
        </section>

        <section>
          <h2>{tt("A11Y_STMT_REFS", "Standards and references")}</h2>
          <ul>
            {c.standards.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AccessibilityStatement;
