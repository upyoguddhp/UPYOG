import { useCallback, useEffect, useRef, useState } from "react";
import { classifyStatus, humanise } from "./helpers";
import { APPLICATION_SOURCES, BILL_SOURCES, isSourceOn } from "./sources";

const asArray = (v) => (Array.isArray(v) ? v : []);

/** Each source resolves to { items } or { error } so one failing service never blanks the page. */
const settle = (key, label, run) =>
  Promise.resolve()
    .then(run)
    .then((items) => ({ key, label, items: asArray(items), error: null }))
    .catch((e) => ({ key, label, items: [], error: e?.response?.data?.Errors?.[0]?.message || e?.message || "Failed" }));

/** Turns a configured application source into rows in the shape the dashboard draws. */
const loadApplications = (source, ctx) => () =>
  source.fetch(ctx).then((res) =>
    asArray(source.list(res)).map((rec) => {
      const row = source.map(rec);
      return {
        ...row,
        kind: source.key,
        service: source.service,
        statusLabel: humanise(row.status),
        updatedMs: row.updatedMs || row.createdMs,
        href: typeof source.href === "function" ? source.href(rec) : source.href,
        ...classifyStatus(row.status),
      };
    })
  );

/** "No bill found" is a normal answer, not an error. */
const loadBill = ({ code, label }, { tenantId, mobileNumber }) => () =>
  Digit.PaymentService.fetchBill(tenantId, { businessService: code, ...(mobileNumber ? { mobileNumber } : {}) })
    .then((res) =>
      asArray(res?.Bill).map((b) => {
        const details = asArray(b.billDetails);
        const dueMs = details.map((d) => d.expiryDate || d.toPeriod).filter(Boolean).sort((a, z) => a - z)[0];
        return {
          id: `${code}-${b.consumerCode || b.id}`,
          code,
          label,
          consumerCode: b.consumerCode,
          amount: Number(b.totalAmount) || 0,
          dueMs,
          href: "/digit-ui/citizen/hppay/dues",
        };
      })
    )
    .catch((e) => {
      const msg = JSON.stringify(e?.response?.data || e?.message || "");
      if (/NO_BILL|no bill|BILL_NOT_FOUND|EG_BS_BILL_NO_DEMANDS|No demand/i.test(msg)) return [];
      throw e;
    });

/**
 * Loads everything the citizen dashboard shows, driven by ./sources.js.
 * Pass the signed-in user's { tenantId, mobileNumber } and the MDMS-enabled module codes
 * (`enabledModules`, undefined while unknown). Returns { loading, applications, dues, errors, reload }.
 */
export const useDashboardData = ({ tenantId, mobileNumber, uuid, enabledModules, ready = true }) => {
  const [state, setState] = useState({ loading: true, applications: [], dues: [], errors: [] });
  const alive = useRef(true);
  const run = useRef(0);
  const modulesKey = (enabledModules || []).join("|");

  const load = useCallback(() => {
    if (!ready) return;
    if (!tenantId) {
      setState({ loading: false, applications: [], dues: [], errors: [] });
      return;
    }
    const ctx = { tenantId, mobileNumber, uuid };
    const mine = ++run.current;
    setState((s) => ({ ...s, loading: true }));
    const appSources = APPLICATION_SOURCES.filter((s) => isSourceOn(s, enabledModules));
    const billSources = BILL_SOURCES.filter((s) => isSourceOn(s, enabledModules));
    Promise.all([
      ...appSources.map((s) => settle(s.key, s.label, loadApplications(s, ctx))),
      ...billSources.map((b) => settle(`bill-${b.code}`, b.label, loadBill(b, ctx))),
    ]).then((results) => {
      if (!alive.current || mine !== run.current) return;
      const apps = results.filter((r) => !r.key.startsWith("bill-")).flatMap((r) => r.items);
      const dues = results.filter((r) => r.key.startsWith("bill-")).flatMap((r) => r.items);
      apps.sort((a, b) => (b.updatedMs || 0) - (a.updatedMs || 0));
      setState({
        loading: false,
        applications: apps,
        dues: dues.filter((d) => d.amount > 0),
        errors: results.filter((r) => r.error).map((r) => ({ key: r.key, label: r.label, message: r.error })),
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, mobileNumber, uuid, modulesKey, ready]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  return { ...state, reload: load };
};
