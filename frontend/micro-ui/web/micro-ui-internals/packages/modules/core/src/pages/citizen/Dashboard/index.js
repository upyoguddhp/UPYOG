import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import Icon from "../Home/Landing/Icons";
import { siteDefaults } from "../Home/Landing/config";
import SevaLoader from "../../../components/SevaLoader";
import AuthAlert from "../../../components/AuthAlert";
import { useDashboardData } from "./useDashboardData";
import { useEnabledServices } from "./useEnabledServices";
import {
  DASH_BASE,
  DASH_URL,
  daysFrom,
  firstName,
  formatDate,
  formatINR,
  greeting,
  initials,
  monthGrid,
  nextBestAction,
  sameDay,
  timeAgo,
} from "./helpers";

const FILTERS = [
  { id: "all", key: "DASH_FILTER_ALL", label: "All" },
  { id: "action", key: "DASH_FILTER_ACTION", label: "Needs action" },
  { id: "active", key: "DASH_FILTER_ACTIVE", label: "In progress" },
  { id: "done", key: "DASH_FILTER_DONE", label: "Completed" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

/* ---------- small pieces ---------- */

const Kpi = ({ icon, tone, value, label, hint, onClick, active }) => (
  <button type="button" className={`DashKpi DashKpi--${tone}${active ? " is-active" : ""}`} onClick={onClick}>
    <span className="DashKpi__icon" aria-hidden="true"><Icon name={icon} size={22} /></span>
    <span className="DashKpi__value">{value}</span>
    <span className="DashKpi__label">{label}</span>
    {hint ? <span className="DashKpi__hint">{hint}</span> : null}
  </button>
);

const Progress = ({ value, stage }) => (
  <span className={`DashBar DashBar--${stage}`} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}>
    <span style={{ width: `${value}%` }} />
  </span>
);

const AppRow = ({ app, onOpen, tt }) => {
  const chip =
    app.stage === "action" ? { cls: "warn", text: tt("DASH_CHIP_ACTION", "Action needed") }
    : app.stage === "done" ? { cls: "ok", text: tt("DASH_CHIP_DONE", "Completed") }
    : app.stage === "stopped" ? { cls: "stop", text: tt("DASH_CHIP_CLOSED", "Closed") }
    : { cls: "info", text: tt("DASH_CHIP_ACTIVE", "In progress") };
  return (
    <li className="DashApp">
      <button type="button" className="DashApp__main" onClick={() => onOpen(app.href)}>
        <span className="DashApp__title">{app.title}</span>
        <span className="DashApp__meta">
          {app.id} · {app.statusLabel || app.service}
          {app.createdMs ? ` · ${tt("DASH_APPLIED_ON", "Applied")} ${formatDate(app.createdMs)}` : ""}
        </span>
        <Progress value={app.progress} stage={app.stage} />
      </button>
      <span className={`DashChip DashChip--${chip.cls}`}>{chip.text}</span>
      <button type="button" className="DashApp__go" onClick={() => onOpen(app.href)} aria-label={`${tt("DASH_OPEN", "Open")} ${app.title}`}>
        <Icon name="arrow" size={18} />
      </button>
    </li>
  );
};

const Calendar = ({ dues, tt }) => {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [picked, setPicked] = useState(null);
  const cells = monthGrid(cursor.y, cursor.m);
  const hits = (d) => dues.filter((x) => sameDay(x.dueMs, cursor.y, cursor.m, d));
  const move = (delta) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
    setPicked(null);
  };
  const pickedItems = picked ? hits(picked) : [];
  const today = now.getFullYear() === cursor.y && now.getMonth() === cursor.m ? now.getDate() : -1;
  return (
    <section className="DashCard" aria-label={tt("DASH_CALENDAR", "Calendar")}>
      <header className="DashCard__head">
        <h2>{tt("DASH_CALENDAR", "Calendar")}</h2>
        <span className="DashCal__nav">
          <button type="button" onClick={() => move(-1)} aria-label={tt("DASH_PREV_MONTH", "Previous month")}>‹</button>
          <strong>{MONTHS[cursor.m]} {cursor.y}</strong>
          <button type="button" onClick={() => move(1)} aria-label={tt("DASH_NEXT_MONTH", "Next month")}>›</button>
        </span>
      </header>
      <div className="DashCal" role="grid">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="DashCal__dow" aria-hidden="true">{d}</span>
        ))}
        {cells.map((d, i) =>
          d ? (
            <button
              key={i}
              type="button"
              className={`DashCal__day${d === today ? " is-today" : ""}${hits(d).length ? " has-due" : ""}${picked === d ? " is-picked" : ""}`}
              onClick={() => setPicked(d === picked ? null : d)}
              aria-label={`${d} ${MONTHS[cursor.m]}${hits(d).length ? `, ${hits(d).length} due` : ""}`}
            >
              {d}
            </button>
          ) : (
            <span key={i} />
          )
        )}
      </div>
      <p className="DashCard__note">
        {picked
          ? pickedItems.length
            ? pickedItems.map((x) => `${x.label}: ${formatINR(x.amount)}`).join(" · ")
            : tt("DASH_CAL_NOTHING", "Nothing due on this day.")
          : tt("DASH_CAL_HINT", "Days with a dot have a payment due.")}
      </p>
    </section>
  );
};

