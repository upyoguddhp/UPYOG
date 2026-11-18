import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { format } from "date-fns";
import Icon from "../Home/Landing/Icons";
import SevaLoader from "../../../components/SevaLoader";
import AuthAlert from "../../../components/AuthAlert";
import UploadDrawer from "../Home/ImageUpload/UploadDrawer";
import { DASH_BASE, DASH_URL, initials } from "./helpers";

const NAME_RE = /^[a-zA-Z ]+$/;
const EMAIL_RE = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

/** The server may hand the date back as dd/MM/yyyy, yyyy-MM-dd or epoch ms; <input type=date> wants yyyy-MM-dd. */
const toInputDate = (v) => {
  if (v === undefined || v === null || v === "") return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(/^\d+$/.test(s) ? Number(s) : s);
  return isNaN(d) ? "" : format(d, "yyyy-MM-dd");
};

/** Standard DIGIT user-service gender codes, used when MDMS (common-masters.GenderType) has none for the tenant. */
const DEFAULT_GENDERS = ["MALE", "FEMALE", "TRANSGENDER"];

const humanise = (s = "") => String(s).replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

/**
 * Citizen profile, rendered inside CitizenShell (route /citizen/user/profile).
 * Same data and API calls as the legacy page (userSearch / updateUser / file store photo),
 * in the dashboard design. Passwords are not edited here: citizens sign in with an OTP.
 */
