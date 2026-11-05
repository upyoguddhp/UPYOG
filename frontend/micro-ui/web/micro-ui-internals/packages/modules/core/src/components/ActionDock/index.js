import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { getHelpLinks, openLink } from "./helpLinks";

const icons = {
  alert: <path d="M12 3l10 18H2zM12 10v5M12 18v.5" />,
  ticket: <path d="M3 7h18v4a2 2 0 000 4v4H3v-4a2 2 0 000-4zM14 7v12" />,
  bot: <path d="M4 8h16v12H4zM12 4v4M9 13h.01M15 13h.01M9 17h6" />,
};

const Glyph = ({ name, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {icons[name]}
  </svg>
);

/**
 * Floating call-to-action dock shown on every citizen page.
 * Chat is an expanded pill; Grievance and Ticket are round buttons with a caption.
 * A CTA only renders when it has a destination (see helpLinks.js).
 */
const ActionDock = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { data: initData } = Digit.Hooks.useStore.getInitData();
  const tt = (k) => t(k);
  const links = getHelpLinks(initData);

  if (!links.grievance && !links.chat && !links.ticket) return null;

  return (
    <nav className="ActionDock" aria-label={tt("ACTION_DOCK_ARIA")}>
      {links.chat && (
        <button type="button" className="ActionDock__chat" onClick={() => openLink(history, links.chat)}>
          <span className="ActionDock__avatar">
            <Glyph name="bot" />
            <i className="ActionDock__online" aria-hidden="true" />
          </span>
          <span className="ActionDock__chatText">
            <strong>{tt("ACTION_DOCK_ASK")}</strong>
            <small>{tt("ACTION_DOCK_ONLINE")}</small>
          </span>
        </button>
      )}
      {links.grievance && (
        <button type="button" className="ActionDock__round ActionDock__round--grievance" onClick={() => openLink(history, links.grievance)}>
          <span className="ActionDock__circle"><Glyph name="alert" /></span>
          <span className="ActionDock__caption">{tt("ACTION_DOCK_GRIEVANCE")}</span>
        </button>
      )}
      {links.ticket && (
        <button type="button" className="ActionDock__round ActionDock__round--ticket" onClick={() => openLink(history, links.ticket)}>
          <span className="ActionDock__circle"><Glyph name="ticket" /></span>
          <span className="ActionDock__caption">{tt("ACTION_DOCK_TICKET")}</span>
        </button>
      )}
    </nav>
  );
};

export default ActionDock;
