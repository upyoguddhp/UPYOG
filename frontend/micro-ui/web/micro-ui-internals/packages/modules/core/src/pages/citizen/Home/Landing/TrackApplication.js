import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "./Icons";
import { QUICK_PAY_URL } from "../../Website/config";

const TABS = ["property", "garbage", "track"];

/** Open (no-login) bill search used by the existing portal's Quick Pay. */
const searchBills = async (type, { id, mobile }) => {
  if (type === "garbage") {
    const res = await fetch("/garbage-service/garbage-accounts/open/_search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchCriteriaGarbageAccount: {
          applicationNumber: id ? [id] : [],
          mobileNumber: mobile ? [mobile] : [],
          isActiveAccount: true,
          isActiveSubAccount: true,
        },
      }),
    });
    const data = await res.json();
    if (data?.Errors?.length) throw new Error(data.Errors.map((e) => e.message).join(", "));
    return (data?.applicationDetails || []).map((a) => ({
      id: a.applicationNumber,
      owner: a.userDetails?.OwnerName || a.userDetails?.UserName || "",
      bills: (a.bills || []).map((b) => ({ amount: Number(b.totalAmount || 0), status: b.status })),
    }));
  }
  const res = await fetch("/property-services/property/open/property-bills-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ propertyId: id || "", mobileNumber: mobile || "" }),
  });
  const data = await res.json();
  if (data?.Errors?.length) throw new Error(data.Errors.map((e) => e.message).join(", "));
  return (data?.properties || []).map((p) => ({
    id: p.propertyId,
    owner: p.owners?.[0]?.propertyOwnerName || "",
    bills: (data.bills || [])
      .filter((b) => b.consumerCode === p.propertyId)
      .map((b) => ({ amount: (b.billDetails || []).reduce((s, d) => s + Number(d.amount || 0), 0), status: b.status })),
  }));
};

/**
 * Hero card with three tabs: Property bill, Garbage bill (fields of the portal's Quick Pay)
 * and Track application.
 */
