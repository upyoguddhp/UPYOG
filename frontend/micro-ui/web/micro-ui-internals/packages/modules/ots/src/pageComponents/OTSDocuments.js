import { ServiceDocuments, Toast, missingServiceDocuments, serviceDocumentStore } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { OTS_DMS } from "../config/otsConfig";
import { otsText } from "../config/otsMessages";
import OTSShell from "./OTSShell";

export const docLabels = (tt) => ({
  hint: tt("OTS_DOCS_PAGE_HINT"),
  choose: tt("OTS_DOC_CHOOSE"),
  replace: tt("OTS_DOC_REPLACE"),
  remove: tt("OTS_BTN_REMOVE"),
  view: tt("OTS_DOC_VIEW"),
  uploaded: tt("OTS_DOC_UPLOADED"),
  carried: tt("OTS_DOC_CARRIED"),
  required: tt("OTS_DOCS_REQUIRED"),
  optional: tt("OTS_DOCS_OPTIONAL"),
  loadFailed: tt("OTS_DOCS_LOAD_ERROR"),
  retry: tt("OTS_RETRY"),
  typeError: tt("OTS_DOC_TYPE_ERROR"),
  sizeError: tt("OTS_DOC_SIZE_ERROR"),
  requiredError: tt("OTS_DOC_REQUIRED_ERROR"),
  close: tt("OTS_CLOSE"),
  zoomIn: tt("OTS_DOCV_ZOOM_IN"),
  zoomOut: tt("OTS_DOCV_ZOOM_OUT"),
  download: tt("OTS_DOCV_DOWNLOAD"),
  page: tt("OTS_DOCV_PAGES"),
  viewFailed: tt("OTS_DOCV_FAILED"),
});

// Documents step: files are chosen here and sent to DMS when the application is submitted.
const OTSDocuments = ({ t, onSelect }) => {
  const tt = (k, p) => otsText(t, k, p);
  const service = OTS_DMS;
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const next = () => {
    const missing = missingServiceDocuments(service, list);
    if (missing.length) {
      setErrors(missing.reduce((o, d) => ({ ...o, [d.id]: true }), {}));
      setToast({ error: true, label: tt("OTS_DOC_REQUIRED_TOAST") });
      return;
    }
    const chosen = list
      .filter((d) => serviceDocumentStore.get(service, d.id))
      .map((d) => ({ id: d.id, documentName: d.documentName, name: serviceDocumentStore.get(service, d.id).name }));
    onSelect("documents", { chosen, list: list.map((d) => ({ id: d.id, documentName: d.documentName, required: d.required })) });
  };

  return (
    <OTSShell t={t} pageKey="documents" onNext={next}>
      <ServiceDocuments serviceName={service} objectId="" labels={docLabels(tt)} errors={errors} onLoaded={setList} onChange={() => setErrors({})} />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </OTSShell>
  );
};

export default OTSDocuments;
