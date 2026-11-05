import { ServiceDocuments, missingServiceDocuments, serviceDocumentStore } from "@upyog/digit-ui-react-components";
import { Toast } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { grbText } from "../../config/newGRBMessages";
import { NEW_GRB_STEPS, GRB_PAGES, grbPagesFor, grbTitleKey } from "../../config/newGRBConfig";
import { GRB_DMS_SERVICE } from "./useGRBDocuments";
import { GRBActions, GRBBtn, GRBCrumbs, GRBInfoBar, GRBPage, GRBPageHead, GRBStepper, GRBTricolour } from "./GRBLayout";

export const docLabels = (tt) => ({
  hint: tt("GRB_DOCS_PAGE_HINT"),
  choose: tt("GRB_DOC_CHOOSE"),
  replace: tt("GRB_DOC_REPLACE"),
  remove: tt("GRB_BTN_REMOVE"),
  view: tt("GRB_DOC_VIEW"),
  uploaded: tt("GRB_DOC_UPLOADED"),
  carried: tt("GRB_DOC_CARRIED"),
  required: tt("GRB_DOCS_REQUIRED"),
  optional: tt("GRB_DOCS_OPTIONAL"),
  loadFailed: tt("GRB_DOCS_LOAD_ERROR"),
  retry: tt("GRB_RETRY"),
  typeError: tt("GRB_DOC_TYPE_ERROR"),
  sizeError: tt("GRB_DOC_SIZE_ERROR"),
  requiredError: tt("GRB_DOC_REQUIRED_ERROR"),
  close: tt("GRB_CLOSE"),
  zoomIn: tt("GRB_DOCV_ZOOM_IN"),
  zoomOut: tt("GRB_DOCV_ZOOM_OUT"),
  download: tt("GRB_DOCV_DOWNLOAD"),
  page: tt("GRB_DOCV_PAGES"),
  viewFailed: tt("GRB_DOCV_FAILED"),
});

// Documents step: files are chosen here and sent to DMS when the application is submitted.
const GRBDocuments = ({ t, onSelect, formData = {}, goBack }) => {
  const history = useHistory();
  const tt = (k, p) => grbText(t, k, p);
  const steps = grbPagesFor(formData);
  const index = Math.max(0, steps.findIndex((s) => s.key === "documents"));
  const navSteps = [...steps, { key: "review", route: "check", head: "GRB_STEP_REVIEW" }];
  const nextStep = navSteps[index + 1];
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const isEmployee = Digit.UserService.getUser()?.info?.type === "EMPLOYEE";
  const basePath = history.location.pathname.replace(/\/[^/]+\/?$/, "");

  const next = () => {
    // employees may register on a citizen's behalf and attach later (same rule as OldTheme)
    const missing = isEmployee ? [] : missingServiceDocuments(GRB_DMS_SERVICE, list);
    if (missing.length) {
      setErrors(missing.reduce((o, d) => ({ ...o, [d.id]: true }), {}));
      setToast({ error: true, label: tt("GRB_DOC_REQUIRED_TOAST") });
      return;
    }
    const chosen = list.filter((d) => serviceDocumentStore.get(GRB_DMS_SERVICE, d.id)).map((d) => ({ id: d.id, documentName: d.documentName, name: serviceDocumentStore.get(GRB_DMS_SERVICE, d.id).name }));
    onSelect("documents", { chosen, list: list.map((d) => ({ id: d.id, documentName: d.documentName, required: d.required })) });
  };

  return (
    <div className="npt-wrap">
      <GRBCrumbs t={t} />
      <GRBPageHead title={tt(grbTitleKey(formData))} sub={tt("GRB_PAGE_SUB")}>
        <GRBInfoBar t={t} steps={navSteps} active={index} total={navSteps.length} showTips={false} />
      </GRBPageHead>
      <GRBStepper t={t} steps={navSteps} active={index} onGo={(s) => history.push(`${basePath}/${s.route}`)} />
      <GRBPage>
        <section className="npt-card">
          <GRBTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt("GRB_STEP_DOCUMENTS")}</h2>
            <p className="npt-card__hint">{tt("GRB_STEP_HINT_DOCUMENTS")}</p>
            <ServiceDocuments
              serviceName={GRB_DMS_SERVICE}
              objectId={formData._appNo || ""}
              labels={docLabels(tt)}
              errors={errors}
              onLoaded={setList}
              onChange={() => setErrors({})}
            />
          </div>
        </section>
      </GRBPage>
      <GRBActions
        left={<GRBBtn kind="ghost" onClick={() => (goBack ? goBack() : history.goBack())}>{tt("GRB_BTN_BACK")}</GRBBtn>}
        note={nextStep ? tt("GRB_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={<GRBBtn kind="primary" icon="arrow" onClick={next}>{tt("GRB_BTN_NEXT")}</GRBBtn>}
      />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </div>
  );
};

export default GRBDocuments;
