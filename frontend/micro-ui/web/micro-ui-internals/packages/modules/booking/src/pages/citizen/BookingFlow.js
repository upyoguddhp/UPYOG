import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useHistory, useLocation, useParams, useRouteMatch } from "react-router-dom";
import { BKG_SERVICES } from "../../config/bookingConfig";
import BookingDocuments from "../../pageComponents/BookingDocuments";
import BookingSelect from "../../pageComponents/BookingSelect";
import BookingStep from "../../pageComponents/BookingStep";
import BookingAcknowledgement from "./Acknowledgement";
import BookingCheckPage from "./CheckPage";

const idOf = (svc, s) => (s ? (svc === "site" ? s.uuid : s.applicationNo) : "");

// New booking: choose the site / hall, one route per step (session backed), documents, review, acknowledgement.
const BookingFlow = () => {
  const { t } = useTranslation();
  const { svc } = useParams();
  const cfg = BKG_SERVICES[svc];
  const match = useRouteMatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(cfg.sessionKey, {});
  const pages = cfg.pages;

  // leaving the flow re-arms the "Before you apply" popup for the next visit
  React.useEffect(() => () => {
    try { sessionStorage.removeItem(`bkg_tips_seen_${svc}`); } catch (e) {}
  }, []);

  const handleSelect = (key, data) => {
    let next;
    if (key === "select") {
      // a different site / hall invalidates everything typed for the previous one
      const same = idOf(svc, (params.select || {})[svc]) === idOf(svc, data[svc]);
      next = same ? { ...params, select: data } : { select: data };
    } else {
      next = { ...params, [key]: { ...params[key], ...data } };
    }
    setParams(next);
    const current = pathname.split("/").pop();
    const i = pages.findIndex((p) => p.route === current);
    history.push(`${match.url}/${(pages[i + 1] || {}).route || "check"}`);
  };

  const hasSelection = !!idOf(svc, (params.select || {})[svc]);

  return (
    <Switch>
      {pages.map((page) => (
        <Route path={`${match.path}/${page.route}`} key={page.route}>
          {page.key !== "select" && !hasSelection ? (
            <Redirect to={`${match.url}/select`} />
          ) : page.custom === "select" ? (
            <BookingSelect t={t} svc={svc} formData={params} onSelect={handleSelect} />
          ) : page.custom === "documents" ? (
            <BookingDocuments t={t} svc={svc} onSelect={handleSelect} />
          ) : (
            <BookingStep t={t} svc={svc} pageKey={page.key} formData={params} onSelect={handleSelect} />
          )}
        </Route>
      ))}
      <Route path={`${match.path}/check`}>
        <BookingCheckPage t={t} svc={svc} params={params} setParams={setParams} basePath={match.url} />
      </Route>
      <Route path={`${match.path}/acknowledgement`}>
        <BookingAcknowledgement t={t} svc={svc} params={params} clearParams={clearParams} root={match.url} />
      </Route>
      <Route>
        <Redirect to={`${match.url}/select`} />
      </Route>
    </Switch>
  );
};

export default BookingFlow;
