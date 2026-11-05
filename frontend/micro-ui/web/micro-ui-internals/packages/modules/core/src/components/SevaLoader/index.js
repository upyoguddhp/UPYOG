import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const EMBLEM = "/digit-ui/images/brand/CitizenSevaEmblem.png";

/**
 * Branded Citizen Seva loader.
 * Shows "Loading, please wait..." and, if the wait drags on, tells the user it is taking longer
 * than usual and thanks them for their patience.
 *
 * props: message, fullScreen (overlay), slowAfter / verySlowAfter (ms)
 */
const SevaLoader = ({ message, fullScreen = false, slowAfter = 6000, verySlowAfter = 15000 }) => {
  const { t } = useTranslation();
  const tt = (k) => t(k);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const a = setTimeout(() => setStage(1), slowAfter);
    const b = setTimeout(() => setStage(2), verySlowAfter);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [slowAfter, verySlowAfter]);

  return (
    <div className={`SevaLoader${fullScreen ? " SevaLoader--full" : ""}`} role="status" aria-live="polite">
      <div className="SevaLoader__box">
        <div className="SevaLoader__art" aria-hidden="true">
          <span className="SevaLoader__ring SevaLoader__ring--a" />
          <span className="SevaLoader__ring SevaLoader__ring--b" />
          <img className="SevaLoader__emblem" src={EMBLEM} alt="" />
        </div>
        <p className="SevaLoader__msg">{message || tt("SEVA_LOADER_LOADING")}</p>
        <span className="SevaLoader__bar" aria-hidden="true" />
        {stage >= 1 && (
          <p className="SevaLoader__slow">
            {tt("SEVA_LOADER_SLOW")}
          </p>
        )}
        {stage >= 2 && (
          <p className="SevaLoader__thanks">{tt("SEVA_LOADER_THANKS")}</p>
        )}
      </div>
    </div>
  );
};

export default SevaLoader;
