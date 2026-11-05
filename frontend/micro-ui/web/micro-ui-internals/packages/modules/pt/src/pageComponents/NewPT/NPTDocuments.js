import { ServiceDocuments, missingServiceDocuments, serviceDocumentStore } from "@upyog/digit-ui-react-components";
import { Toast } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { nptText } from "../../config/newPTMessages";
import { NEW_PT_STEPS } from "../../config/newPTConfig";
import { stepsFor } from "../../utils/newPT";
import { NPTActions, NPTBtn, NPTCrumbs, NPTInfoBar, NPTPage, NPTPageHead, NPTStepper, NPTTricolour } from "./NPTLayout";

export const NPT_DMS_SERVICE = "PROPERTY";

export const docLabels = (tt) => ({
  hint: tt("NPT_DOCS_PAGE_HINT"),
  choose: tt("NPT_DOC_CHOOSE"),
  replace: tt("NPT_DOC_REPLACE"),
  remove: tt("NPT_BTN_REMOVE"),
  view: tt("NPT_DOC_VIEW"),
  uploaded: tt("NPT_DOC_UPLOADED"),
  carried: tt("NPT_DOC_CARRIED"),
  required: tt("NPT_DOCS_REQUIRED"),
  optional: tt("NPT_DOCS_OPTIONAL"),
  loadFailed: tt("NPT_DOCS_LOAD_ERROR"),
  retry: tt("NPT_RETRY"),
  typeError: tt("NPT_DOC_TYPE_ERROR"),
  sizeError: tt("NPT_DOC_SIZE_ERROR"),
  requiredError: tt("NPT_DOC_REQUIRED_ERROR"),
  close: tt("NPT_CLOSE"),
  zoomIn: tt("NPT_DOCV_ZOOM_IN"),
  zoomOut: tt("NPT_DOCV_ZOOM_OUT"),
  download: tt("NPT_DOCV_DOWNLOAD"),
  page: tt("NPT_DOCV_PAGES"),
  viewFailed: tt("NPT_DOCV_FAILED"),
});

// Documents step: files are chosen here and sent to DMS when the application is submitted.
const NPTDocuments = ({ t, onSelect, formData = {}, goBack }) => {
  const history = useHistory();
  const tt = (k, p) => nptText(t, k, p);
  const steps = stepsFor(formData);
  const index = Math.max(0, steps.findIndex((s) => s.key === "documents"));
  const navSteps = [...steps, { key: "review", route: "check", head: "NPT_STEP_REVIEW" }];
  const nextStep = navSteps[index + 1];
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const isEmployee = Digit.UserService.getUser()?.info?.type === "EMPLOYEE";
  const basePath = history.location.pathname.replace(/\/[^/]+\/?$/, "");

  const next = () => {
    // employees may register on a citizen's behalf and attach later (same rule as OldTheme)
    const missing = isEmployee ? [] : missingServiceDocuments(NPT_DMS_SERVICE, list);
    if (missing.length) {
      setErrors(missing.reduce((o, d) => ({ ...o, [d.id]: true }), {}));
      setToast({ error: true, label: tt("NPT_DOC_REQUIRED_TOAST") });
      return;
    }
    const chosen = list.filter((d) => serviceDocumentStore.get(NPT_DMS_SERVICE, d.id)).map((d) => ({ id: d.id, documentName: d.documentName, name: serviceDocumentStore.get(NPT_DMS_SERVICE, d.id).name }));
    onSelect("documents", { chosen, list: list.map((d) => ({ id: d.id, documentName: d.documentName, required: d.required })) });
  };

  return (
    <div className="npt-wrap">
      <NPTCrumbs t={t} />
      <NPTPageHead title={tt("NPT_MENU_NEW_REGISTRATION")} sub={tt("NPT_PAGE_SUB")}>
        <NPTInfoBar t={t} steps={navSteps} active={index} total={navSteps.length} showTips={false} />
      </NPTPageHead>
      <NPTStepper t={t} steps={navSteps} active={index} onGo={(s) => history.push(`${basePath}/${s.route}`)} />
      <NPTPage>
        <section className="npt-card">
          <NPTTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt("NPT_STEP_DOCUMENTS")}</h2>
            <p className="npt-card__hint">{tt("NPT_STEP_HINT_DOCUMENTS")}</p>
            <ServiceDocuments
              serviceName={NPT_DMS_SERVICE}
              labels={docLabels(tt)}
              errors={errors}
              onLoaded={setList}
              onChange={() => setErrors({})}
            />
          </div>
        </section>
      </NPTPage>
      <NPTActions
        left={<NPTBtn kind="ghost" onClick={() => (goBack ? goBack() : history.goBack())}>{tt("NPT_BTN_BACK")}</NPTBtn>}
        note={nextStep ? tt("NPT_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={<NPTBtn kind="primary" icon="arrow" onClick={next}>{tt("NPT_BTN_NEXT")}</NPTBtn>}
      />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </div>
  );
};

export default NPTDocuments;
