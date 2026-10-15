import { API } from "./config";

const json = async (url, options) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
};

/** type: "notification" | "service" | "sop" */
export const fetchNotifications = async (type) => {
  const res = await json(API.notifications, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notification_type: type }),
  });
  return res?.status ? res.data || [] : [];
};

export const fetchUserManuals = async () => {
  const res = await json(API.userManual);
  return res?.status ? res.data || [] : [];
};

/** Opens a stored document (served by the document service) in a new tab. */
export const viewDocument = async ({ documentId, objectId, serviceName = "WEBSITE_CONTENT", documentType = "CITIZ" }) => {
  const res = await fetch(API.fetchDocument, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceName, objectId, documentId, documentType }),
  });
  if (!res.ok) throw new Error("Failed to fetch document");
  const blob = await res.blob();
  window.open(window.URL.createObjectURL(blob), "_blank", "noopener");
};
