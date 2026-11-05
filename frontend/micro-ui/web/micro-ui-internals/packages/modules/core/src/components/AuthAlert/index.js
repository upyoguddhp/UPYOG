import React from "react";

/** Inline, accessible error / info message with an optional action. */
const AuthAlert = ({ title, message, tone = "error", actionLabel, onAction, secondaryLabel, onSecondary }) => (
  <div className={`AuthAlert AuthAlert--${tone}`} role={tone === "error" ? "alert" : "status"}>
    <span className="AuthAlert__icon" aria-hidden="true">{tone === "error" ? "!" : "i"}</span>
    <div className="AuthAlert__body">
      {title ? <strong>{title}</strong> : null}
      {message ? <p>{message}</p> : null}
      {(onAction || onSecondary) && (
        <div className="AuthAlert__actions">
          {onAction ? (
            <button type="button" className="AuthAlert__btn" onClick={onAction}>{actionLabel}</button>
          ) : null}
          {onSecondary ? (
            <button type="button" className="AuthAlert__btn AuthAlert__btn--ghost" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      )}
    </div>
  </div>
);

export default AuthAlert;
