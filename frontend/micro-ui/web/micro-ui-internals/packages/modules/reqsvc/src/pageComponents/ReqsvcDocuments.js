import { ServiceDocuments, Toast, missingServiceDocuments, serviceDocumentStore } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { RQS_DMS } from "../config/reqsvcConfig";
import { rqsText } from "../config/reqsvcMessages";
import ReqsvcShell from "./ReqsvcShell";

export const docLabels = (tt) => ({
  hint: tt("RQS_DOCS_PAGE_HINT"),
  choose: tt("RQS_DOC_CHOOSE"),
  replace: tt("RQS_DOC_REPLACE"),
  remove: tt("RQS_BTN_REMOVE"),
  view: tt("RQS_DOC_VIEW"),
  uploaded: tt("RQS_DOC_UPLOADED"),
  carried: tt("RQS_DOC_CARRIED"),
  required: tt("RQS_DOCS_REQUIRED"),
  optional: tt("RQS_DOCS_OPTIONAL"),
  loadFailed: tt("RQS_DOCS_LOAD_ERROR"),
  retry: tt("RQS_RETRY"),
  typeError: tt("RQS_DOC_TYPE_ERROR"),
  sizeError: tt("RQS_DOC_SIZE_ERROR"),
  requiredError: tt("RQS_DOC_REQUIRED_ERROR"),
  close: tt("RQS_CLOSE"),
  zoomIn: tt("RQS_DOCV_ZOOM_IN"),
  zoomOut: tt("RQS_DOCV_ZOOM_OUT"),
  download: tt("RQS_DOCV_DOWNLOAD"),
  page: tt("RQS_DOCV_PAGES"),
  viewFailed: tt("RQS_DOCV_FAILED"),
});

// Documents step: files are chosen here and sent to DMS when the request is submitted. Supporting documents are optional.
const ReqsvcDocuments = ({ t, onSelect }) => {
  const tt = (k, p) => rqsText(t, k, p);
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const next = () => {
    const missing = missingServiceDocuments(RQS_DMS, list);
    if (missing.length) {
      setErrors(missing.reduce((o, d) => ({ ...o, [d.id]: true }), {}));
      setToast({ error: true, label: tt("RQS_DOC_REQUIRED_TOAST") });
      return;
    }
    const chosen = list
      .filter((d) => serviceDocumentStore.get(RQS_DMS, d.id))
      .map((d) => ({ id: d.id, documentName: d.documentName, name: serviceDocumentStore.get(RQS_DMS, d.id).name }));
    onSelect("documents", { chosen, list: list.map((d) => ({ id: d.id, documentName: d.documentName, required: d.required })) });
  };

  return (
    <ReqsvcShell t={t} pageKey="documents" onNext={next}>
      <ServiceDocuments serviceName={RQS_DMS} objectId="" labels={docLabels(tt)} errors={errors} onLoaded={setList} onChange={() => setErrors({})} />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </ReqsvcShell>
  );
};

export default ReqsvcDocuments;
