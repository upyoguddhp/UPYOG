import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { wrkText } from "../config/hpworkMessages";
import { apiErrorMessage, employeesByRoles } from "../utils/work";
import SearchSelect from "./SearchSelect";
import { WRKIcon } from "./WorkLayout";

const NEEDS_COMMENT = /REJECT|RETURN|SEND_BACK/;

// Comment + (when the next state needs one) assignee picker for one workflow action.
// props: action {action, label}, tenantId, assigneeRoles[], saving, onSubmit({comment, assignees}), onClose
const ActionModal = ({ action, tenantId, assigneeRoles, commentMax, saving, onSubmit, onClose }) => {
  const { t } = useTranslation();
  const tt = (k, p) => wrkText(t, k, p);
  const [comment, setComment] = useState("");
  const [assignee, setAssignee] = useState("");
  const [people, setPeople] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const needPerson = assigneeRoles.length > 0;
  const needComment = NEEDS_COMMENT.test(action.action);

  const load = () => {
    setLoadError("");
    setPeople(null);
    employeesByRoles(tenantId, assigneeRoles).then(setPeople).catch((e) => { setPeople([]); setLoadError(apiErrorMessage(e, tt("WRK_MODAL_ASSIGNEE_FAILED"))); });
  };
  useEffect(() => { if (needPerson) load(); }, []);

  const submit = () => {
    if (needComment && !comment.trim()) return setError(tt("WRK_MODAL_COMMENT_REQ"));
    if (needPerson && people && people.length > 0 && !assignee) return setError(tt("WRK_MODAL_ASSIGNEE_REQ"));
    setError("");
    onSubmit({ comment: comment.trim(), assignees: assignee ? [assignee] : [] });
  };

  return (
    <div className="npt-modal" role="dialog" aria-modal="true" aria-label={action.label}>
      <div className="npt-modal__card">
        <div className="npt-modal__head">
          <span className="npt-modal__ico"><WRKIcon name="check" size={22} /></span>
          <h2>{action.label}</h2>
          <button type="button" className="npt-modal__close" onClick={onClose} aria-label={tt("WRK_MODAL_CANCEL")}><WRKIcon name="close" size={20} /></button>
        </div>
        <div className="npt-modal__body wrk-modal">
          <label className="wrk-field">
            <span>{tt("WRK_MODAL_COMMENT")}{needComment ? " *" : ""}</span>
            <textarea value={comment} maxLength={commentMax || 500} placeholder={tt("WRK_MODAL_COMMENT_PH")} onChange={(e) => setComment(e.target.value)} />
          </label>
          {needPerson ? (
            <div className="wrk-field">
              <span>{tt("WRK_MODAL_ASSIGNEE")}{people && people.length > 0 ? " *" : ""}</span>
              {people === null ? <SevaLoader message={tt("WRK_LOADING")} /> : (
                <SearchSelect value={assignee} options={people.map((p) => ({ value: p.code, label: p.label }))} onChange={setAssignee} allLabel={tt("WRK_MODAL_ASSIGNEE_PICK")} searchPlaceholder={tt("WRK_SS_SEARCH")} emptyLabel={tt("WRK_SS_NONE")} ariaLabel={tt("WRK_MODAL_ASSIGNEE")} />
              )}
              {people && people.length === 0 && !loadError ? <small className="wrk-warn">{tt("WRK_MODAL_ASSIGNEE_NONE")}</small> : null}
              {loadError ? <div className="npt-lookup-error" role="alert"><span>{loadError}</span><button type="button" className="npt-link" onClick={load}>{tt("WRK_RETRY")}</button></div> : null}
            </div>
          ) : null}
          {error ? <div className="npt-lookup-error" role="alert"><span>{error}</span></div> : null}
        </div>
        <div className="npt-modal__foot wrk-modal__foot">
          <button type="button" className="npt-btn npt-btn--ghost" onClick={onClose} disabled={saving}><span>{tt("WRK_MODAL_CANCEL")}</span></button>
          <button type="button" className="npt-btn npt-btn--primary" onClick={submit} disabled={saving}><span>{tt("WRK_MODAL_SUBMIT")}</span></button>
        </div>
      </div>
      {saving ? <SevaLoader fullScreen message={tt("WRK_MODAL_SAVING")} /> : null}
    </div>
  );
};

export default ActionModal;
