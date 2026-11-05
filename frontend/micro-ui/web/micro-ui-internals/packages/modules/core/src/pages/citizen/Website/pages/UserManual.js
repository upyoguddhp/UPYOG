import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { PgAction, PgDoc, PgEmpty, PgSearch, PgSkeleton, useFilter } from "../components";
import { fetchNotifications, fetchUserManuals, viewDocument } from "../services";

const FIELDS = ["service_name", "notification_name"];

/** User Manual / Guide (English + Hindi) and SOP Manual share one document-list page. */
const DocumentListPage = ({ kind }) => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);
  const [q, setQ, filtered] = useFilter(rows || [], FIELDS);
  const isManual = kind === "manual";

  useEffect(() => {
    let live = true;
    const load = isManual ? fetchUserManuals() : fetchNotifications("sop");
    load.then((r) => live && setRows(r)).catch(() => live && (setError(true), setRows([])));
    return () => {
      live = false;
    };
  }, [isManual]);

  return (
    <SiteShell
      activeId={isManual ? "user-manual" : "sop"}
      title={isManual ? tt("SITE_MANUAL_TITLE", "User Manual / Guide") : tt("SITE_SOP_TITLE", "SOP Manual")}
      subtitle={isManual ? tt("SITE_MANUAL_SUB", "Step-by-step guides for every service, in English and Hindi.") : tt("SITE_SOP_SUB", "Standard operating procedures for municipal services.")}
      icon={<Icon name="book" size={30} />}
    >
      <div className="PgPage">
        <div className="PgToolbar">
          <PgSearch value={q} onChange={setQ} placeholder={tt("SITE_SEARCH_SERVICE", "Search by service name")} count={rows === null ? undefined : filtered.length} />
        </div>
        {rows === null ? (
          <PgSkeleton />
        ) : filtered.length === 0 ? (
          <PgEmpty
            icon={error ? "alert" : "doc"}
            title={error ? tt("SITE_DOCS_ERROR", "Documents could not be loaded") : tt("SITE_DOCS_EMPTY", "No documents found")}
            text={error ? tt("SITE_DOCS_ERROR_T", "The document service did not respond. Please try again later.") : tt("SITE_DOCS_EMPTY_T", "Try a different search, or check back later.")}
          />
        ) : (
          <div className="PgDocGrid">
            {filtered.map((r, i) => (
              <PgDoc
                key={r.id || i}
                index={i + 1}
                icon={isManual ? "book" : "doc"}
                title={isManual ? r.service_name : r.notification_name}
                actions={
                  isManual ? (
                    <React.Fragment>
                      <PgAction label={tt("SITE_DOWNLOAD_EN", "English")} onClick={() => r.document_english && viewDocument({ documentId: 20, objectId: r.document_english })} />
                      <PgAction ghost label={tt("SITE_DOWNLOAD_HI", "हिन्दी")} onClick={() => r.document_hindi && viewDocument({ documentId: 20, objectId: r.document_hindi })} />
                    </React.Fragment>
                  ) : (
                    <PgAction label={tt("SITE_DOWNLOAD", "Download")} onClick={() => r.document_link && viewDocument({ documentId: 20, objectId: r.document_link })} />
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
};

export const UserManual = () => <DocumentListPage kind="manual" />;
export const Sop = () => <DocumentListPage kind="sop" />;
export default UserManual;
