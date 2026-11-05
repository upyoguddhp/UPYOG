import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/** Floating "back to top" button, bottom right, sitting just above the help dock when it is present. */
const BackToTop = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [bottom, setBottom] = useState(24);

  useEffect(() => {
    const place = () => {
      const dock = document.querySelector(".ActionDock");
      const r = dock && dock.getBoundingClientRect();
      setBottom(r && r.height ? Math.round(window.innerHeight - r.top + 14) : 24);
    };
    const onScroll = () => {
      setVisible(window.scrollY > 400);
      place();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", place);
    const id = setTimeout(place, 800); // dock mounts after the page
    return () => {
      clearTimeout(id);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", place);
    };
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      className={`LandingToTop${visible ? " is-visible" : ""}`}
      style={{ bottom }}
      onClick={toTop}
      aria-label={t("LANDING_BACK_TO_TOP", { defaultValue: "Back to top" })}
      title={t("LANDING_BACK_TO_TOP", { defaultValue: "Back to top" })}
      tabIndex={visible ? 0 : -1}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
    </button>
  );
};

export default BackToTop;
