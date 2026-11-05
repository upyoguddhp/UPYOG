import { ServiceDocuments, missingServiceDocuments, serviceDocumentStore } from "@upyog/digit-ui-react-components";
import { Toast } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { nprText } from "../../config/newPetMessages";
import { NEW_PET_STEPS, NPR_PAGES } from "../../config/newPetConfig";
import { NPR_DMS_SERVICE } from "./useNPRDocuments";
import { NPRActions, NPRBtn, NPRCrumbs, NPRInfoBar, NPRPage, NPRPageHead, NPRStepper, NPRTricolour } from "./NPRLayout";

export const docLabels = (tt) => ({
  hint: tt("NPR_DOCS_PAGE_HINT"),
  choose: tt("NPR_DOC_CHOOSE"),
  replace: tt("NPR_DOC_REPLACE"),
  remove: tt("NPR_BTN_REMOVE"),
  view: tt("NPR_DOC_VIEW"),
  uploaded: tt("NPR_DOC_UPLOADED"),
  carried: tt("NPR_DOC_CARRIED"),
  required: tt("NPR_DOCS_REQUIRED"),
  optional: tt("NPR_DOCS_OPTIONAL"),
  loadFailed: tt("NPR_DOCS_LOAD_ERROR"),
  retry: tt("NPR_RETRY"),
  typeError: tt("NPR_DOC_TYPE_ERROR"),
  sizeError: tt("NPR_DOC_SIZE_ERROR"),
  requiredError: tt("NPR_DOC_REQUIRED_ERROR"),
  close: tt("NPR_CLOSE"),
  zoomIn: tt("NPR_DOCV_ZOOM_IN"),
  zoomOut: tt("NPR_DOCV_ZOOM_OUT"),
  download: tt("NPR_DOCV_DOWNLOAD"),
  page: tt("NPR_DOCV_PAGES"),
  viewFailed: tt("NPR_DOCV_FAILED"),
});

// Documents step: files are chosen here and sent to DMS when the application is submitted.
const NPRDocuments = ({ t, onSelect, formData = {}, goBack }) => {
  const history = useHistory();
  const tt = (k, p) => nprText(t, k, p);
  const steps = NPR_PAGES;
  const index = Math.max(0, steps.findIndex((s) => s.key === "documents"));
  const navSteps = [...steps, { key: "review", route: "check", head: "NPR_STEP_REVIEW" }];
  const nextStep = navSteps[index + 1];
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const isEmployee = Digit.UserService.getUser()?.info?.type === "EMPLOYEE";
  const basePath = history.location.pathname.replace(/\/[^/]+\/?$/, "");

  const next = () => {
    // employees may register on a citizen's behalf and attach later (same rule as OldTheme)
    const missing = isEmployee ? [] : missingServiceDocuments(NPR_DMS_SERVICE, list);
    if (missing.length) {
      setErrors(missing.reduce((o, d) => ({ ...o, [d.id]: true }), {}));
      setToast({ error: true, label: tt("NPR_DOC_REQUIRED_TOAST") });
      return;
    }
    const chosen = list.filter((d) => serviceDocumentStore.get(NPR_DMS_SERVICE, d.id)).map((d) => ({ id: d.id, documentName: d.documentName, name: serviceDocumentStore.get(NPR_DMS_SERVICE, d.id).name }));
    onSelect("documents", { chosen, list: list.map((d) => ({ id: d.id, documentName: d.documentName, required: d.required })) });
  };

  return (
    <div className="npt-wrap">
      <NPRCrumbs t={t} />
      <NPRPageHead title={tt("NPR_MENU_NEW_REGISTRATION")} sub={tt("NPR_PAGE_SUB")}>
        <NPRInfoBar t={t} steps={navSteps} active={index} total={navSteps.length} showTips={false} />
      </NPRPageHead>
      <NPRStepper t={t} steps={navSteps} active={index} onGo={(s) => history.push(`${basePath}/${s.route}`)} />
      <NPRPage>
        <section className="npt-card">
          <NPRTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt("NPR_STEP_DOCUMENTS")}</h2>
            <p className="npt-card__hint">{tt("NPR_STEP_HINT_DOCUMENTS")}</p>
            <ServiceDocuments
              serviceName={NPR_DMS_SERVICE}
              labels={docLabels(tt)}
              errors={errors}
              onLoaded={setList}
              onChange={() => setErrors({})}
            />
          </div>
        </section>
      </NPRPage>
      <NPRActions
        left={<NPRBtn kind="ghost" onClick={() => (goBack ? goBack() : history.goBack())}>{tt("NPR_BTN_BACK")}</NPRBtn>}
        note={nextStep ? tt("NPR_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={<NPRBtn kind="primary" icon="arrow" onClick={next}>{tt("NPR_BTN_NEXT")}</NPRBtn>}
      />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </div>
  );
};

export default NPRDocuments;
