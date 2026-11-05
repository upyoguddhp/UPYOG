import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import DocViewer from "./DocViewer";

/**
 * Common document-upload component for every service (Property, Trade Licence, ...).
 * The list of documents comes from the DMS service (POST <DMS_URL>/dms/fetchServiceDocMapping, same call as
 * OldTheme's documentUpload page); files are validated and held in memory, then pushed to
 * <DMS_URL>/dms/uploadAttachments with uploadServiceDocuments() once the application exists (it needs the objectId).
 * A document DMS already holds an attachment for is shown as uploaded automatically.
 */

export const SERVICE_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const SERVICE_DOC_MAX_BYTES = 10 * 1024 * 1024;

const dmsBase = () => ((window.globalConfigs && window.globalConfigs.getConfig && window.globalConfigs.getConfig("DMS_URL")) || "/hpud-dms-service").replace(/\/$/, "");
const userInfo = () => (Digit.UserService.getUser() || {}).info || {};

// File objects can't live in session storage: keep them here, keyed by service + document id.
const store = new Map();
const key = (service, id) => `${service}:${id}`;
export const serviceDocumentStore = {
  get: (service, id) => store.get(key(service, id)),
  set: (service, id, file) => store.set(key(service, id), file),
  remove: (service, id) => store.delete(key(service, id)),
  clear: (service) => Array.from(store.keys()).forEach((k) => k.indexOf(`${service}:`) === 0 && store.delete(k)),
};

/** Documents of a service with the attachment (if any) DMS holds for objectId — the latest version of each. */
export const fetchServiceDocumentList = async (serviceName, objectId = "", userId) => {
  const res = await fetch(`${dmsBase()}/dms/fetchServiceDocMapping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ RequestInfo: { apiId: "Rainmaker", authToken: (Digit.UserService.getUser() || {}).access_token }, serviceName, objectId, userId }),
  });
  if (!res.ok) throw new Error(`DMS ${res.status}`);
  const data = await res.json();
  return Array.isArray(data && data.document) ? data.document : [];
};

export const useServiceDocuments = (serviceName, objectId = "") => {
  const q = useQuery(
    ["SERVICE_DOCS", serviceName, objectId],
    // userId lets DMS offer the citizen's earlier upload of a document that has nothing under this application yet
    () => fetchServiceDocumentList(serviceName, objectId, userInfo().id),
    { staleTime: 5 * 60 * 1000, retry: 1, refetchOnWindowFocus: false }
  );
  return { list: q.data || [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
};

// Which required documents still have nothing chosen (and no attachment already on file)?
export const missingServiceDocuments = (serviceName, list) =>
  list.filter((d) => d.required && d.documentName !== "Any Other Document" && !d.attachment && !serviceDocumentStore.get(serviceName, d.id));

export const validateServiceFile = (file) => {
  if (SERVICE_DOC_TYPES.indexOf(file.type) < 0) return "type";
  if (file.size > SERVICE_DOC_MAX_BYTES) return "size";
  return null;
};

/** Pushes every held file to DMS; resolves to { failed: ["documentName (reason from DMS)"...] }. Already-sent files are skipped. */
export const uploadServiceDocuments = async ({ serviceName, objectId, list, description = "" }) => {
  const failed = [];
  const info = userInfo();
  for (const d of list) {
    const file = serviceDocumentStore.get(serviceName, d.id);
    if (!file || file.__sent) continue;
    const form = new FormData();
    form.append("file", file);
    form.append("userId", info.id);
    form.append("objectId", objectId);
    form.append("description", description);
    form.append("id", "");
    form.append("type", file.type);
    form.append("objectName", serviceName);
    form.append("comments", "");
    form.append("status", "PENDING");
    form.append("uploadType", d.id);
    form.append("documentId", d.id);
    form.append("serviceType", serviceName);
    form.append("documentType", info.type === "EMPLOYEE" ? "EMP" : "CITIZ");
    try {
      const res = await fetch(`${dmsBase()}/dms/uploadAttachments`, { method: "POST", headers: { Authorization: `Bearer ${(Digit.UserService.getUser() || {}).access_token}` }, body: form });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (!data.status || data.status === "SUCCESS")) file.__sent = true;
      else failed.push(data.msg ? `${d.documentName} (${data.msg})` : d.documentName);
    } catch (e) {
      failed.push(d.documentName);
    }
  }
  // documents the citizen uploaded for an earlier application (and did not replace now) join this one
  try {
    await fetch(`${dmsBase()}/dms/attachEarlierDocuments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceName, objectId, userId: info.id }),
    });
  } catch (e) {
    /* nothing earlier to attach, or DMS unreachable: the licence then carries only what was uploaded now */
  }
  return { failed };
};

const size = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/**
 * props: serviceName, objectId, labels{ title, choose, replace, remove, view, uploaded, required, optional, hint,
 *   loadFailed, retry, typeError, sizeError, requiredError }, errors{ [docId]: true }, onChange() after any change
 */
