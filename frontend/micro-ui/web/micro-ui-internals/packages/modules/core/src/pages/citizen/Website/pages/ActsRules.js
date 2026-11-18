import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { PgAction, PgEmpty, PgPagination, PgSearch, PgSkeleton, PgTable } from "../components";
import { documentUrl } from "../siteNav";
import actsData from "../data/acts";
import byelawsData from "../data/byelaws";
import { fetchActsRules, viewDocument } from "../services";

/** A stored link is either a URL / path (static PDF) or a DMS object id (opened through the document service). */
const isDmsId = (file) => !!file && !/^https?:\/\//i.test(file) && !file.includes("/") && !/\.\w{2,5}$/.test(file);

const doc = (r) => ({ label: r.label || "", title: r.title, file: r.document_link || "" });

/** API tree -> the shape the Acts page draws. */
const toActs = (groups) =>
  groups.map((g) => ({ group: g.group, items: g.items.map((a) => ({ ...doc(a), label: a.label || "Act", children: (a.children || []).map(doc) })) }));

/** API tree -> the shape the ByeLaws page draws: state-level documents, and one entry per ULB. */
const toByelaws = (groups) => {
  const items = groups.flatMap((g) => g.items);
  return {
    general: items.filter((i) => !i.ulb_name).map(doc),
    ulb: items.filter((i) => i.ulb_name).map((u) => ({ ...doc(u), label: u.ulb_name, children: (u.children || []).map(doc) })),
  };
};

/**
 * Loads a document tree from the website content service (rdf-monitoring). If the service cannot be
 * reached the bundled copy of the content is shown instead, with a notice, so the page never goes blank.
 * Returns { data, loading, offline, reload }.
 */
const useDocs = (type, transform, bundled) => {
  const [state, setState] = useState({ data: null, offline: false });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, data: null }));
    fetchActsRules(type)
      .then((groups) => live && setState({ data: transform(groups), offline: false }))
      .catch(() => live && setState({ data: bundled, offline: true }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, tick]);
  return { ...state, loading: state.data === null, reload: () => setTick((n) => n + 1) };
};

/** Shown when the live list could not be loaded and the saved copy is on screen. */
const OfflineNote = ({ tt, onRetry }) => (
  <p className="PgNote" role="status">
    {tt("SITE_DOCS_OFFLINE", "The live list could not be loaded, so a saved copy is shown. It may be out of date.")}{" "}
    <button type="button" onClick={onRetry}>{tt("DASH_RETRY", "Try again")}</button>
  </p>
);

