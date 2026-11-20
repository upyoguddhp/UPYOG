import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, Redirect, useParams } from "react-router-dom";
import { wrkText } from "../../config/hpworkMessages";
import { WRKIcon, WRKPageHead, WRKBack } from "../../pageComponents/WorkLayout";
import { canManageMasters, cellText, columnsOf, createRecord, fetchRecords, fetchSchemas, fieldsOf, fromForm, toForm, updateRecord } from "../../utils/masters";
import { apiErrorMessage } from "../../utils/work";

const PAGE = 20;

const MasterData = () => {
  const { t } = useTranslation();
  const tt = (k, p) => wrkText(t, k, p);
  const params = useParams();
  const schemaCode = decodeURIComponent(params.schemaCode || "");
  const allowed = canManageMasters();

  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("true");
  const [q, setQ] = useState("");
  const [editor, setEditor] = useState(null); // { record | null, form, raw, advanced, errors }
  const [toggle, setToggle] = useState(null);
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);

  const schemas = useQuery(["WRK_MST_SCHEMAS"], fetchSchemas, { enabled: allowed, refetchOnWindowFocus: false, retry: 0 });
  const schema = (schemas.data || []).find((s) => s.code === schemaCode);
  const fields = useMemo(() => (schema ? fieldsOf(schema.definition) : []), [schema]);
  const cols = useMemo(() => (schema ? columnsOf(schema.definition) : []), [schema]);

  const list = useQuery(["WRK_MST_LIST", schemaCode, status, page], () => fetchRecords({ schemaCode, isActive: status === "" ? undefined : status === "true", limit: PAGE, offset: page * PAGE }), { enabled: allowed && !!schemaCode, refetchOnWindowFocus: false, retry: 0, keepPreviousData: true });

  if (!allowed) return <Redirect to="/digit-ui/employee/hpwork/inbox" />;
  const term = q.trim().toLowerCase();
  const rows = (list.data || []).filter((r) => !term || JSON.stringify(r.data).toLowerCase().includes(term));

  const open = (record) => setEditor({ record, form: toForm(fields, record ? record.data : {}), raw: JSON.stringify(record ? record.data : {}, null, 2), advanced: !fields.length, errors: {} });
  const setField = (k, v) => setEditor((e) => ({ ...e, form: { ...e.form, [k]: v }, errors: { ...e.errors, [k]: undefined } }));

  const save = async (ev) => {
    ev.preventDefault();
    let data;
    if (editor.advanced) {
      try { data = JSON.parse(editor.raw); } catch (x) { return setEditor({ ...editor, errors: { _raw: tt("WRK_MST_E_JSON") } }); }
    } else {
      const r = fromForm(fields, editor.form, editor.record ? editor.record.data : {}, tt);
      if (Object.keys(r.errors).length) return setEditor({ ...editor, errors: r.errors });
      data = r.data;
    }
    setBusy(true);
    try {
      if (editor.record) await updateRecord(editor.record, { data });
      else await createRecord(schemaCode, data);
      setNote({ ok: true, message: tt(editor.record ? "WRK_MST_UPDATED" : "WRK_MST_CREATED") });
      setEditor(null);
      await list.refetch();
    } catch (x) {
      setEditor((e) => ({ ...e, errors: { _api: apiErrorMessage(x, tt("WRK_MST_SAVE_FAILED")) } }));
    } finally { setBusy(false); }
  };

  const flip = async () => {
    const r = toggle;
    setBusy(true);
    try {
      await updateRecord(r, { isActive: !r.isActive });
      setNote({ ok: true, message: tt(r.isActive ? "WRK_MST_DISABLED" : "WRK_MST_ENABLED") });
      setToggle(null);
      await list.refetch();
    } catch (x) {
      setNote({ ok: false, message: apiErrorMessage(x, tt("WRK_MST_SAVE_FAILED")) });
      setToggle(null);
    } finally { setBusy(false); }
  };

  const input = (f) => {
    const v = editor.form[f.key];
    const ro = !!editor.record && f.unique;
    const common = { id: `mst-${f.key}`, disabled: ro, value: v, onChange: (e) => setField(f.key, e.target.value) };
    if (f.kind === "boolean") return <label className="wrk-check"><input type="checkbox" checked={!!v} disabled={ro} onChange={(e) => setField(f.key, e.target.checked)} /><span>{f.label}</span></label>;
    if (f.kind === "enum") return <select {...common}><option value="">{tt("WRK_BILL_PICK")}</option>{f.enum.map((o) => <option key={o} value={o}>{String(o)}</option>)}</select>;
    if (f.kind === "json") return <textarea {...common} rows={5} spellCheck={false} />;
    if (f.kind === "list") return <input type="text" {...common} placeholder={tt("WRK_MST_LIST_HINT")} />;
    if (f.kind === "number" || f.kind === "integer") return <input type="number" step={f.kind === "integer" ? "1" : "any"} {...common} />;
    return <input type="text" {...common} />;
  };

  return (
    <div className="npt-wrap wrk-masters">
      <nav className="npt-crumbs" aria-label="Breadcrumb"><WRKBack /><a href="/digit-ui/employee">{tt("WRK_CRUMB_HOME")}</a><span>›</span><Link to="/digit-ui/employee/hpwork/masters">{tt("WRK_MST_TITLE")}</Link><span>›</span><strong aria-current="page">{schemaCode}</strong></nav>
      <WRKPageHead title={schemaCode} sub={schema ? schema.description : ""} />

      {note ? <div className={`wrk-billresult ${note.ok ? "is-ok" : "is-bad"}`} role={note.ok ? "status" : "alert"}><WRKIcon name={note.ok ? "check" : "alert"} size={20} /><span>{note.message}</span></div> : null}
      {schemas.isSuccess && !schema ? <div className="npt-lookup-error" role="alert"><span>{tt("WRK_MST_SCHEMA_MISSING")}</span></div> : null}

      <div className="wrk-filters">
        <label className="npt-search wrk-filters__q"><WRKIcon name="search" size={18} /><input type="search" value={q} placeholder={tt("WRK_MST_FILTER")} aria-label={tt("WRK_MST_FILTER")} onChange={(e) => setQ(e.target.value)} /></label>
        <select className="wrk-select" value={status} aria-label={tt("WRK_STATUS")} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="true">{tt("WRK_MST_ACTIVE")}</option><option value="false">{tt("WRK_MST_INACTIVE")}</option><option value="">{tt("WRK_MST_ALL")}</option>
        </select>
        <button type="button" className="npt-btn npt-btn--primary" disabled={!schema} onClick={() => open(null)}><span>{tt("WRK_MST_ADD")}</span></button>
      </div>

      {list.isError ? <div className="npt-lookup-error" role="alert"><span>{apiErrorMessage(list.error, tt("WRK_MST_LIST_FAILED"))}</span><button type="button" className="npt-link" onClick={() => list.refetch()}>{tt("WRK_RETRY")}</button></div> : null}
      {list.isSuccess && !rows.length ? <div className="npt-empty"><WRKIcon name="search" size={40} /><strong>{tt("WRK_MST_EMPTY")}</strong></div> : null}

      {rows.length ? (
        <ul className="npt-prop-list wrk-list" aria-live="polite">
          {rows.map((r) => (
            <li key={r.id} className={`npt-prop${r.isActive ? "" : " is-stop"}`}>
              <div className="npt-prop__main wrk-rec">
                {cols.length ? cols.map((c, i) => (i === 0 ? <strong key={c.key}>{cellText(r.data[c.key])}</strong> : <span key={c.key}><em>{c.label}:</em> {cellText(r.data[c.key])}</span>)) : <strong>{r.uniqueIdentifier || r.id}</strong>}
              </div>
              <span className={`npt-badge npt-badge--${r.isActive ? "done" : "stop"}`}>{tt(r.isActive ? "WRK_MST_ACTIVE" : "WRK_MST_INACTIVE")}</span>
              <div className="wrk-bill__acts">
                <button type="button" className="npt-btn npt-btn--ghost" onClick={() => open(r)}><span>{tt("WRK_MST_EDIT")}</span></button>
                <button type="button" className={`npt-btn ${r.isActive ? "wrk-btn--danger" : "npt-btn--ghost"}`} onClick={() => setToggle(r)}><span>{tt(r.isActive ? "WRK_MST_DISABLE" : "WRK_MST_ENABLE")}</span></button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {(page > 0 || (list.data || []).length === PAGE) ? (
        <div className="wrk-pager">
          <button type="button" className="npt-btn npt-btn--ghost" disabled={page === 0} onClick={() => setPage(page - 1)}><span>{tt("WRK_PREV")}</span></button>
          <span>{tt("WRK_BILLS_PAGE", { n: page + 1 })}</span>
          <button type="button" className="npt-btn npt-btn--ghost" disabled={(list.data || []).length < PAGE} onClick={() => setPage(page + 1)}><span>{tt("WRK_NEXT")}</span></button>
        </div>
      ) : null}

      {editor ? (
        <div className="wrk-modal" role="dialog" aria-modal="true" aria-label={tt(editor.record ? "WRK_MST_EDIT" : "WRK_MST_ADD")}>
          <form className="wrk-modal__box wrk-modal__box--wide" onSubmit={save} noValidate>
            <h2>{tt(editor.record ? "WRK_MST_EDIT_TITLE" : "WRK_MST_ADD_TITLE")} · {schemaCode}</h2>
            {fields.length ? <label className="wrk-check"><input type="checkbox" checked={editor.advanced} onChange={(e) => setEditor({ ...editor, advanced: e.target.checked, raw: e.target.checked ? JSON.stringify(fromForm(fields, editor.form, editor.record ? editor.record.data : {}, tt).data, null, 2) : editor.raw, form: !e.target.checked ? toForm(fields, (() => { try { return JSON.parse(editor.raw); } catch (x) { return {}; } })()) : editor.form })} /><span>{tt("WRK_MST_ADVANCED")}</span></label> : null}
            {editor.advanced ? (
              <div className={`wrk-bf wrk-bf--wide${editor.errors._raw ? " has-error" : ""}`}><label><span>{tt("WRK_MST_JSON")}</span><textarea rows={14} spellCheck={false} value={editor.raw} onChange={(e) => setEditor({ ...editor, raw: e.target.value, errors: {} })} /></label>{editor.errors._raw ? <small role="alert">{editor.errors._raw}</small> : null}</div>
            ) : (
              <div className="wrk-billgrid">
                {fields.map((f) => (
                  <div key={f.key} className={`wrk-bf${f.kind === "json" ? " wrk-bf--wide" : ""}${editor.errors[f.key] ? " has-error" : ""}`}>
                    {f.kind === "boolean" ? input(f) : <label htmlFor={`mst-${f.key}`}><span>{f.label}{f.required ? " *" : ""}{editor.record && f.unique ? ` (${tt("WRK_MST_LOCKED")})` : ""}</span>{input(f)}</label>}
                    {editor.errors[f.key] ? <small role="alert">{editor.errors[f.key]}</small> : null}
                  </div>
                ))}
              </div>
            )}
            {editor.errors._api ? <div className="wrk-billresult is-bad" role="alert"><WRKIcon name="alert" size={20} /><span>{editor.errors._api}</span></div> : null}
            <div className="wrk-billactions">
              <button type="submit" className="npt-btn npt-btn--primary" disabled={busy}><span>{tt("WRK_MST_SAVE")}</span></button>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => setEditor(null)}><span>{tt("WRK_CANCEL")}</span></button>
            </div>
          </form>
        </div>
      ) : null}

      {toggle ? (
        <div className="wrk-modal wrk-modal--top" role="dialog" aria-modal="true">
          <div className="wrk-modal__box">
            <h2>{tt(toggle.isActive ? "WRK_MST_DISABLE_TITLE" : "WRK_MST_ENABLE_TITLE")}</h2>
            <p>{tt(toggle.isActive ? "WRK_MST_DISABLE_WARN" : "WRK_MST_ENABLE_WARN", { id: toggle.uniqueIdentifier || toggle.id })}</p>
            <div className="wrk-billactions">
              <button type="button" className={`npt-btn ${toggle.isActive ? "wrk-btn--danger" : "npt-btn--primary"}`} disabled={busy} onClick={flip}><span>{tt("WRK_MST_CONFIRM")}</span></button>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => setToggle(null)}><span>{tt("WRK_CANCEL")}</span></button>
            </div>
          </div>
        </div>
      ) : null}

      {list.isLoading || schemas.isLoading || busy ? <SevaLoader fullScreen message={tt("WRK_LOADING")} /> : null}
    </div>
  );
};

export default MasterData;