const Profile = ({ stateCode }) => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const history = useHistory();
  const stateId = Digit.ULBService.getStateId();
  const tenant = Digit.ULBService.getCurrentTenantId();
  const userInfo = Digit.UserService.getUser()?.info || {};

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success" | "error", text }
  const [name, setName] = useState(userInfo.name || "");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState(userInfo.emailId || "");
  const [photoId, setPhotoId] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [touched, setTouched] = useState({});
  const statusRef = useRef(null);

  const { data: genderData } = Digit.Hooks.pt.useGenderMDMS(stateId, "common-masters", "GenderType");
  const genders = useMemo(() => {
    const codes = genderData?.length ? genderData.map((g) => String(g.code)) : DEFAULT_GENDERS;
    return codes.map((code) => ({ code, label: tt(`PT_COMMON_GENDER_${code}`, humanise(code)) }));
  }, [genderData, t]);

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      if (userInfo.uuid) {
        const res = await Digit.UserService.userSearch(tenant, { uuid: [userInfo.uuid] }, {});
        const u = res?.user?.[0];
        if (u) {
          setName(u.name || userInfo.name || "");
          setGender(u.gender || "");
          setDob(toInputDate(u.dob));
          setEmail(u.emailId || userInfo.emailId || "");
          setPhotoUrl(u.photo ? String(u.photo).split(",")[0] : "");
        }
      }
    } catch (e) {
      setLoadError(e?.response?.data?.Errors?.[0]?.message || tt("DASH_PROFILE_LOAD_ERROR", "We could not load your profile details. Please try again."));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const errors = {
    name: !name.trim() ? tt("DASH_PROFILE_NAME_REQUIRED", "Enter your name.") : name.length > 50 || !NAME_RE.test(name) ? t("CORE_COMMON_PROFILE_NAME_INVALID") : "",
    email: email && !EMAIL_RE.test(email) ? t("CORE_COMMON_PROFILE_EMAIL_INVALID") : "",
    dob: dob && new Date(dob) > new Date() ? tt("DASH_PROFILE_DOB_FUTURE", "Date of birth cannot be in the future.") : "",
  };
  const invalid = Object.values(errors).some(Boolean);
  const show = (f) => touched[f] && errors[f];
  const blur = (f) => () => setTouched((s) => ({ ...s, [f]: true }));

  const notify = (type, text) => {
    setStatus({ type, text });
    setTimeout(() => statusRef.current?.focus?.(), 0);
  };

  const save = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, dob: true });
    if (invalid) return;
    setSaving(true);
    setStatus(null);
    try {
      const body = {
        ...userInfo,
        name,
        dob: dob ? dob.split("-").reverse().join("/") : undefined,
        // an empty gender string is rejected by user-service; leave the field out instead
        gender: gender || undefined,
        emailId: email,
        photo: photoId || undefined,
        locale: Digit.StoreData.getCurrentLanguage(),
      };
      const { responseInfo } = await Digit.UserService.updateUser(body, stateCode);
      if (responseInfo?.status === "200") {
        const user = Digit.UserService.getUser();
        if (user) Digit.UserService.setUser({ ...user, info: { ...user.info, name, emailId: email } });
        notify("success", t("CORE_COMMON_PROFILE_UPDATE_SUCCESS"));
      } else {
        throw new Error("not-200");
      }
    } catch (err) {
      notify("error", err?.response?.data?.Errors?.[0]?.message || t("CORE_COMMON_PROFILE_UPDATE_ERROR_WITH_PASSWORD") || tt("DASH_PROFILE_SAVE_ERROR", "Your profile could not be saved. Please try again."));
    }
    setSaving(false);
  };

  const onPhoto = async (fileStoreId) => {
    setPhotoId(fileStoreId);
    try {
      const res = await Digit.UploadServices.Filefetch([fileStoreId], stateId);
      const url = res?.data?.fileStoreIds?.[0]?.url?.split(",")[3];
      if (url) setPhotoUrl(url);
    } catch (e) {
      /* the new photo is saved with the profile either way; only the preview is missing */
    }
    setDrawer(false);
  };
  const removePhoto = () => {
    setPhotoId("");
    setPhotoUrl("");
  };

  if (loading) return <SevaLoader message={tt("DASH_PROFILE_LOADING", "Loading your profile...")} />;

  const fieldProps = (f, label) => ({
    id: `pf-${f}`,
    "aria-invalid": !!show(f),
    "aria-describedby": show(f) ? `pf-${f}-err` : undefined,
    "aria-label": label,
  });

  return (
    <div className="ProfilePage">
      <section className="DashHello ProfilePage__head">
        <div>
          <h1>{tt("DASH_NAV_PROFILE", "Profile")}</h1>
          <p>{tt("DASH_PROFILE_SUB", "Keep your details up to date so we can reach you about your applications.")}</p>
        </div>
        <button type="button" className="ProfilePage__back" onClick={() => history.push(DASH_URL)}>
          <Icon name="home" size={18} />
          <span>{tt("DASH_NAV_DASHBOARD", "Dashboard")}</span>
        </button>
      </section>

      {loadError && (
        <div className="DashAlert">
          <AuthAlert tone="error" title={tt("DASH_PROFILE_LOAD_TITLE", "Some details could not be loaded")} message={loadError} actionLabel={tt("DASH_RETRY", "Try again")} onAction={load} />
        </div>
      )}

      <div className="ProfilePage__grid">
        <section className="DashCard ProfileCard" aria-label={tt("DASH_PROFILE_SUMMARY", "Your account")}>
          <div className="ProfileCard__avatarWrap">
            {photoUrl ? <img className="ProfileCard__photo" src={photoUrl} alt="" /> : <span className="ProfileCard__initials" aria-hidden="true">{initials(name)}</span>}
            <button type="button" className="ProfileCard__camera" onClick={() => setDrawer(true)} aria-label={tt("DASH_PROFILE_CHANGE_PHOTO", "Change profile photo")}>
              <Icon name="upload" size={18} />
            </button>
          </div>
          <h2>{name || tt("DASH_CITIZEN", "Citizen")}</h2>
          <ul className="ProfileCard__facts">
            <li><Icon name="phone" size={16} /><span>{userInfo.mobileNumber || "-"}</span></li>
            <li><Icon name="mail" size={16} /><span>{email || tt("DASH_PROFILE_NO_EMAIL", "No email added")}</span></li>
          </ul>
          <span className="ProfileCard__tri" aria-hidden="true" />
          <div className="ProfileCard__links">
            <button type="button" onClick={() => history.push(`${DASH_URL}#dash-apps`)}>{tt("DASH_NAV_APPLICATIONS", "My applications")}</button>
            <button type="button" onClick={() => history.push(`${DASH_BASE}/all-services`)}>{tt("DASH_NAV_SERVICES", "All services")}</button>
          </div>
        </section>

        <section className="DashCard" aria-label={tt("DASH_PROFILE_DETAILS", "Personal details")}>
          <header className="DashCard__head"><h2>{tt("DASH_PROFILE_DETAILS", "Personal details")}</h2></header>

          {status && (
            <div ref={statusRef} tabIndex={-1} className={`ProfileForm__status is-${status.type}`} role={status.type === "error" ? "alert" : "status"}>
              {status.text}
            </div>
          )}

          <form className="ProfileForm" onSubmit={save} noValidate>
            <div className="ProfileForm__field">
              <label htmlFor="pf-name">{t("CORE_COMMON_PROFILE_NAME")} <span aria-hidden="true">*</span></label>
              <input {...fieldProps("name")} type="text" value={name} maxLength={60} autoComplete="name" required onChange={(e) => setName(e.target.value)} onBlur={blur("name")} />
              {show("name") && <p className="ProfileForm__err" id="pf-name-err" role="alert">{errors.name}</p>}
            </div>

            <div className="ProfileForm__field">
              <label htmlFor="pf-mobile">{tt("DASH_PROFILE_MOBILE", "Mobile number")}</label>
              <input id="pf-mobile" type="tel" value={userInfo.mobileNumber || ""} readOnly aria-describedby="pf-mobile-hint" />
              <p className="ProfileForm__hint" id="pf-mobile-hint">{tt("DASH_PROFILE_MOBILE_HINT", "Your mobile number is your login and cannot be changed here.")}</p>
            </div>

            <div className="ProfileForm__field">
              <label htmlFor="pf-gender">{t("CORE_COMMON_PROFILE_GENDER")}</label>
              <select id="pf-gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">{tt("DASH_PROFILE_SELECT", "Select")}</option>
                {genders.map((g) => <option key={g.code} value={g.code}>{g.label}</option>)}
              </select>
            </div>

            <div className="ProfileForm__field">
              <label htmlFor="pf-dob">{t("CORE_COMMON_PROFILE_DOB")}</label>
              <input {...fieldProps("dob")} type="date" value={dob} max={format(new Date(), "yyyy-MM-dd")} autoComplete="bday" onChange={(e) => setDob(e.target.value)} onBlur={blur("dob")} />
              {show("dob") && <p className="ProfileForm__err" id="pf-dob-err" role="alert">{errors.dob}</p>}
            </div>

            <div className="ProfileForm__field ProfileForm__field--wide">
              <label htmlFor="pf-email">{t("CORE_COMMON_PROFILE_EMAIL")}</label>
              <input {...fieldProps("email")} type="email" inputMode="email" value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} onBlur={blur("email")} />
              {show("email") && <p className="ProfileForm__err" id="pf-email-err" role="alert">{errors.email}</p>}
            </div>

            <div className="ProfileForm__actions">
              <button type="button" className="ProfileForm__ghost" onClick={() => history.push(DASH_URL)}>{tt("DASH_PROFILE_CANCEL", "Cancel")}</button>
              <button type="submit" className="ProfileForm__save" disabled={saving}>
                {saving ? tt("DASH_PROFILE_SAVING", "Saving...") : t("CORE_COMMON_SAVE") === "CORE_COMMON_SAVE" ? tt("DASH_PROFILE_SAVE", "Save changes") : t("CORE_COMMON_SAVE")}
              </button>
            </div>
          </form>
        </section>
      </div>

      {drawer && (
        <UploadDrawer
          setProfilePic={onPhoto}
          closeDrawer={() => setDrawer(false)}
          userType="citizen"
          removeProfilePic={removePhoto}
          showToast={(type, text) => notify(type, text)}
        />
      )}
    </div>
  );
};

export default Profile;
