import { ServiceDocuments, Toast, serviceDocumentStore } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { GRV_DMS } from "../config/grievanceConfig";
import { grvText } from "../config/grievanceMessages";
import GrievanceShell from "./GrievanceShell";

export const docLabels = (tt) => ({
  hint: tt("GRV_DOCS_PAGE_HINT"),
  choose: tt("GRV_DOC_CHOOSE"),
  replace: tt("GRV_DOC_REPLACE"),
  remove: tt("GRV_BTN_REMOVE"),
  view: tt("GRV_DOC_VIEW"),
  uploaded: tt("GRV_DOC_UPLOADED"),
  carried: tt("GRV_DOC_CARRIED"),
  required: tt("GRV_DOCS_OPTIONAL"),
  optional: tt("GRV_DOCS_OPTIONAL"),
  loadFailed: tt("GRV_DOCS_LOAD_ERROR"),
  retry: tt("GRV_RETRY"),
  typeError: tt("GRV_DOC_TYPE_ERROR"),
  sizeError: tt("GRV_DOC_SIZE_ERROR"),
  requiredError: tt("GRV_DOC_REQUIRED_ERROR"),
  close: tt("GRV_CLOSE"),
  zoomIn: tt("GRV_DOCV_ZOOM_IN"),
  zoomOut: tt("GRV_DOCV_ZOOM_OUT"),
  download: tt("GRV_DOCV_DOWNLOAD"),
  page: tt("GRV_DOCV_PAGES"),
  viewFailed: tt("GRV_DOCV_FAILED"),
});

// Documents step: files are chosen here and sent to DMS when the request is submitted. Supporting documents are optional.
const GrievanceDocuments = ({ t, onSelect }) => {
  const tt = (k, p) => grvText(t, k, p);
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const next = () => {
    const chosen = list
      .filter((d) => serviceDocumentStore.get(GRV_DMS, d.id))
      .map((d) => ({ id: d.id, documentName: d.documentName, name: serviceDocumentStore.get(GRV_DMS, d.id).name }));
    onSelect("documents", { chosen, list: list.map((d) => ({ id: d.id, documentName: d.documentName, required: d.required })) });
  };

  return (
    <GrievanceShell t={t} pageKey="documents" onNext={next}>
      <ServiceDocuments serviceName={GRV_DMS} objectId="" labels={docLabels(tt)} errors={errors} onLoaded={setList} onChange={() => setErrors({})} />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </GrievanceShell>
  );
};

export default GrievanceDocuments;
