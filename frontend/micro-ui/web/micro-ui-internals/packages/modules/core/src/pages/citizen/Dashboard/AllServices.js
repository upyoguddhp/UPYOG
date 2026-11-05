import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import Icon from "../Home/Landing/Icons";
import SevaLoader from "../../../components/SevaLoader";
import { DASH_BASE } from "./helpers";

/* How each MDMS menu parent (module) is presented: i18n key suffix, icon, group, colour tone */
const SERVICE_META = {
  PROPERTY: { title: "Property Tax", desc: "Register a property, pay tax and track your properties.", icon: "building", group: "tax", tone: "blue" },
  MCollect: { title: "Municipal Collections", desc: "Search and pay a challan raised by your municipality.", icon: "pay", group: "tax", tone: "green" },
  NewTL: { title: "Trade Licence", desc: "Apply for a trade licence for your shop or business.", icon: "cert", group: "licence", tone: "saffron" },
  NOC: { title: "No Objection Certificate", desc: "Apply for a NOC and follow its status.", icon: "doc", group: "licence", tone: "blue" },
  FireNoc: { title: "Fire NOC", desc: "Apply for a fire safety certificate.", icon: "shield", group: "licence", tone: "saffron" },
  ADVT: { title: "Advertisement", desc: "Book hoardings, canopies and advertisement space.", icon: "megaphone", group: "licence", tone: "green" },
  PTR: { title: "Pet Registration", desc: "Register your pet and keep vaccination records.", icon: "paw", group: "civic", tone: "saffron" },
  GB: { title: "Garbage Collection", desc: "Apply for door-to-door garbage collection.", icon: "leaf", group: "civic", tone: "green" },
  PGR: { title: "Grievances", desc: "Report a problem and follow up until it is fixed.", icon: "megaphone", group: "civic", tone: "blue" },
  GRIEVANCE: { title: "Grievances", desc: "Report a problem and follow it up until it is fixed.", icon: "megaphone", group: "civic", tone: "blue" },
  HPNOC: { title: "NOC Services", desc: "Apply for an electricity No Objection Certificate and follow its status.", icon: "doc", group: "licence", tone: "blue" },
  REQSVC: { title: "Request Services", desc: "Request services such as septic tank cleaning, rallies and public events.", icon: "list", group: "civic", tone: "saffron" },
  BOOKING: { title: "Bookings", desc: "Book advertisement sites and community halls.", icon: "calendar", group: "civic", tone: "blue" },
  OTS: { title: "One Time Settlement", desc: "Apply to settle your shop loan dues under the scheme.", icon: "list", group: "civic", tone: "saffron" },
  FEEDBACK: { title: "Feedback", desc: "Tell us how a service worked for you.", icon: "list", group: "civic", tone: "green" },
  "chb-services": { title: "Community Hall Booking", desc: "Check availability and book a community hall.", icon: "calendar", group: "civic", tone: "blue" },
};
const FALLBACK_META = { desc: "", icon: "list", group: "civic", tone: "blue" };
const GROUPS = [
  { id: "tax", title: "Property & payments" },
  { id: "licence", title: "Licences & permits" },
  { id: "civic", title: "Civic services" },
];

/**
 * Signed-in "All services" page: every enabled service from the citizen menu (MDMS actions-test,
 * url "digit-ui-card") as a card with its quick links. Rendered inside CitizenShell.
 * `linkData` = { [parentModule]: [{ name, displayName, navigationURL, orderNumber }] }
 */
