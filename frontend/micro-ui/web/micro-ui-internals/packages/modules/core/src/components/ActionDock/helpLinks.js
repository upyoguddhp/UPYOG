/**
 * Resolves where the Grievance / Chat / Ticket calls-to-action go.
 * Everything is driven by MDMS `common-masters.uiHomePage` and the modules that
 * are enabled for the tenant, so a CTA is only offered when it has a destination.
 *
 *   uiHomePage.grievance.navigationUrl              -> grievance (optional override)
 *   uiHomePage.whatsAppBannerDesktop.navigationUrl  -> chat assistant
 *   uiHomePage.supportTicket.navigationUrl          -> support ticket
 *   (fallback for grievance: the PGR module, when it is enabled)
 */
export const PGR_CREATE_URL = "/digit-ui/citizen/pgr/create-complaint/complaint-type";

export const getHelpLinks = (initData) => {
  const ui = initData?.uiHomePage || {};
  const enabled = (initData?.modules || []).map((m) => (m?.code || "").toLowerCase());
  return {
    grievance: ui.grievance?.navigationUrl || (enabled.includes("pgr") ? PGR_CREATE_URL : null),
    chat: ui.whatsAppBannerDesktop?.navigationUrl || null,
    ticket: ui.supportTicket?.navigationUrl || null,
  };
};

export const openLink = (history, url) => (/^https?:/i.test(url) ? window.open(url, "_blank", "noopener") : history.push(url));
