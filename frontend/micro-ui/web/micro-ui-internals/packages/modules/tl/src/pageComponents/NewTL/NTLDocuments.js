import { ServiceDocuments, missingServiceDocuments, serviceDocumentStore } from "@upyog/digit-ui-react-components";
import { Toast } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { ntlText } from "../../config/newTLMessages";
import { NEW_TL_STEPS, NTL_PAGES } from "../../config/newTLConfig";
import { NTL_DMS_SERVICE } from "./useNTLDocuments";
import { NTLActions, NTLBtn, NTLCrumbs, NTLInfoBar, NTLPage, NTLPageHead, NTLStepper, NTLTricolour } from "./NTLLayout";

export const docLabels = (tt) => ({
  hint: tt("NTL_DOCS_PAGE_HINT"),
  choose: tt("NTL_DOC_CHOOSE"),
  replace: tt("NTL_DOC_REPLACE"),
  remove: tt("NTL_BTN_REMOVE"),
  view: tt("NTL_DOC_VIEW"),
  uploaded: tt("NTL_DOC_UPLOADED"),
  carried: tt("NTL_DOC_CARRIED"),
  required: tt("NTL_DOCS_REQUIRED"),
  optional: tt("NTL_DOCS_OPTIONAL"),
  loadFailed: tt("NTL_DOCS_LOAD_ERROR"),
  retry: tt("NTL_RETRY"),
  typeError: tt("NTL_DOC_TYPE_ERROR"),
  sizeError: tt("NTL_DOC_SIZE_ERROR"),
  requiredError: tt("NTL_DOC_REQUIRED_ERROR"),
  close: tt("NTL_CLOSE"),
  zoomIn: tt("NTL_DOCV_ZOOM_IN"),
  zoomOut: tt("NTL_DOCV_ZOOM_OUT"),
  download: tt("NTL_DOCV_DOWNLOAD"),
  page: tt("NTL_DOCV_PAGES"),
  viewFailed: tt("NTL_DOCV_FAILED"),
});

// Documents step: files are chosen here and sent to DMS when the application is submitted.
const NTLDocuments = ({ t, onSelect, formData = {}, goBack, lc }) => {
  const history = useHistory();
  const tt = (k, p) => ntlText(t, k, p);
  const steps = lc ? lc.pages : NTL_PAGES;
  const index = Math.max(0, steps.findIndex((s) => s.key === "documents"));
  const navSteps = [...steps, { key: "review", route: "check", head: "NTL_STEP_REVIEW" }];
  const nextStep = navSteps[index + 1];
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const isEmployee = Digit.UserService.getUser()?.info?.type === "EMPLOYEE";
  const basePath = history.location.pathname.replace(/\/[^/]+\/?$/, "");

  const next = () => {
    // employees may register on a citizen's behalf and attach later (same rule as OldTheme)
    const missing = isEmployee ? [] : missingServiceDocuments(NTL_DMS_SERVICE, list);
    if (missing.length) {
      setErrors(missing.reduce((o, d) => ({ ...o, [d.id]: true }), {}));
      setToast({ error: true, label: tt("NTL_DOC_REQUIRED_TOAST") });
      return;
    }
    const chosen = list.filter((d) => serviceDocumentStore.get(NTL_DMS_SERVICE, d.id)).map((d) => ({ id: d.id, documentName: d.documentName, name: serviceDocumentStore.get(NTL_DMS_SERVICE, d.id).name }));
    onSelect("documents", { chosen, list: list.map((d) => ({ id: d.id, documentName: d.documentName, required: d.required })) });
  };

  return (
    <div className="npt-wrap">
      <NTLCrumbs t={t} current={lc ? tt(lc.title) : undefined} />
      <NTLPageHead title={tt(lc ? lc.title : "NTL_MENU_NEW_REGISTRATION")} sub={tt("NTL_PAGE_SUB")}>
        <NTLInfoBar t={t} steps={navSteps} active={index} total={navSteps.length} showTips={false} />
      </NTLPageHead>
      <NTLStepper t={t} steps={navSteps} active={index} onGo={(s) => history.push(`${basePath}/${s.route}`)} />
      <NTLPage>
        <section className="npt-card">
          <NTLTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt("NTL_STEP_DOCUMENTS")}</h2>
            <p className="npt-card__hint">{tt("NTL_STEP_HINT_DOCUMENTS")}</p>
            <ServiceDocuments
              serviceName={NTL_DMS_SERVICE}
              objectId={lc ? lc.objectId : ""}
              labels={docLabels(tt)}
              errors={errors}
              onLoaded={setList}
              onChange={() => setErrors({})}
            />
          </div>
        </section>
      </NTLPage>
      <NTLActions
        left={<NTLBtn kind="ghost" onClick={() => (goBack ? goBack() : history.goBack())}>{tt("NTL_BTN_BACK")}</NTLBtn>}
        note={nextStep ? tt("NTL_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={<NTLBtn kind="primary" icon="arrow" onClick={next}>{tt("NTL_BTN_NEXT")}</NTLBtn>}
      />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </div>
  );
};

export default NTLDocuments;
