import { useQuery } from "react-query";

// Documents an applicant must upload, from the DMS service (same call OldTheme's documentUpload page makes:
// POST <DMS_URL>/dms/fetchServiceDocMapping {serviceName}). Base URL: globalConfigs DMS_URL.
export const NPR_DMS_SERVICE = "PTR";

const dmsBase = () => (window?.globalConfigs?.getConfig?.("DMS_URL") || "/hpud-dms-service").replace(/\/$/, "");

const fetchDocs = async () => {
  const res = await fetch(`${dmsBase()}/dms/fetchServiceDocMapping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      RequestInfo: { apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token },
      serviceName: NPR_DMS_SERVICE,
      objectId: "",
    }),
  });
  if (!res.ok) throw new Error(`DMS ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.document) ? data.document : [];
};

export const useNPRDocuments = () => {
  const q = useQuery(["NPR_DMS_DOCS", NPR_DMS_SERVICE], fetchDocs, { staleTime: 10 * 60 * 1000, retry: 1, refetchOnWindowFocus: false });
  return { list: q.data || [], isLoading: q.isLoading, isError: q.isError };
};
