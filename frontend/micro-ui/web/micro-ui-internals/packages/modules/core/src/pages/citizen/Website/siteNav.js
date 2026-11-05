import { DOCUMENT_BASE, QUICK_PAY_URL, ROUTES } from "./config";

/**
 * Primary navigation shared by the landing page and every website page.
 * `ctx.go(url)` navigates (internal route or external URL); `ctx.scrollServices` overrides
 * the "Services" item on the landing page; `ctx.links` are the resolved help links.
 */
export const buildSiteNav = ({ t, go, activeId, scrollServices, links = {}, hasServices = true }) => {
  const tt = (k, d) => t(k, { defaultValue: d });
  const to = (url) => () => go(url);
  const items = [
    { id: "home", label: tt("SITE_NAV_HOME", "Home"), onClick: to(ROUTES.home) },
    { id: "about", label: tt("SITE_NAV_ABOUT", "About Us"), onClick: to(ROUTES.about) },
    hasServices && {
      id: "services",
      label: tt("SITE_NAV_SERVICES", "Services"),
      onClick: scrollServices || (() => go(`${ROUTES.home}#landing-services`)),
    },
    { id: "notifications", label: tt("SITE_NAV_NOTIFICATIONS_SHORT", "Notifications"), onClick: to(ROUTES.notifications) },
    {
      id: "acts",
      label: tt("SITE_NAV_ACTS", "Acts & Rules"),
      children: [
        { id: "acts-list", label: tt("SITE_NAV_ACTS_LIST", "Acts"), onClick: to(ROUTES.acts) },
        { id: "byelaws", label: tt("SITE_NAV_BYELAWS", "ByeLaws"), onClick: to(ROUTES.byelaws) },
      ],
    },
    {
      id: "resources",
      label: tt("SITE_NAV_RESOURCES", "Resources"),
      children: [
        { id: "user-manual", label: tt("SITE_NAV_USER_MANUAL", "User Manual / Guide"), onClick: to(ROUTES.userManual) },
        { id: "sop", label: tt("SITE_NAV_SOP", "SOP Manual"), onClick: to(ROUTES.sop) },
        { id: "rti", label: tt("SITE_NAV_RTI", "RTI Documents"), onClick: to(ROUTES.rti) },
        { id: "organization", label: tt("SITE_NAV_ORG", "Organization Chart"), onClick: to(ROUTES.organization) },
      ],
    },
    {
      id: "quickpay",
      label: tt("SITE_NAV_QUICK_PAY", "Quick Pay"),
      children: [
        { id: "qp-property", label: tt("SITE_NAV_PROPERTY_BILL", "Property Bill"), onClick: () => go(QUICK_PAY_URL("property")) },
        { id: "qp-garbage", label: tt("SITE_NAV_GARBAGE_BILL", "Garbage Bill"), onClick: () => go(QUICK_PAY_URL("garbage")) },
        { id: "qp-info", label: tt("SITE_NAV_PAY_INFO", "Payment Instructions"), onClick: to(ROUTES.paymentInstructions) },
      ],
    },
    {
      id: "support",
      label: tt("SITE_NAV_SUPPORT", "Support"),
      children: [
        links.grievance && { id: "grievance", label: tt("SITE_NAV_GRIEVANCE", "Grievance"), onClick: () => go(links.grievance) },
        { id: "faq", label: tt("SITE_NAV_FAQ", "FAQ"), onClick: to(ROUTES.faq) },
        { id: "contact", label: tt("SITE_NAV_CONTACT", "Contact Us"), onClick: to(ROUTES.contact) },
      ].filter(Boolean),
    },
  ].filter(Boolean);

  const mark = (item) => {
    const own = item.id === activeId;
    const child = item.children && item.children.some((c) => c.id === activeId);
    return { ...item, active: own || child };
  };
  return items.map(mark);
};

export const buildFooterColumns = ({ t, go, servicesTop = [], links = {} }) => {
  const tt = (k, d) => t(k, { defaultValue: d });
  const to = (url) => () => go(url);
  return [
    {
      id: "services",
      title: tt("SITE_NAV_SERVICES", "Services"),
      links: servicesTop.map((it) => ({ id: it.url, label: it.label, onClick: () => go(it.url) })),
    },
    {
      id: "information",
      title: tt("SITE_FOOTER_INFO", "Information"),
      links: [
        { id: "about", label: tt("SITE_NAV_ABOUT", "About Us"), onClick: to(ROUTES.about) },
        { id: "notifications", label: tt("SITE_NAV_NOTIFICATIONS", "Notifications & Orders"), onClick: to(ROUTES.notifications) },
        { id: "acts", label: tt("SITE_NAV_ACTS", "Acts & Rules"), onClick: to(ROUTES.acts) },
        { id: "faq", label: tt("SITE_NAV_FAQ", "FAQ"), onClick: to(ROUTES.faq) },
      ],
    },
    {
      id: "support",
      title: tt("SITE_NAV_SUPPORT", "Support"),
      links: [
        { id: "contact", label: tt("SITE_NAV_CONTACT", "Contact Us"), onClick: to(ROUTES.contact) },
        { id: "manual", label: tt("SITE_NAV_USER_MANUAL", "User Manual / Guide"), onClick: to(ROUTES.userManual) },
        { id: "pay", label: tt("SITE_NAV_PAY_INFO", "Payment Instructions"), onClick: to(ROUTES.paymentInstructions) },
        links.chat && { id: "chat", label: tt("LANDING_CTA_CHAT", "Chat with assistant"), onClick: () => go(links.chat) },
      ].filter(Boolean),
    },
  ];
};

export const buildLegalLinks = ({ t, go }) => {
  const tt = (k, d) => t(k, { defaultValue: d });
  return [
    { id: "policy", label: tt("SITE_NAV_WEBSITE_POLICY", "Website Policy"), onClick: () => go(ROUTES.websitePolicy) },
    { id: "privacy", label: tt("SITE_NAV_PRIVACY", "Privacy Policy"), onClick: () => go(ROUTES.privacy) },
    { id: "a11y", label: tt("LANDING_FOOTER_A11Y", "Accessibility Statement"), onClick: () => go(ROUTES.accessibility) },
  ];
};

export const documentUrl = (file) => `${DOCUMENT_BASE}${file}`;
