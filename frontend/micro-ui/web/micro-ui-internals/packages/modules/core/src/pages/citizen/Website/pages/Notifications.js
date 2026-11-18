import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { PgAction, PgEmpty, PgPagination, PgSearch, PgSkeleton, PgTable, PgTabs } from "../components";
import { fetchNotifications, viewDocument } from "../services";

const fmt = (d) => {
  if (!d) return "";
  const x = new Date(d);
  return isNaN(x) ? String(d) : x.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/** Notifications / Orders and Service notifications published by the Directorate. */
const Notifications = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const [tab, setTab] = useState("notification");
  const [data, setData] = useState({ notification: null, service: null });
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    let live = true;
    ["notification", "service"].forEach((type) =>
      fetchNotifications(type)
        .then((rows) => live && setData((d) => ({ ...d, [type]: rows })))
        .catch(() => live && (setError(true), setData((d) => ({ ...d, [type]: [] }))))
    );
    return () => {
      live = false;
    };
  }, []);

  const rows = data[tab];
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (rows || []).filter((r) => !term || `${r.notification_name} ${r.notification_description}`.toLowerCase().includes(term));
  }, [rows, q]);

  // back to the first page whenever the list being shown changes
  useEffect(() => setPage(1), [tab, q, pageSize]);
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  return (
    <SiteShell
      activeId="notifications"
      title={tt("SITE_NOTIF_TITLE", "Notifications & Orders")}
      subtitle={tt("SITE_NOTIF_SUB", "Official notifications, orders and service notifications of the Directorate.")}
      icon={<Icon name="megaphone" size={30} />}
    >
      <div className="PgPage">
        <div className="PgToolbar">
          <PgTabs
            label={tt("SITE_NOTIF_TITLE", "Notifications & Orders")}
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "notification", label: tt("SITE_NOTIF_TAB1", "Notifications / Orders"), count: data.notification?.length },
              { id: "service", label: tt("SITE_NOTIF_TAB2", "Service notifications"), count: data.service?.length },
            ]}
          />
          <PgSearch value={q} onChange={setQ} placeholder={tt("SITE_SEARCH_DOCS", "Search by title or description")} count={rows === null ? undefined : filtered.length} />
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
          <PgTable
            caption={tab === "notification" ? tt("SITE_NOTIF_TAB1", "Notifications / Orders") : tt("SITE_NOTIF_TAB2", "Service notifications")}
            rows={paged}
            getKey={(r, i) => r.id || i}
            columns={[
              { key: "sno", label: tt("SITE_COL_SNO", "S.No."), className: "PgTable__sno", render: (r, i) => (page - 1) * pageSize + i + 1 },
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
              {
                key: "period",
                label: tt("SITE_COL_PERIOD", "Date / Validity"),
                className: "PgTable__period",
                render: (r) => (r.start_date ? `${fmt(r.start_date)}${r.end_date ? ` → ${fmt(r.end_date)}` : ""}` : "—"),
              },
              {
                key: "action",
                label: tt("SITE_COL_ACTION", "Action"),
                className: "PgTable__action",
                render: (r) => (
                  <PgAction
                    label={tt("SITE_DOWNLOAD", "Download")}
                    onClick={() => r.document_link && viewDocument({ documentId: 20, objectId: r.document_link })}
                  />
                ),
              },
            ]}
          />
        )}
        {rows !== null && filtered.length > 0 ? (
          <PgPagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
        ) : null}
      </div>
    </SiteShell>
  );
};

export default Notifications;
