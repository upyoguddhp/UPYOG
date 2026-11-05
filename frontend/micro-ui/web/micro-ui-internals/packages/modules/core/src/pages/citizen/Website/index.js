import React from "react";
import { ROUTES } from "./config";
import Introduction from "./pages/Introduction";
import Notifications from "./pages/Notifications";
import { Acts, ByeLaws } from "./pages/ActsRules";
import { Sop, UserManual } from "./pages/UserManual";
import Rti from "./pages/Documents";
import Faq from "./pages/Faq";
import Contact from "./pages/Contact";
import Organization from "./pages/Organization";
import { PrivacyPolicy, WebsitePolicy } from "./pages/Policies";
import PaymentInstructions from "./pages/PaymentInstructions";
import QuickPay from "./pages/QuickPay";
import AccessibilityPage from "./pages/Accessibility";
import CitizenLogin from "./pages/CitizenLogin";
import SsoCallback from "./pages/SsoCallback";
import Dashboard from "../Dashboard";
import { Redirect } from "react-router-dom";

// citizens are not registered on this portal: the old register URL goes to the SSO login
const RegisterRedirect = () => <Redirect to="/digit-ui/citizen/login" />;

/** path -> page. Each page is a standalone website page (SiteShell). */
export const websitePages = {
  [ROUTES.about]: Introduction,
  "/digit-ui/citizen/about-us": Introduction,
  [ROUTES.notifications]: Notifications,
  [ROUTES.acts]: Acts,
  [ROUTES.byelaws]: ByeLaws,
  [ROUTES.userManual]: UserManual,
  [ROUTES.sop]: Sop,
  [ROUTES.rti]: Rti,
  [ROUTES.faq]: Faq,
  [ROUTES.contact]: Contact,
  [ROUTES.organization]: Organization,
  [ROUTES.websitePolicy]: WebsitePolicy,
  "/digit-ui/citizen/webiste-policy": WebsitePolicy, // spelling used by the existing portal
  [ROUTES.privacy]: PrivacyPolicy,
  [ROUTES.paymentInstructions]: PaymentInstructions,
  [ROUTES.quickPay]: QuickPay,
  [ROUTES.accessibility]: AccessibilityPage,
  "/digit-ui/citizen/login": CitizenLogin,
  "/digit-ui/citizen/register": RegisterRedirect,
  "/digit-ui/citizen/sso-callback": SsoCallback,
  "/digit-ui/citizen/dashboard": Dashboard,
};

export const getWebsitePage = (pathname = "") => websitePages[pathname.replace(/\/+$/, "")] || null;
