import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { PgAction, PgDoc, PgEmpty, PgSearch, PgSkeleton, PgTabs } from "../components";
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
          <div className="PgDocGrid">
            {filtered.map((r, i) => (
              <PgDoc
                key={r.id || i}
                index={i + 1}
                title={r.notification_name}
                description={r.notification_description}
                meta={r.start_date ? `${fmt(r.start_date)}${r.end_date ? ` → ${fmt(r.end_date)}` : ""}` : null}
                actions={<PgAction label={tt("SITE_DOWNLOAD", "Download")} onClick={() => r.document_link && viewDocument({ documentId: 20, objectId: r.document_link })} />}
              />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
};

export default Notifications;
