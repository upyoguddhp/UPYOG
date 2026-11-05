import { CardLabel, CardLabelError, Dropdown, TextInput, Toast } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { BKG_SERVICES } from "../config/bookingConfig";
import { bkgText } from "../config/bookingMessages";
import { AssetApi, apiErrorMessage, categoriesOf, fmtDate, getUserDefaults, secondsToYmd, todayYmd, validatePage } from "../utils/booking";
import BookingShell from "./BookingShell";
import { BKGEstimate, BKGLoading, BKGLookupError, BKGSelection } from "./BookingParts";
import { BKGHelp } from "./BookingLayout";

// Generic form step (booking dates, applicant, address) driven by BKG_SERVICES[svc].pages.
const BookingStep = ({ t, svc, pageKey, onSelect, formData = {} }) => {
  const tt = (k, p) => bkgText(t, k, p);
  const page = BKG_SERVICES[svc].pages.find((p) => p.key === pageKey);
  const sel = ((formData.select || {})[svc] || {});
  const saved = formData[pageKey] || {};
  const [values, setValues] = useState(() => {
    if (pageKey !== "applicant") return { ...saved };
    const d = getUserDefaults();
    return { ...d, ...Object.keys(saved).reduce((o, k) => (saved[k] ? { ...o, [k]: saved[k] } : o), {}) };
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const isAssetBooking = svc === "asset" && pageKey === "booking";
  const booked = useQuery(["BKG_BOOKED", sel.applicationNo], () => AssetApi.bookedDates(sel.applicationNo), { enabled: isAssetBooking && !!sel.applicationNo, refetchOnWindowFocus: false, retry: 1 });
  const cats = useQuery(["BKG_CATEGORIES", sel.applicationNo], () => AssetApi.categories(sel.applicationNo), { enabled: isAssetBooking && !!sel.applicationNo, refetchOnWindowFocus: false, retry: 1 });
  const bookedDates = ((booked.data || {}).bookedDates || []).map(String);
  const categories = categoriesOf(cats.data);
  const category = categories.find((c) => c.code === values.bookingFor);

  const setField = (field, value) => {
    setValues((v) => {
      const next = { ...v, [field.name]: field.upper ? String(value).toUpperCase() : value };
      if (field.name === "fromDate" && next.toDate && next.toDate < value) next.toDate = "";
      return next;
    });
    setErrors((e) => ({ ...e, [field.name]: undefined }));
  };

  const optionsFor = (field) => {
    if (field.optionsFrom === "bookingFor") return categories.map((c) => ({ code: c.code, label: c.name || c.code }));
    return (field.options || []).map((o) => ({ ...o, label: o.i18nKey }));
  };

  const minDate = (field) => {
    if (field.minFrom) return values[field.minFrom] || todayYmd();
    const start = svc === "site" && sel.bookingPeriodStartDate ? secondsToYmd(sel.bookingPeriodStartDate) : "";
    return start && start > todayYmd() ? start : todayYmd();
  };
  const maxDate = () => (svc === "site" && sel.bookingPeriodEndDate ? secondsToYmd(sel.bookingPeriodEndDate) : undefined);

  const onNext = () => {
    const found = validatePage(page, values, { svc, site: sel, bookedDates });
    setErrors(found);
    if (Object.keys(found).length) {
      setToast({ error: true, label: tt("BKG_FIX_ERRORS") });
      return;
    }
    onSelect(pageKey, values);
  };

  const control = (field) => {
    const value = values[field.name];
    if (field.type === "date") {
      return <TextInput name={field.name} type="date" value={value || ""} min={minDate(field)} max={maxDate()} onChange={(e) => setField(field, e.target.value)} />;
    }
    if (field.type === "select") {
      const options = optionsFor(field);
      const loading = field.optionsFrom && cats.isLoading;
      return (
        <Dropdown
          option={options}
          optionKey="label"
          selected={options.find((o) => o.code === value)}
          disable={!!loading}
          select={(o) => setField(field, o.code)}
          t={(k) => tt(k)}
          placeholder={field.optionsFrom && !loading && options.length === 0 ? tt("BKG_NO_OPTIONS") : tt("BKG_SELECT")}
        />
      );
    }
    return (
      <TextInput
        name={field.name}
        value={value || ""}
        maxlength={field.maxLength}
        onChange={(e) => setField(field, field.digitsOnly ? e.target.value.replace(/\D/g, "") : e.target.value)}
      />
    );
  };

  const upcomingBooked = bookedDates.filter((d) => d >= todayYmd()).sort().slice(0, 12);

  return (
    <BookingShell t={t} svc={svc} pageKey={pageKey} onNext={onNext}>
      {pageKey === "booking" ? <BKGSelection t={t} svc={svc} sel={sel} /> : null}
      {isAssetBooking && (booked.isLoading || cats.isLoading) ? <BKGLoading t={t} message={tt("BKG_LOADING_AVAILABILITY")} /> : null}
      {isAssetBooking && booked.isError ? <BKGLookupError t={t} message={apiErrorMessage(booked.error, tt("BKG_AVAIL_FAILED"))} onRetry={() => booked.refetch()} /> : null}
      {isAssetBooking && cats.isError ? <BKGLookupError t={t} message={apiErrorMessage(cats.error, tt("BKG_RATES_FAILED"))} onRetry={() => cats.refetch()} /> : null}
      {isAssetBooking && booked.isSuccess ? (
        <div className="bkg-booked" aria-live="polite">
          <strong>{tt("BKG_BOOKED_TITLE")}</strong>
          {upcomingBooked.length ? (
            <ul>{upcomingBooked.map((d) => <li key={d}>{fmtDate(d)}</li>)}</ul>
          ) : (
            <span>{tt("BKG_BOOKED_NONE")}</span>
          )}
          <small>{tt("BKG_HALL_MAX_NOTE")}</small>
        </div>
      ) : null}

      <div className="npt-grid npt-grid--3">
        {page.fields.map((field) => {
          const err = errors[field.name];
          return (
            <div className={`npt-field${err ? " has-error" : ""}`} key={field.name}>
              <CardLabel>
                {tt(`BKG_F_${field.name}`)}
                {field.required ? <span className="npt-req" aria-hidden="true"> *</span> : null}
                {field.pattern === "gst" || field.pattern === "ifsc" ? <BKGHelp id={`bkg-h-${field.name}`} text={tt(`BKG_H_${field.name}`)} /> : null}
              </CardLabel>
              {control(field)}
              {err ? <CardLabelError>{tt(err)}</CardLabelError> : null}
            </div>
          );
        })}
      </div>

      {pageKey === "booking" ? <BKGEstimate t={t} svc={svc} sel={sel} booking={values} category={category} /> : null}
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </BookingShell>
  );
};

export default BookingStep;