const AllServices = ({ linkData, isLoading }) => {
  const { t } = useTranslation();
  const tt = (k, d, o) => t(k, { defaultValue: d, ...(o || {}) });
  const history = useHistory();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");

  const services = useMemo(
    () =>
      Object.keys(linkData || {})
        .map((code) => {
          const meta = SERVICE_META[code] || { ...FALLBACK_META, title: code };
          const links = [...linkData[code]].sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
          return {
            code,
            ...meta,
            name: tt(`ALLSVC_M_${code}`, meta.title),
            about: meta.desc ? tt(`ALLSVC_D_${code}`, meta.desc) : "",
            links: links.map((l) => ({ ...l, label: tt(l.name, l.displayName || l.name) })),
          };
        })
        .filter((s) => s.links.length),
    [linkData, t]
  );

  const q = query.trim().toLowerCase();
  const shown = services.filter(
    (s) => (group === "all" || s.group === group) && (!q || [s.name, s.about, ...s.links.map((l) => l.label)].join(" ").toLowerCase().includes(q))
  );
  const groups = GROUPS.filter((g) => services.some((s) => s.group === g.id));
  const open = (url) => url && history.push(url);

  if (isLoading) return <SevaLoader message={tt("ALLSVC_LOADING", "Loading services...")} />;

  return (
    <div className="AllSvc">
      <header className="AllSvc__head">
        <div>
          <h1>{tt("ALLSVC_TITLE", "All services")}</h1>
          <p>{tt("ALLSVC_SUB", "Apply, pay and track — everything the municipality offers, in one place.")}</p>
        </div>
        <span className="AllSvc__count">{tt("ALLSVC_COUNT", "{{count}} services", { count: services.length })}</span>
      </header>

      <div className="AllSvc__bar">
        <label className="AllSvc__search">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tt("ALLSVC_SEARCH", "Search a service, e.g. trade licence")}
            aria-label={tt("ALLSVC_SEARCH", "Search a service, e.g. trade licence")}
          />
        </label>
        <div className="AllSvc__chips" role="tablist">
          {[{ id: "all", title: "All" }, ...groups].map((g) => (
            <button key={g.id} type="button" role="tab" aria-selected={group === g.id} className={group === g.id ? "is-on" : ""} onClick={() => setGroup(g.id)}>
              {g.id === "all" ? tt("ALLSVC_ALL", "All") : tt(`ALLSVC_G_${g.id}`, g.title)}
            </button>
          ))}
        </div>
      </div>

      {services.length === 0 ? (
        <div className="AllSvc__empty" role="alert">
          <Icon name="info" size={28} />
          <h2>{tt("ALLSVC_EMPTY", "No services are available right now")}</h2>
          <p>{tt("ALLSVC_EMPTY_HINT", "Please try again in a moment.")}</p>
          <button type="button" className="DashBtn DashBtn--primary" onClick={() => window.location.reload()}>{tt("ALLSVC_RETRY", "Try again")}</button>
        </div>
      ) : shown.length === 0 ? (
        <div className="AllSvc__empty">
          <Icon name="search" size={28} />
          <h2>{tt("ALLSVC_NO_RESULTS", "No service matches your search")}</h2>
          <button type="button" className="DashBtn" onClick={() => { setQuery(""); setGroup("all"); }}>{tt("ALLSVC_CLEAR", "Clear search")}</button>
        </div>
      ) : (
        <div className="AllSvc__grid">
          {shown.map((s) => {
            const [primary, ...rest] = s.links;
            return (
              <article key={s.code} className={`AllSvc__card AllSvc__card--${s.tone}`}>
                <div className="AllSvc__top">
                  <span className="AllSvc__icon" aria-hidden="true"><Icon name={s.icon} size={26} /></span>
                  <h2>{s.name}</h2>
                </div>
                {s.about ? <p className="AllSvc__about">{s.about}</p> : null}
                <div className="AllSvc__actions">
                  <button type="button" className="AllSvc__primary" onClick={() => open(primary.navigationURL)}>
                    {primary.label}
                    <Icon name="arrow" size={16} />
                  </button>
                  {rest.map((l) => (
                    <button type="button" className="AllSvc__link" key={l.id || l.name} onClick={() => open(l.navigationURL)}>{l.label}</button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllServices;