const TrackApplication = ({ onTrack }) => {
  const { t } = useTranslation();
  const tt = (key, text) => t(key, { defaultValue: text });
  const [tab, setTab] = useState("property");
  const [form, setForm] = useState({ id: "", mobile: "", status: "ACTIVE" });
  const [trackValue, setTrackValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const labels = {
    property: { tab: tt("LANDING_TAB_PROPERTY", "Property Bill"), id: tt("LANDING_PROP_ID", "Property ID"), ph: "PID/1234", title: tt("LANDING_PROP_TITLE", "Property bill") },
    garbage: { tab: tt("LANDING_TAB_GARBAGE", "Garbage Bill"), id: tt("LANDING_GARB_ID", "Garbage ID"), ph: "GB/HP/1234", title: tt("LANDING_GARB_TITLE", "Garbage bill") },
    track: { tab: tt("LANDING_TAB_TRACK", "Track Application") },
  };

  const switchTab = (k) => {
    setTab(k);
    setError("");
    setResults(null);
  };

  const submitBill = async (e) => {
    e.preventDefault();
    const id = form.id.trim();
    if (!id && !form.mobile) return setError(tt("LANDING_BILL_ERR_ANY", `Enter the ${labels[tab].id} or a mobile number`));
    if (form.mobile && !/^[0-9]{10}$/.test(form.mobile)) return setError(tt("LANDING_BILL_ERR_MOBILE", "Enter a 10 digit mobile number"));
    setError("");
    setLoading(true);
    try {
      const list = await searchBills(tab, { id, mobile: form.mobile });
      const want = (b) => (form.status === "PAID" ? b.status === "PAID" : ["ACTIVE", "PARTIALLY_PAID"].includes(b.status));
      const rows = list.map((r) => ({ ...r, bills: r.bills.filter(want) })).filter((r) => r.bills.length);
      setResults(rows);
    } catch (err) {
      setResults(null);
      setError(err.message || tt("LANDING_BILL_ERR_FETCH", "Could not fetch bills right now. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const submitTrack = (e) => {
    e.preventDefault();
    const v = trackValue.trim();
    if (v.length < 5) return setError(tt("LANDING_TRACK_ERROR", "Enter your application number"));
    setError("");
    onTrack(v);
  };

  return (
    <aside className="LandingTrack LandingTrack--tabs">
      <div className="LandingTrack__tabs" role="tablist">
        {TABS.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "is-active" : ""} onClick={() => switchTab(k)}>
            {labels[k].tab}
          </button>
        ))}
      </div>

      {tab === "track" ? (
        <form onSubmit={submitTrack} noValidate>
          <h3>{tt("LANDING_TRACK_TITLE", "Track your application")}</h3>
          <label htmlFor="landing-track-input" className="sr-only">{tt("LANDING_TRACK_LABEL", "Application number")}</label>
          <input
            id="landing-track-input"
            type="text"
            value={trackValue}
            onChange={(e) => setTrackValue(e.target.value)}
            placeholder={tt("LANDING_TRACK_PLACEHOLDER", "e.g. PB-PGR-2025-00123")}
            aria-invalid={!!error}
          />
          {error && <span className="LandingTrack__error" role="alert">{error}</span>}
          <button type="submit" className="LandingBtn LandingBtn--navy">
            <Icon name="search" size={18} /> {tt("LANDING_TRACK_CTA", "Track status")}
          </button>
        </form>
      ) : (
        <form onSubmit={submitBill} noValidate>
          <h3>{tt("LANDING_BILL_TITLE", "Search and pay your municipal bill")}</h3>
          <label htmlFor="lb-id">{tt("LANDING_BILL_BY", "Search by")} {labels[tab].id}</label>
          <input id="lb-id" type="text" value={form.id} placeholder={labels[tab].ph} autoComplete="off" onChange={(e) => setForm({ ...form, id: e.target.value })} />
          <label htmlFor="lb-mobile">{tt("LANDING_BILL_MOBILE", "Search by mobile number")}</label>
          <input
            id="lb-mobile"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.mobile}
            placeholder={tt("LANDING_BILL_MOBILE_PH", "10 digit mobile number")}
            onChange={(e) => /^[0-9]*$/.test(e.target.value) && setForm({ ...form, mobile: e.target.value })}
          />
          <fieldset className="LandingTrack__status">
            <legend>{tt("LANDING_BILL_STATUS", "Filter by status")}</legend>
            {[["ACTIVE", tt("LANDING_BILL_PENDING", "Pending")], ["PAID", tt("LANDING_BILL_PAID", "Paid")]].map(([v, l]) => (
              <label key={v}>
                <input type="radio" name="lb-status" value={v} checked={form.status === v} onChange={() => setForm({ ...form, status: v })} /> {l}
              </label>
            ))}
          </fieldset>
          {error && <span className="LandingTrack__error" role="alert">{error}</span>}
          <button type="submit" className="LandingBtn LandingBtn--navy" disabled={loading}>
            <Icon name="search" size={18} /> {loading ? tt("LANDING_BILL_SEARCHING", "Searching...") : tt("LANDING_BILL_SEARCH", "Search Bill")}
          </button>

          {results && (
            <div className="LandingTrack__results" aria-live="polite">
              {results.length === 0 ? (
                <p>{tt("LANDING_BILL_NONE", "No bills found for these details.")}</p>
              ) : (
                results.map((r) => {
                  const total = r.bills.reduce((s, b) => s + b.amount, 0);
                  return (
                    <div key={r.id} className="LandingTrack__row">
                      <span><strong>{r.id}</strong>{r.owner ? ` · ${r.owner}` : ""}</span>
                      <span>{r.bills.length} {tt("LANDING_BILL_COUNT", "bill(s)")} · ₹ {total.toLocaleString("en-IN")}</span>
                    </div>
                  );
                })
              )}
              {results.length > 0 && (
                <a className="LandingBtn LandingBtn--primary" href={QUICK_PAY_URL(tab)} target="_blank" rel="noopener noreferrer">
                  {form.status === "PAID" ? tt("LANDING_BILL_RECEIPT", "Download receipt") : tt("LANDING_BILL_PAY", "Pay now")}
                </a>
              )}
            </div>
          )}
        </form>
      )}
    </aside>
  );
};

export default TrackApplication;
