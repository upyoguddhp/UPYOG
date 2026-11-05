import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { bkgText } from "../config/bookingMessages";
import { AssetApi, SiteApi, apiErrorMessage, fmtDate, inr, niceName, secondsToYmd } from "../utils/booking";
import BookingShell from "./BookingShell";
import { BKGIcon } from "./BookingLayout";
import SearchSelect from "./SearchSelect";
import SitePhoto from "./SitePhoto";
import { BKGLoading, BKGLookupError } from "./BookingParts";

const PAGE = 18;

// what the session keeps of a site / hall once it is chosen
const siteSelection = (s) => ({
  uuid: s.uuid,
  siteID: s.siteID,
  siteName: s.siteName,
  siteAddress: s.siteAddress,
  siteType: s.siteType,
  ulbName: s.ulbName,
  districtName: s.districtName,
  wardNumber: s.wardNumber,
  tenantId: s.tenantId,
  sizeLength: s.sizeLength,
  sizeWidth: s.sizeWidth,
  siteCost: s.siteCost,
  gstPercnetage: (s.additionalDetail || {}).gstPercnetage,
  securityAmount: s.securityAmount,
  bookingPeriodStartDate: s.bookingPeriodStartDate,
  bookingPeriodEndDate: s.bookingPeriodEndDate,
});
const assetSelection = (a) => ({
  id: a.id,
  applicationNo: a.applicationNo,
  assetName: a.assetName,
  assetParentCategory: a.assetParentCategory,
  assetCategory: a.assetCategory,
  tenantId: a.tenantId,
  ulbName: a.ulbName || (a.tenantId || "").split(".")[1] || "",
  street: (a.addressDetails || {}).street || "",
});

const uniq = (list) => Array.from(new Set(list.filter(Boolean))).sort();

