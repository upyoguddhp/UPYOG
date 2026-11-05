import { useQuery } from "react-query";
import { OTS_DMS } from "../config/otsConfig";

// Documents an applicant must upload, from the DMS service mapped to OTS
// (POST <DMS_URL>/dms/fetchServiceDocMapping {serviceName}). Base URL: globalConfigs DMS_URL.
const dmsBase = () => (window?.globalConfigs?.getConfig?.("DMS_URL") || "/hpud-dms-service").replace(/\/$/, "");

const fetchDocs = async (serviceName) => {
  const res = await fetch(`${dmsBase()}/dms/fetchServiceDocMapping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      RequestInfo: { apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token },
      serviceName,
      objectId: "",
    }),
  });
  if (!res.ok) throw new Error(`DMS ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.document) ? data.document : [];
};

export const useOTSDocuments = () => {
  const q = useQuery(["OTS_DMS_DOCS", OTS_DMS], () => fetchDocs(OTS_DMS), { staleTime: 10 * 60 * 1000, retry: 1, refetchOnWindowFocus: false });
  return { list: q.data || [], isLoading: q.isLoading, isError: q.isError };
};