/** One Act with its amendments: the amendments open and close so long lists stay compact. */
/** Shared table page for Acts and ByeLaws: search, table, pagination, loading / offline / empty states. */
const DocTable = ({ activeId, title, subtitle, icon, searchLabel, type, transform, bundled, toRows, groupLabel, typeLabel }) => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, loading, offline, reload } = useDocs(type, transform, bundled);
  const [openError, setOpenError] = useState("");
  const openDms = async (objectId) => {
    setOpenError("");
    try {
      await viewDocument({ documentId: 20, objectId });
    } catch (e) {
      setOpenError(tt("SITE_DOC_OPEN_ERROR", "This document could not be opened right now. Please try again in a moment."));
    }
  };
  useEffect(() => setPage(1), [q]);
  const term = q.trim().toLowerCase();
  const all = useMemo(() => (data ? toRows(data, tt) : []), [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = all.filter((r) => !term || `${r.title} ${r.group} ${r.kind}`.toLowerCase().includes(term));
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const columns = [
    { key: "sno", label: tt("SITE_COL_SNO", "S.No."), className: "PgTable__sno", render: (r, i) => (page - 1) * pageSize + i + 1 },
    { key: "title", label: tt("SITE_COL_TITLE", "Title"), className: "PgTable__title", render: (r) => <strong className={r.sub ? "PgTable__sub" : undefined}>{r.title}</strong> },
    { key: "group", label: groupLabel, className: "PgTable__meta", render: (r) => r.group || "—" },
    { key: "kind", label: typeLabel, className: "PgTable__meta", render: (r) => r.kind || "—" },
    { key: "action", label: tt("SITE_COL_ACTION", "Action"), className: "PgTable__action", render: (r) => (!r.file ? "—" : isDmsId(r.file)
      ? <PgAction onClick={() => openDms(r.file)} label={tt("SITE_DOWNLOAD_PDF", "Download PDF")} />
      : <PgAction href={documentUrl(r.file)} label={tt("SITE_DOWNLOAD_PDF", "Download PDF")} />) },
  ];
  return (
    <SiteShell activeId={activeId} title={title} subtitle={subtitle} icon={<Icon name={icon} size={30} />}>
      <div className="PgPage">
        <div className="PgToolbar">
          <PgSearch value={q} onChange={setQ} placeholder={searchLabel} count={loading ? undefined : rows.length} />
        </div>
        {offline && <OfflineNote tt={tt} onRetry={reload} />}
        {openError && <p className="PgNote" role="alert">{openError}</p>}
        {loading ? (
          <PgSkeleton />
        ) : rows.length === 0 ? (
          <PgEmpty icon="search" title={tt("SITE_DOCS_EMPTY", "No documents found")} text={tt("SITE_DOCS_EMPTY_T", "Try a different search, or check back later.")} />
        ) : (
          <PgTable caption={title} rows={paged} columns={columns} getKey={(r, i) => `${r.title}-${r.file}-${i}`} />
        )}
        {!loading && rows.length > 0 ? <PgPagination page={page} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={setPageSize} /> : null}
      </div>
    </SiteShell>
  );
};

/** Acts: each Act is followed by its amendments. */
export const Acts = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  return (
    <DocTable
      activeId="acts-list"
      title={tt("SITE_ACTS_TITLE", "Acts")}
      subtitle={tt("SITE_ACTS_SUB", "Municipal Acts of Himachal Pradesh with their amendments.")}
      icon="law"
      searchLabel={tt("SITE_ACTS_SEARCH", "Search acts and amendments")}
      type="Acts"
      transform={toActs}
      bundled={actsData}
      groupLabel={tt("SITE_COL_CATEGORY", "Category")}
      typeLabel={tt("SITE_COL_TYPE", "Type")}
      toRows={(groups, tx) =>
        groups.flatMap((g) =>
          g.items.flatMap((a) => [
            { title: a.title, group: g.group, kind: a.label || tx("SITE_ACT", "Act"), file: a.file },
            ...(a.children || []).map((c) => ({ title: c.title, group: g.group, kind: tx("SITE_AMENDMENT", "Amendment"), file: c.file, sub: true })),
          ])
        )
      }
    />
  );
};

/** ByeLaws: state-level documents first, then each ULB's documents. */
export const ByeLaws = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  return (
    <DocTable
      activeId="byelaws"
      title={tt("SITE_BYELAWS_TITLE", "ByeLaws")}
      subtitle={tt("SITE_BYELAWS_SUB", "State-level and ULB-specific byelaws.")}
      icon="book"
      searchLabel={tt("SITE_BYELAWS_SEARCH", "Search byelaws or a ULB")}
      type="Rules"
      transform={toByelaws}
      bundled={byelawsData}
      groupLabel={tt("SITE_COL_ULB", "Level / ULB")}
      typeLabel={tt("SITE_COL_TYPE", "Type")}
      toRows={(bye, tx) => [
        ...bye.general.map((b) => ({ title: b.title, group: tx("SITE_STATE", "State level"), kind: b.label || tx("SITE_BYELAW", "ByeLaws"), file: b.file })),
        ...bye.ulb.flatMap((u) => [{ title: u.title, group: u.label, kind: tx("SITE_BYELAW", "ByeLaws"), file: u.file }, ...(u.children || []).map((c) => ({ title: c.title, group: u.label, kind: tx("SITE_BYELAW", "ByeLaws"), file: c.file }))]),
      ]}
    />
  );
};
