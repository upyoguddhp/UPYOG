import { ServiceDocuments, Toast, missingServiceDocuments, serviceDocumentStore } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { BKG_SERVICES } from "../config/bookingConfig";
import { bkgText } from "../config/bookingMessages";
import BookingShell from "./BookingShell";

export const docLabels = (tt) => ({
  hint: tt("BKG_DOCS_PAGE_HINT"),
  choose: tt("BKG_DOC_CHOOSE"),
  replace: tt("BKG_DOC_REPLACE"),
  remove: tt("BKG_BTN_REMOVE"),
  view: tt("BKG_DOC_VIEW"),
  uploaded: tt("BKG_DOC_UPLOADED"),
  carried: tt("BKG_DOC_CARRIED"),
  required: tt("BKG_DOCS_REQUIRED"),
  optional: tt("BKG_DOCS_OPTIONAL"),
  loadFailed: tt("BKG_DOCS_LOAD_ERROR"),
  retry: tt("BKG_RETRY"),
  typeError: tt("BKG_DOC_TYPE_ERROR"),
  sizeError: tt("BKG_DOC_SIZE_ERROR"),
  requiredError: tt("BKG_DOC_REQUIRED_ERROR"),
  close: tt("BKG_CLOSE"),
  zoomIn: tt("BKG_DOCV_ZOOM_IN"),
  zoomOut: tt("BKG_DOCV_ZOOM_OUT"),
  download: tt("BKG_DOCV_DOWNLOAD"),
  page: tt("BKG_DOCV_PAGES"),
  viewFailed: tt("BKG_DOCV_FAILED"),
});

// Documents step: files are chosen here and sent to DMS when the booking is submitted.
const BookingDocuments = ({ t, svc, onSelect }) => {
  const tt = (k, p) => bkgText(t, k, p);
  const service = BKG_SERVICES[svc].dms;
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const next = () => {
    const missing = missingServiceDocuments(service, list);
    if (missing.length) {
      setErrors(missing.reduce((o, d) => ({ ...o, [d.id]: true }), {}));
      setToast({ error: true, label: tt("BKG_DOC_REQUIRED_TOAST") });
      return;
    }
    const chosen = list
      .filter((d) => serviceDocumentStore.get(service, d.id))
      .map((d) => ({ id: d.id, documentName: d.documentName, name: serviceDocumentStore.get(service, d.id).name }));
    onSelect("documents", { chosen, list: list.map((d) => ({ id: d.id, documentName: d.documentName, required: d.required })) });
  };

  return (
    <BookingShell t={t} svc={svc} pageKey="documents" onNext={next}>
      <ServiceDocuments serviceName={service} objectId="" labels={docLabels(tt)} errors={errors} onLoaded={setList} onChange={() => setErrors({})} />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </BookingShell>
  );
};

export default BookingDocuments;
