import { useState } from "react";
import { payText } from "../config/payMessages";
import { PayApi, apiErrorMessage, buildTransaction, loadScript, razorpayConfig, razorpayConfigured, txnOf } from "../utils/pay";

// Drives one Razorpay payment: create transaction -> checkout -> confirm -> result page.
// busy = the full-screen loader text while a call is running; the result page shows the outcome.
export const usePay = ({ t, user, root, history }) => {
  const tt = (k, p) => payText(t, k, p);
  const [busy, setBusy] = useState("");

  const finish = (status, extra = {}) => {
    setBusy("");
    history.push({ pathname: `${root}/result`, state: { status, ...extra } });
  };

  const pay = async (rows) => {
    if (!razorpayConfigured()) return finish("ERROR", { message: tt("PAY_NOT_CONFIGURED"), rows });
    const cfg = razorpayConfig();
    setBusy(tt("PAY_PREPARING"));
    const loaded = await loadScript(cfg.script);
    if (!loaded) return finish("ERROR", { message: tt("PAY_SCRIPT_FAILED"), rows });

    let res;
    try {
      res = await PayApi.create(buildTransaction(rows, user), user.uuid);
    } catch (e) {
      return finish("ERROR", { message: apiErrorMessage(e, tt("PAY_CREATE_FAILED")), rows });
    }
    const txn = txnOf(res);
    if (!txn || !txn.orderId) return finish("ERROR", { message: tt("PAY_CREATE_FAILED"), rows });
    const payer = res.user || {};
    const base = { txnId: txn.txnId, amount: txn.txnAmount, rows, consumerCode: txn.consumerCode };

    const options = {
      key: cfg.key,
      amount: txn.txnAmount,
      currency: cfg.currency,
      name: payer.name || user.name,
      description: `${txn.consumerCode || ""}`,
      image: cfg.logo || undefined,
      order_id: txn.orderId,
      handler: async (response) => {
        setBusy(tt("PAY_CONFIRMING"));
        try {
          const done = await PayApi.confirm(res.callbackUrl, response);
          const status = (txnOf(done) || {}).txnStatus;
          finish(status === "SUCCESS" ? "SUCCESS" : status === "FAILURE" ? "FAILURE" : "PENDING", base);
        } catch (e) {
          finish("PENDING", { ...base, message: apiErrorMessage(e, tt("PAY_CONFIRM_FAILED")) });
        }
      },
      prefill: { name: payer.name || user.name, email: payer.emailId || user.emailId, contact: payer.mobileNumber || user.mobileNumber },
      notes: { accountId: txn.payTo, service: txn.service, ulbName: String(txn.tenantId || "").split(".").pop() },
      theme: { color: "#2f6bff" },
      modal: {
        ondismiss: async () => {
          setBusy(tt("PAY_CANCELLING"));
          try {
            await PayApi.dismiss(txn.txnId);
          } catch (e) {
            /* the gateway also expires an abandoned transaction */
          }
          finish("CANCELLED", base);
        },
      },
    };
    setBusy("");
    try {
      new window.Razorpay(options).open();
    } catch (e) {
      finish("ERROR", { message: tt("PAY_SCRIPT_FAILED"), rows });
    }
  };

  return { pay, busy };
};