const ServiceDocuments = ({ serviceName, objectId = "", labels = {}, errors = {}, onChange, onLoaded }) => {
  const docs = useServiceDocuments(serviceName, objectId);
  const [, bump] = useState(0);
  const [problems, setProblems] = useState({});
  const inputs = useRef({});

  useEffect(() => {
    if (!docs.isLoading && !docs.isError && onLoaded) onLoaded(docs.list);
  }, [docs.isLoading, docs.isError, docs.list.length]);

  const refresh = () => {
    bump((n) => n + 1);
    onChange && onChange();
  };

  const pick = (d, file) => {
    if (!file) return;
    const bad = validateServiceFile(file);
    if (bad) {
      setProblems((p) => ({ ...p, [d.id]: bad === "type" ? labels.typeError : labels.sizeError }));
      return;
    }
    setProblems((p) => ({ ...p, [d.id]: undefined }));
    serviceDocumentStore.set(serviceName, d.id, file);
    refresh();
  };

  const remove = (d) => {
    serviceDocumentStore.remove(serviceName, d.id);
    if (inputs.current[d.id]) inputs.current[d.id].value = "";
    refresh();
  };

  // View in the pdf.js viewer: a chosen file opens straight away, a document already on file is fetched from DMS first
  const [viewing, setViewing] = useState(null);
  const [fetching, setFetching] = useState(null);
  const view = async (d, file) => {
    if (file) return setViewing({ source: file, name: file.name });
    setFetching(d.id);
    try {
      const res = await fetch(`${dmsBase()}/dms/downloadFile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(Digit.UserService.getUser() || {}).access_token}` },
        body: JSON.stringify({ RequestInfo: { apiId: "Rainmaker" }, id: d.attachment.url }),
      });
      const type = res.headers.get("content-type") || "";
      if (!res.ok || type.indexOf("json") >= 0) throw new Error("download");
      setViewing({ source: await res.blob(), name: d.attachment.name });
    } catch (e) {
      setProblems((p) => ({ ...p, [d.id]: labels.viewFailed }));
    }
    setFetching(null);
  };

  if (docs.isLoading) {
    return (
      <div className="svcdoc-skel" aria-busy="true">
        <i /><i /><i />
      </div>
    );
  }
  if (docs.isError) {
    return (
      <div className="svcdoc-error" role="alert">
        <span>{labels.loadFailed}</span>
        <button type="button" onClick={() => docs.refetch()}>{labels.retry}</button>
      </div>
    );
  }

  return (
    <div className="svcdoc">
      {labels.hint ? <p className="svcdoc__hint">{labels.hint}</p> : null}
      <ul className="svcdoc__list">
        {docs.list.map((d) => {
          const file = serviceDocumentStore.get(serviceName, d.id);
          const onFile = d.attachment && d.attachment.name;
          const done = !!file || !!onFile;
          const msg = problems[d.id] || (errors[d.id] ? labels.requiredError : "");
          return (
            <li key={d.id} className={`svcdoc__item${done ? " is-done" : ""}${msg ? " has-error" : ""}`}>
              <div className="svcdoc__row">
                <span className="svcdoc__ico" aria-hidden="true">
                  {done ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5" /></svg>
                  )}
                </span>
                <div className="svcdoc__name">
                  <strong>{d.documentName}</strong>
                  <em className={d.required ? "" : "is-opt"}>{d.required ? labels.required : labels.optional}</em>
                  {done ? (
                    <small>
                      <b>{!file && d.attachment && d.attachment.carriedOver ? labels.carried || labels.uploaded : labels.uploaded}</b> · {file ? `${file.name} (${size(file.size)})` : onFile}
                    </small>
                  ) : null}
                </div>
                <div className="svcdoc__actions">
                  {file || (onFile && d.attachment.url) ? (
                    <button type="button" className="svcdoc__btn" disabled={fetching === d.id} onClick={() => view(d, file)}>{labels.view}</button>
                  ) : null}
                  <label className="svcdoc__btn svcdoc__btn--main">
                    {done ? labels.replace : labels.choose}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      ref={(el) => (inputs.current[d.id] = el)}
                      onChange={(e) => pick(d, e.target.files && e.target.files[0])}
                    />
                  </label>
                  {file ? <button type="button" className="svcdoc__btn svcdoc__btn--danger" onClick={() => remove(d)}>{labels.remove}</button> : null}
                </div>
              </div>
              {msg ? <p className="svcdoc__msg" role="alert">{msg}</p> : null}
            </li>
          );
        })}
      </ul>
      {viewing ? <DocViewer source={viewing.source} name={viewing.name} labels={labels} onClose={() => setViewing(null)} /> : null}
    </div>
  );
};

export default ServiceDocuments;
