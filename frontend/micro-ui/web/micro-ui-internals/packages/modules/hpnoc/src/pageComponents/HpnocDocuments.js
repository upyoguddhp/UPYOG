import { ServiceDocuments, Toast, missingServiceDocuments, serviceDocumentStore } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { HNC_DMS } from "../config/hpnocConfig";
import { rqsText } from "../config/hpnocMessages";
import HpnocShell from "./HpnocShell";

export const docLabels = (tt) => ({
  hint: tt("HNC_DOCS_PAGE_HINT"),
  choose: tt("HNC_DOC_CHOOSE"),
  replace: tt("HNC_DOC_REPLACE"),
  remove: tt("HNC_BTN_REMOVE"),
  view: tt("HNC_DOC_VIEW"),
  uploaded: tt("HNC_DOC_UPLOADED"),
  carried: tt("HNC_DOC_CARRIED"),
  required: tt("HNC_DOCS_REQUIRED"),
  optional: tt("HNC_DOCS_OPTIONAL"),
  loadFailed: tt("HNC_DOCS_LOAD_ERROR"),
  retry: tt("HNC_RETRY"),
  typeError: tt("HNC_DOC_TYPE_ERROR"),
  sizeError: tt("HNC_DOC_SIZE_ERROR"),
  requiredError: tt("HNC_DOC_REQUIRED_ERROR"),
  close: tt("HNC_CLOSE"),
  zoomIn: tt("HNC_DOCV_ZOOM_IN"),
  zoomOut: tt("HNC_DOCV_ZOOM_OUT"),
  download: tt("HNC_DOCV_DOWNLOAD"),
  page: tt("HNC_DOCV_PAGES"),
  viewFailed: tt("HNC_DOCV_FAILED"),
});

// Documents step: files are chosen here and sent to DMS when the request is submitted. Supporting documents are optional.
const HpnocDocuments = ({ t, onSelect }) => {
  const tt = (k, p) => rqsText(t, k, p);
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const next = () => {
    const missing = missingServiceDocuments(HNC_DMS, list);
    if (missing.length) {
      setErrors(missing.reduce((o, d) => ({ ...o, [d.id]: true }), {}));
      setToast({ error: true, label: tt("HNC_DOC_REQUIRED_TOAST") });
      return;
    }
    const chosen = list
      .filter((d) => serviceDocumentStore.get(HNC_DMS, d.id))
      .map((d) => ({ id: d.id, documentName: d.documentName, name: serviceDocumentStore.get(HNC_DMS, d.id).name }));
    onSelect("documents", { chosen, list: list.map((d) => ({ id: d.id, documentName: d.documentName, required: d.required })) });
  };

  return (
    <HpnocShell t={t} pageKey="documents" onNext={next}>
      <ServiceDocuments serviceName={HNC_DMS} objectId="" labels={docLabels(tt)} errors={errors} onLoaded={setList} onChange={() => setErrors({})} />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </HpnocShell>
  );
};

export default HpnocDocuments;
