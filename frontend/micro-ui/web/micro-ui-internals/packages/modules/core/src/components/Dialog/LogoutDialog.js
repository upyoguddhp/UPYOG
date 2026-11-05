import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Branded sign-out confirmation shared by every logout entry point (employee + citizen shells, old top bar).
// props: onSelect (confirm), onCancel, onDismiss
const LogoutDialog = ({ onSelect, onCancel, onDismiss }) => {
  const { t } = useTranslation();
  const tt = (k) => t(k);
  const dismiss = onDismiss || onCancel;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && dismiss) dismiss(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="npt-modal emp-logout" role="dialog" aria-modal="true" aria-labelledby="emp-logout-title">
      <div className="npt-modal__card">
        <div className="npt-modal__head">
          <span className="npt-modal__ico emp-logout__ico" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
          </span>
          <h2 id="emp-logout-title">{tt("EMP_LOGOUT_TITLE")}</h2>
          <button type="button" className="npt-modal__close" onClick={dismiss} aria-label={tt("EMP_CLOSE")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="npt-modal__body">
          <p className="emp-logout__msg">{tt("EMP_LOGOUT_MSG")}</p>
          <p className="emp-logout__hint">{tt("EMP_LOGOUT_HINT")}</p>
        </div>
        <div className="npt-modal__foot">
          <button type="button" className="npt-btn npt-btn--ghost" onClick={onCancel} autoFocus><span>{tt("EMP_LOGOUT_STAY")}</span></button>
          <button type="button" className="npt-btn emp-logout__yes" onClick={onSelect}><span>{tt("EMP_LOGOUT_YES")}</span></button>
        </div>
      </div>
    </div>
  );
};
export default LogoutDialog;
