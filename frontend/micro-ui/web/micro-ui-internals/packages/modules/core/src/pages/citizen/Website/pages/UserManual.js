import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { PgAction, PgCta, PgEmpty, PgPagination, PgSearch, PgSkeleton, PgTable, useFilter } from "../components";
import { ROUTES } from "../config";
import { fetchNotifications, fetchUserManuals, viewDocument } from "../services";

const FIELDS = ["service_name", "notification_name", "notification_description"];

/**
 * User Manual / Guide, SOP Manual and RTI Documents share one document-list page. All three are
 * maintained in the CMS (rdf-monitoring): manuals live in eg_user_manuals, SOP and RTI documents are
 * eg_notifications rows whose notification_type is "sop" / "rti".
 */
const DocumentListPage = ({ kind }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const tt = (k, d) => t(k, { defaultValue: d });
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);
  const [docError, setDocError] = useState("");
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ, filtered] = useFilter(rows || [], FIELDS);
  useEffect(() => setPage(1), [q, kind]);
  const isManual = kind === "manual";
  const isRti = kind === "rti";

  useEffect(() => {
    let live = true;
    setRows(null);
    setError(false);
    const load = isManual ? fetchUserManuals() : fetchNotifications(kind);
    load.then((r) => live && setRows(r)).catch(() => live && (setError(true), setRows([])));
    return () => {
      live = false;
    };
  }, [kind, isManual, tick]);

  const META = {
    manual: {
      activeId: "user-manual",
      title: tt("SITE_MANUAL_TITLE", "User Manual / Guide"),
      subtitle: tt("SITE_MANUAL_SUB", "Step-by-step guides for every service, in English and Hindi."),
      icon: "book",
      search: tt("SITE_SEARCH_SERVICE", "Search by service name"),
    },
    sop: {
      activeId: "sop",
      title: tt("SITE_SOP_TITLE", "SOP Manual"),
      subtitle: tt("SITE_SOP_SUB", "Standard operating procedures for municipal services."),
      icon: "doc",
      search: tt("SITE_SEARCH_SERVICE", "Search by service name"),
    },
    rti: {
      activeId: "rti",
      title: tt("SITE_RTI_TITLE", "RTI Documents"),
      subtitle: tt("SITE_RTI_SUB", "Documents published under the Right to Information Act."),
      icon: "doc",
      search: tt("SITE_SEARCH_DOCS", "Search by title or description"),
    },
  }[kind];

  /** Opens a stored document; a failure is shown on the page instead of being swallowed. */
  const open = async (objectId) => {
    if (!objectId) return;
    setDocError("");
    try {
      await viewDocument({ documentId: 20, objectId });
    } catch (e) {
      setDocError(tt("SITE_DOC_OPEN_ERROR", "This document could not be opened right now. Please try again in a moment."));
    }
  };

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const sno = { key: "sno", label: tt("SITE_COL_SNO", "S.No."), className: "PgTable__sno", render: (r, i) => (page - 1) * pageSize + i + 1 };
  const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
  const columns = isManual
    ? [
        sno,
        { key: "title", label: tt("SITE_COL_SERVICE", "Service"), className: "PgTable__title", render: (r) => <strong>{r.service_name}</strong> },
        { key: "en", label: tt("SITE_DOWNLOAD_EN", "English"), className: "PgTable__action", render: (r) => (r.document_english ? <PgAction label={tt("SITE_DOWNLOAD", "Download")} onClick={() => open(r.document_english)} /> : "—") },
        { key: "hi", label: tt("SITE_DOWNLOAD_HI", "हिन्दी"), className: "PgTable__action", render: (r) => (r.document_hindi ? <PgAction ghost label={tt("SITE_DOWNLOAD", "Download")} onClick={() => open(r.document_hindi)} /> : "—") },
      ]
    : [
        sno,
        {
          key: "title",
          label: tt("SITE_COL_TITLE", "Title"),
          className: "PgTable__title",
          render: (r) => (
            <div className="PgTable__titlebox">
              <strong>{r.notification_name}</strong>
              {r.notification_description && r.notification_description !== r.notification_name ? <span>{r.notification_description}</span> : null}
            </div>
          ),
        },
        { key: "period", label: tt("SITE_COL_PERIOD", "Date / Validity"), className: "PgTable__period", render: (r) => (r.start_date ? `${fmt(r.start_date)}${r.end_date ? ` → ${fmt(r.end_date)}` : ""}` : "—") },
        { key: "action", label: tt("SITE_COL_ACTION", "Action"), className: "PgTable__action", render: (r) => <PgAction label={tt("SITE_DOWNLOAD", "Download")} onClick={() => open(r.document_link)} /> },
      ];

  return (
    <SiteShell activeId={META.activeId} title={META.title} subtitle={META.subtitle} icon={<Icon name={META.icon} size={30} />}>
      <div className="PgPage">
        <div className="PgToolbar">
          <PgSearch value={q} onChange={setQ} placeholder={META.search} count={rows === null ? undefined : filtered.length} />
        </div>
        {docError && <p className="PgNote" role="alert">{docError}</p>}
        {rows === null ? (
          <PgSkeleton />
        ) : filtered.length === 0 ? (
          <PgEmpty
            icon={error ? "alert" : "doc"}
            title={
              error
                ? tt("SITE_DOCS_ERROR", "Documents could not be loaded")
                : isRti && !q
                ? tt("SITE_RTI_EMPTY", "No RTI documents have been published yet")
                : tt("SITE_DOCS_EMPTY", "No documents found")
            }
            text={
              error
                ? tt("SITE_DOCS_ERROR_T", "The document service did not respond. Please try again later.")
                : isRti && !q
                ? tt("SITE_RTI_EMPTY_T", "Documents will appear here as soon as the Directorate publishes them. For urgent queries please use the contact details on the Contact Us page.")
                : tt("SITE_DOCS_EMPTY_T", "Try a different search, or check back later.")
            }
          >
            {error && (
              <button type="button" className="LandingBtn LandingBtn--primary" onClick={() => setTick((n) => n + 1)}>
                {tt("DASH_RETRY", "Try again")}
              </button>
            )}
          </PgEmpty>
        ) : (
          <PgTable
            caption={META.title}
            rows={paged}
            getKey={(r, i) => r.id || i}
            columns={columns}
          />
        )}
        {rows !== null && filtered.length > 0 ? (
          <PgPagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
        ) : null}
        {isRti && (
          <PgCta title={tt("SITE_RTI_CTA", "Need information urgently?")} text={tt("SITE_RTI_CTA_T", "Write to the Directorate or call the office during working hours.")}>
            <button type="button" className="LandingBtn LandingBtn--primary" onClick={() => history.push(ROUTES.contact)}>
              {tt("SITE_NAV_CONTACT", "Contact Us")}
            </button>
          </PgCta>
        )}
      </div>
    </SiteShell>
  );
};

export const UserManual = () => <DocumentListPage kind="manual" />;
export const Sop = () => <DocumentListPage kind="sop" />;
export const Rti = () => <DocumentListPage kind="rti" />;
export default UserManual;
