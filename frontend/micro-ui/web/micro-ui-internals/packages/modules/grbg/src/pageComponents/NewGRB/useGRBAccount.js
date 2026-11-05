import { useQuery } from "react-query";
import { GarbageApi, applicationNoOf, statusOfAccount, workflowState } from "../../utils/newGRB";

// One of the signed-in citizen's garbage accounts plus what the workflow lets them do with it right now.
export const useGRBAccount = (applicationNumber) => {
  const info = (Digit.UserService.getUser() || {}).info || {};
  const accQ = useQuery(["GRB_ACCOUNT", applicationNumber, info.mobileNumber], () => GarbageApi.searchMine(info.mobileNumber), {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const acc = ((accQ.data && accQ.data.garbageAccounts) || []).find((a) => applicationNoOf(a) === applicationNumber);
  const wfQ = useQuery(["GRB_ACCOUNT_WF", applicationNumber], () => workflowState(acc.tenantId, applicationNumber), {
    enabled: !!acc,
    refetchOnWindowFocus: false,
    retry: 0,
  });
  const status = statusOfAccount(acc);
  const actions = (wfQ.data && wfQ.data.nextActions) || [];
  return {
    acc,
    status,
    wf: wfQ.data,
    isLoading: accQ.isLoading || (!!acc && wfQ.isLoading),
    isError: accQ.isError,
    error: accQ.error,
    refetch: () => { accQ.refetch(); wfQ.refetch(); },
    // a modification starts from an approved account; an unfinished one (returned to the citizen) is simply continued
    canModify: status === "APPROVED" && actions.indexOf("RETURN_TO_INITIATOR") >= 0,
    canContinue: status === "PENDINGFORMODIFICATION" && (actions.indexOf("FORWARD_TO_VERIFIER") >= 0 || actions.indexOf("PENDING_FOR_MODIFICATION") >= 0),
    canClose: status === "APPROVED" && actions.indexOf("CLOSE") >= 0,
  };
};