/* ---------- page ---------- */

const Dashboard = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const history = useHistory();
  const user = Digit.UserService?.getUser();
  const info = user?.info || {};
  const signedIn = !!user?.access_token;

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!signedIn) history.replace({ pathname: `${DASH_BASE}/login`, search: `?from=${encodeURIComponent(DASH_URL)}` });
  }, [signedIn, history]);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // which services are active comes from MDMS (v2, then v1, then a built-in list) - see useEnabledServices
  const services = useEnabledServices({ tenantId: info.tenantId, stateId: Digit.ULBService.getStateId() });

  const { loading, applications, dues, errors, reload } = useDashboardData({
    tenantId: info.tenantId,
    mobileNumber: info.mobileNumber,
    uuid: info.uuid,
    enabledModules: services.services,
    ready: !services.loading,
  });

  const go = (url) => url && history.push(url);
  const logout = async () => {
    try {
      await Digit.UserService.logout();
    } catch (e) {
      /* session is cleared by the service either way */
    }
  };

  const totalDue = dues.reduce((s, d) => s + d.amount, 0);
  const counts = useMemo(
    () => ({
      active: applications.filter((a) => a.stage === "active" || a.stage === "action").length,
      action: applications.filter((a) => a.stage === "action").length,
      done: applications.filter((a) => a.stage === "done").length,
      grievances: applications.filter((a) => a.kind === "grievance" && (a.stage === "active" || a.stage === "action")).length,
    }),
    [applications]
  );
  const nba = useMemo(() => nextBestAction(applications, dues), [applications, dues]);

  const shown = applications.filter((a) => {
    if (filter === "action" && a.stage !== "action") return false;
    if (filter === "active" && !(a.stage === "active" || a.stage === "action")) return false;
    if (filter === "done" && a.stage !== "done") return false;
    const q = query.trim().toLowerCase();
    return !q || `${a.title} ${a.id} ${a.statusLabel}`.toLowerCase().includes(q);
  });

  const pickFilter = (id) => {
    setFilter(id);
    scrollToId("dash-apps");
  };

  if (!signedIn) return <SevaLoader fullScreen message={tt("DASH_REDIRECT_LOGIN", "Taking you to sign in...")} />;

  const nav = [
    { id: "home", icon: "home", label: tt("DASH_NAV_DASHBOARD", "Dashboard"), on: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
    { id: "apps", icon: "list", label: tt("DASH_NAV_APPLICATIONS", "My applications"), on: () => scrollToId("dash-apps") },
    { id: "dues", icon: "pay", label: tt("DASH_NAV_DUES", "Dues & payments"), on: () => scrollToId("dash-dues") },
    { id: "grv", icon: "megaphone", label: tt("DASH_NAV_GRIEVANCES", "Grievances"), on: () => go("/digit-ui/citizen/grievance/my-grievances") },
    { id: "svc", icon: "building", label: tt("DASH_NAV_SERVICES", "All services"), on: () => go(`${DASH_BASE}/all-services`) },
    { id: "me", icon: "user", label: tt("DASH_NAV_PROFILE", "Profile"), on: () => go(`${DASH_BASE}/user/profile`) },
  ];

  const nbaView = (() => {
    if (!nba) return null;
    if (nba.kind === "application")
      return {
        tone: "warn",
        title: tt("DASH_NBA_APP", "Your application needs something from you"),
        text: `${nba.item.title} · ${nba.item.id} — ${nba.item.statusLabel}`,
        cta: tt("DASH_NBA_APP_CTA", "Open application"),
        on: () => go(nba.item.href),
      };
    const days = daysFrom(nba.item.dueMs);
    return {
      tone: nba.kind === "overdue" ? "danger" : "warn",
      title: nba.kind === "overdue" ? tt("DASH_NBA_OVERDUE", "A payment is overdue") : tt("DASH_NBA_DUE_SOON", "A payment is due soon"),
      text: `${nba.item.label} · ${formatINR(nba.item.amount)} — ${days < 0 ? `${-days} ${tt("DASH_DAYS_LATE", "day(s) late")}` : days === 0 ? tt("DASH_DUE_TODAY", "due today") : `${tt("DASH_DUE_IN", "due in")} ${days} ${tt("DASH_DAYS", "day(s)")}`}`,
      cta: tt("DASH_PAY_NOW", "Pay now"),
      on: () => go(nba.item.href),
    };
  })();

  return (
    <div className="Dash">
      <a className="LandingSkip" href="#dash-main">{tt("LANDING_SKIP", "Skip to main content")}</a>

      <header className="DashTop">
        <button type="button" className="DashTop__brand" onClick={() => go(DASH_BASE)} aria-label={tt("DASH_GO_HOME", "Go to Citizen Seva home")}>
          <img src="/digit-ui/images/brand/HPLogo.png" alt="" height="38" />
          <img src="/digit-ui/images/brand/CitizenSevaLogo.png" alt="Citizen Seva" height="30" />
        </button>

        <label className="DashTop__search">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => scrollToId("dash-apps")}
            placeholder={tt("DASH_SEARCH", "Search my applications")}
            aria-label={tt("DASH_SEARCH", "Search my applications")}
          />
        </label>

        <div className="DashTop__user" ref={menuRef}>
          <button type="button" className="DashTop__avatarBtn" onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu}>
            <span className="DashTop__avatar" aria-hidden="true">{initials(info.name)}</span>
            <span className="DashTop__name">{firstName(info.name) || tt("DASH_CITIZEN", "Citizen")}</span>
          </button>
          {menu && (
            <div className="DashTop__menu" role="menu">
              <button type="button" role="menuitem" onClick={() => go(`${DASH_BASE}/user/profile`)}>{tt("DASH_NAV_PROFILE", "Profile")}</button>
              <button type="button" role="menuitem" onClick={() => go(DASH_BASE)}>{tt("DASH_PORTAL_HOME", "Portal home")}</button>
              <button type="button" role="menuitem" onClick={logout}>{tt("LANDING_LOGOUT", "Logout")}</button>
            </div>
          )}
        </div>
      </header>

      <aside className="DashSide" aria-label={tt("DASH_NAV_LABEL", "Dashboard menu")}>
        <nav>
          {nav.map((n, i) => (
            <button key={n.id} type="button" className={`DashSide__link${i === 0 ? " is-active" : ""}`} onClick={n.on} aria-current={i === 0 ? "page" : undefined}>
              <Icon name={n.icon} size={20} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="DashSide__help">
          <strong>{tt("DASH_NEED_HELP", "Need help?")}</strong>
          <p>{tt("DASH_HELPLINE", "Call")} {siteDefaults.helpline}</p>
          <small>{siteDefaults.helplineHours}</small>
        </div>
      </aside>

      <main id="dash-main" className="DashMain" tabIndex={-1} data-services-source={services.source} data-services-count={services.services.length}>
        <section className="DashHello">
          <div>
            <h1>
              {greeting()}{firstName(info.name) ? `, ${firstName(info.name)}` : ""} 👋
            </h1>
            <p>
              {loading
                ? tt("DASH_LOADING_SUB", "Fetching your latest applications and dues...")
                : nbaView
                ? tt("DASH_SUB_ATTENTION", "There is something that needs your attention today.")
                : tt("DASH_SUB_ALLGOOD", "You are all caught up. Nothing needs your attention right now.")}
            </p>
          </div>
          <button type="button" className="DashBtn DashBtn--primary" onClick={() => go(`${DASH_BASE}/all-services`)}>
            <Icon name="building" size={18} /> {tt("DASH_NEW_SERVICE", "Start a new service")}
          </button>
        </section>

        {errors.length > 0 && !loading && (
          <div className="DashAlert">
            <AuthAlert
              tone="error"
              title={tt("DASH_PARTIAL_TITLE", "Some information could not be loaded")}
              message={`${errors.map((e) => e.label).join(", ")}. ${tt("DASH_PARTIAL_BODY", "What loaded is shown below. Please try again in a moment.")}`}
              actionLabel={tt("DASH_RETRY", "Try again")}
              onAction={reload}
            />
          </div>
        )}

        {loading ? (
          <div className="DashLoading"><SevaLoader message={tt("DASH_LOADING", "Loading your dashboard...")} /></div>
        ) : (
          <React.Fragment>
            {nbaView && (
              <section className={`DashNba DashNba--${nbaView.tone}`} aria-live="polite">
                <span className="DashNba__icon" aria-hidden="true"><Icon name="alert" size={26} /></span>
                <div className="DashNba__body">
                  <strong>{nbaView.title}</strong>
                  <span>{nbaView.text}</span>
                </div>
                <button type="button" className="DashBtn DashBtn--light" onClick={nbaView.on}>{nbaView.cta}</button>
              </section>
            )}

            <section className="DashKpis" aria-label={tt("DASH_SUMMARY", "Summary")}>
              <Kpi icon="list" tone="blue" value={counts.active} label={tt("DASH_KPI_ACTIVE", "Active applications")} onClick={() => pickFilter("active")} active={filter === "active"} />
              <Kpi icon="alert" tone="amber" value={counts.action} label={tt("DASH_KPI_ACTION", "Need your action")} onClick={() => pickFilter("action")} active={filter === "action"} />
              <Kpi icon="pay" tone="red" value={formatINR(totalDue)} label={tt("DASH_KPI_DUES", "Pending dues")} hint={dues.length ? `${dues.length} ${tt("DASH_KPI_DUES_N", "bill(s)")}` : ""} onClick={() => scrollToId("dash-dues")} />
              <Kpi icon="check" tone="green" value={counts.done} label={tt("DASH_KPI_DONE", "Completed")} onClick={() => pickFilter("done")} active={filter === "done"} />
              <Kpi icon="megaphone" tone="violet" value={counts.grievances} label={tt("DASH_KPI_GRIEVANCES", "Open grievances")} onClick={() => go("/digit-ui/citizen/grievance/my-grievances")} />
            </section>

            <div className="DashGrid">
              <div className="DashCol">
                <section className="DashCard" id="dash-apps" aria-label={tt("DASH_NAV_APPLICATIONS", "My applications")}>
                  <header className="DashCard__head">
                    <h2>{tt("DASH_NAV_APPLICATIONS", "My applications")}</h2>
                    <div className="DashTabs" role="tablist">
                      {FILTERS.map((f) => (
                        <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={filter === f.id ? "is-on" : ""} onClick={() => setFilter(f.id)}>
                          {tt(f.key, f.label)}
                        </button>
                      ))}
                    </div>
                  </header>
                  {shown.length ? (
                    <ul className="DashApps">
                      {shown.map((a) => <AppRow key={`${a.kind}-${a.id}`} app={a} onOpen={go} tt={tt} />)}
                    </ul>
                  ) : (
                    <div className="DashEmpty">
                      <Icon name="doc" size={34} />
                      <strong>{applications.length ? tt("DASH_EMPTY_FILTER", "Nothing matches this view") : tt("DASH_EMPTY", "No applications yet")}</strong>
                      <span>
                        {applications.length
                          ? tt("DASH_EMPTY_FILTER_SUB", "Try another tab or clear the search.")
                          : tt("DASH_EMPTY_SUB", "When you apply for a service, you can follow it here.")}
                      </span>
                      <button type="button" className="DashBtn DashBtn--primary" onClick={() => (applications.length ? (setFilter("all"), setQuery("")) : go(`${DASH_BASE}/all-services`))}>
                        {applications.length ? tt("DASH_SHOW_ALL", "Show all") : tt("DASH_BROWSE", "Browse services")}
                      </button>
                    </div>
                  )}
                </section>

                <section className="DashCard" aria-label={tt("DASH_ACTIVITY", "Recent activity")}>
                  <header className="DashCard__head"><h2>{tt("DASH_ACTIVITY", "Recent activity")}</h2></header>
                  {applications.length ? (
                    <ul className="DashFeed">
                      {applications.slice(0, 5).map((a) => (
                        <li key={`${a.kind}-${a.id}`}>
                          <span className={`DashFeed__dot DashFeed__dot--${a.stage}`} aria-hidden="true" />
                          <span><strong>{a.title}</strong> — {a.statusLabel || tt("DASH_UPDATED", "Updated")}<small>{a.id}</small></span>
                          <time>{timeAgo(a.updatedMs)}</time>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="DashCard__note">{tt("DASH_ACTIVITY_EMPTY", "Updates on your applications will appear here.")}</p>
                  )}
                </section>
              </div>

              <div className="DashCol">
                <section className="DashCard DashDues" id="dash-dues" aria-label={tt("DASH_NAV_DUES", "Dues & payments")}>
                  <header className="DashCard__head"><h2>{tt("DASH_NAV_DUES", "Dues & payments")}</h2></header>
                  {dues.length ? (
                    <React.Fragment>
                      <p className="DashDues__total">{formatINR(totalDue)}<small>{tt("DASH_ACROSS", "across")} {dues.length} {tt("DASH_BILLS", "bill(s)")}</small></p>
                      <ul className="DashDues__list">
                        {dues.map((d) => {
                          const days = d.dueMs ? daysFrom(d.dueMs) : null;
                          return (
                            <li key={d.id}>
                              <span>
                                <strong>{d.label}</strong>
                                <small>
                                  {d.consumerCode}
                                  {days !== null ? ` · ${days < 0 ? tt("DASH_OVERDUE", "overdue") : `${tt("DASH_DUE", "due")} ${formatDate(d.dueMs, { day: "numeric", month: "short" })}`}` : ""}
                                </small>
                              </span>
                              <b className={days !== null && days < 0 ? "is-late" : ""}>{formatINR(d.amount)}</b>
                              <button type="button" className="DashBtn DashBtn--sm" onClick={() => go(d.href)}>{tt("DASH_PAY", "Pay")}</button>
                            </li>
                          );
                        })}
                      </ul>
                      <p className="DashCard__note">{tt("DASH_PAY_NOTE", "You can pay each bill securely and download the receipt afterwards.")}</p>
                    </React.Fragment>
                  ) : (
                    <div className="DashEmpty DashEmpty--tight">
                      <Icon name="check" size={30} />
                      <strong>{tt("DASH_NO_DUES", "No pending dues")}</strong>
                      <span>{tt("DASH_NO_DUES_SUB", "You have nothing to pay right now.")}</span>
                    </div>
                  )}
                </section>

                <Calendar dues={dues} tt={tt} />

                <section className="DashCard DashQuick" aria-label={tt("DASH_QUICK", "Quick actions")}>
                  <header className="DashCard__head"><h2>{tt("DASH_QUICK", "Quick actions")}</h2></header>
                  <div className="DashQuick__grid">
                    <button type="button" onClick={() => go("/digit-ui/citizen/grievance/new/grievance")}><Icon name="megaphone" size={20} />{tt("DASH_Q_GRIEVANCE", "Raise a grievance")}</button>
                    <button type="button" onClick={() => go(`${DASH_BASE}/all-services`)}><Icon name="search" size={20} />{tt("DASH_Q_TRACK", "Track application")}</button>
                    <button type="button" onClick={() => go(`${DASH_BASE}/payment-instructions`)}><Icon name="pay" size={20} />{tt("DASH_Q_PAYHELP", "How to pay")}</button>
                    <button type="button" onClick={() => go(`${DASH_BASE}/faq`)}><Icon name="help" size={20} />{tt("DASH_Q_FAQ", "Help & FAQ")}</button>
                  </div>
                </section>
              </div>
            </div>
          </React.Fragment>
        )}
      </main>

      <nav className="DashTabbar" aria-label={tt("DASH_NAV_LABEL", "Dashboard menu")}>
        {[nav[0], nav[1], nav[2], nav[4], nav[5]].map((n, i) => (
          <button key={n.id} type="button" className={i === 0 ? "is-active" : ""} onClick={n.on}>
            <Icon name={n.icon} size={22} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Dashboard;