// Step 1: pick the site (advertisement) or hall (community hall) to book.
const BookingSelect = ({ t, svc, formData = {}, onSelect }) => {
  const tt = (k, p) => bkgText(t, k, p);
  const chosen = ((formData.select || {})[svc] || {});
  const [district, setDistrict] = useState("");
  const [ulb, setUlb] = useState("");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [picked, setPicked] = useState(chosen);

  const { data, isLoading, isError, error, refetch } = useQuery(["BKG_LIST", svc], svc === "site" ? SiteApi.searchSites : AssetApi.searchAssets, {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const rows = useMemo(() => (svc === "site" ? (data || {}).siteSearchResponseData || [] : (data || {}).Assets || []), [data, svc]);
  const ulbOf = (r) => (svc === "site" ? r.ulbName : r.ulbName || (r.tenantId || "").split(".")[1]);
  const kindOf = (r) => (svc === "site" ? r.siteType : r.assetParentCategory);

  const districts = useMemo(() => uniq(rows.map((r) => r.districtName)), [rows]);
  const ulbs = useMemo(() => uniq(rows.filter((r) => !district || r.districtName === district).map(ulbOf)), [rows, district]);
  const kinds = useMemo(() => uniq(rows.map(kindOf)), [rows]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!district || r.districtName === district) &&
        (!ulb || ulbOf(r) === ulb) &&
        (!kind || kindOf(r) === kind) &&
        (!term || [niceName(r.siteName), r.siteName, r.siteID, r.siteAddress, r.assetName, r.applicationNo, ulbOf(r)].join(" ").toLowerCase().includes(term))
    );
  }, [rows, district, ulb, kind, q]);

  const isPicked = (r) => (svc === "site" ? picked.uuid === r.uuid : picked.applicationNo === r.applicationNo);
  const choose = (r) => setPicked(svc === "site" ? siteSelection(r) : assetSelection(r));
  const next = () => picked && Object.keys(picked).length && onSelect("select", { [svc]: picked });
  const reset = () => { setDistrict(""); setUlb(""); setKind(""); setQ(""); setShown(PAGE); };

  return (
    <BookingShell t={t} svc={svc} pageKey="select" onNext={picked && (picked.uuid || picked.applicationNo) ? next : null} autoOpen>
      {isLoading ? <BKGLoading t={t} message={tt(svc === "site" ? "BKG_LOADING_SITES" : "BKG_LOADING_ASSETS")} /> : null}
      {isError ? <BKGLookupError t={t} message={apiErrorMessage(error, tt(svc === "site" ? "BKG_SITES_FAILED" : "BKG_ASSETS_FAILED"))} onRetry={() => refetch()} /> : null}
      {!isLoading && !isError ? (
        <React.Fragment>
          <div className="bkg-filters">
            {svc === "site" ? (
              <div className="bkg-field">
                <span>{tt("BKG_F_districtName")}</span>
                <SearchSelect value={district} options={districts.map((d) => ({ value: d, label: d }))} onChange={(v) => { setDistrict(v); setUlb(""); setShown(PAGE); }} allLabel={tt("BKG_ALL")} searchPlaceholder={tt("BKG_SEARCH_LIST")} emptyLabel={tt("BKG_NO_RESULTS")} ariaLabel={tt("BKG_F_districtName")} />
              </div>
            ) : null}
            <div className="bkg-field">
              <span>{tt("BKG_F_ulbName")}</span>
              <SearchSelect value={ulb} options={ulbs.map((d) => ({ value: d, label: d }))} onChange={(v) => { setUlb(v); setShown(PAGE); }} allLabel={tt("BKG_ALL")} searchPlaceholder={tt("BKG_SEARCH_LIST")} emptyLabel={tt("BKG_NO_RESULTS")} ariaLabel={tt("BKG_F_ulbName")} />
            </div>
            <div className="bkg-field">
              <span>{tt(svc === "site" ? "BKG_F_siteType" : "BKG_F_assetParentCategory")}</span>
              <SearchSelect value={kind} options={kinds.map((d) => ({ value: d, label: d }))} onChange={(v) => { setKind(v); setShown(PAGE); }} allLabel={tt("BKG_ALL")} searchPlaceholder={tt("BKG_SEARCH_LIST")} emptyLabel={tt("BKG_NO_RESULTS")} ariaLabel={tt(svc === "site" ? "BKG_F_siteType" : "BKG_F_assetParentCategory")} />
            </div>
            <label className="npt-search bkg-filters__search">
              <BKGIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("BKG_SEARCH_PH")} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} aria-label={tt("BKG_SEARCH_PH")} />
            </label>
          </div>
          <p className="bkg-count" aria-live="polite">{tt("BKG_RESULTS", { count: list.length })}</p>

          {list.length === 0 ? (
            <div className="npt-empty">
              <BKGIcon name="search" size={40} />
              <strong>{tt(rows.length ? "BKG_NO_RESULTS" : svc === "site" ? "BKG_NO_SITES" : "BKG_NO_ASSETS")}</strong>
              {rows.length ? <button type="button" className="npt-btn npt-btn--ghost" onClick={reset}><span>{tt("BKG_CLEAR_FILTERS")}</span></button> : null}
            </div>
          ) : (
            <ul className="bkg-cards" role="listbox" aria-label={tt(svc === "site" ? "BKG_STEP_SELECT_SITE" : "BKG_STEP_SELECT_ASSET")}>
              {list.slice(0, shown).map((r) => {
                const on = isPicked(r);
                return (
                  <li key={r.uuid || r.applicationNo || r.id} role="option" aria-selected={on}>
                    <button type="button" className={`bkg-card${on ? " is-on" : ""}`} onClick={() => choose(r)}>
                      <span className="bkg-card__ico">
                        {svc === "site" ? (
                          <SitePhoto uuid={r.uuid} alt={niceName(r.siteName)} fallback={<BKGIcon name={on ? "check" : "map"} size={22} />} />
                        ) : (
                          <BKGIcon name={on ? "check" : "building"} size={22} />
                        )}
                      </span>
                      <span className="bkg-card__main">
                        <strong>{svc === "site" ? niceName(r.siteName) : r.assetName}</strong>
                        <small>{[svc === "site" ? r.siteID : r.applicationNo, svc === "site" ? r.siteType : r.assetParentCategory].filter(Boolean).join(" · ")}</small>
                        <small>{[ulbOf(r), svc === "site" ? r.districtName : (r.addressDetails || {}).street].filter(Boolean).join(" · ")}</small>
                        {svc === "site" ? (
                          <small>
                            {[r.sizeLength && r.sizeWidth ? `${r.sizeLength} x ${r.sizeWidth}` : "", r.siteCost ? `${inr(r.siteCost)} ${tt("BKG_PER_DAY")}` : "",
                              r.bookingPeriodStartDate ? `${fmtDate(secondsToYmd(r.bookingPeriodStartDate))} - ${fmtDate(secondsToYmd(r.bookingPeriodEndDate))}` : ""].filter(Boolean).join(" · ")}
                          </small>
                        ) : null}
                      </span>
                      <span className="bkg-card__pick">{tt(on ? "BKG_SELECTED" : "BKG_SELECT_THIS")}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {list.length > shown ? (
            <div className="bkg-more"><button type="button" className="npt-btn npt-btn--ghost" onClick={() => setShown(shown + PAGE)}><span>{tt("BKG_SHOW_MORE")}</span></button></div>
          ) : null}
        </React.Fragment>
      ) : null}
    </BookingShell>
  );
};

export default BookingSelect;
