import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import { fetchServiceDocumentList } from "@upyog/digit-ui-react-components";

const dmsBase = () => ((window.globalConfigs && window.globalConfigs.getConfig && window.globalConfigs.getConfig("DMS_URL")) || "/hpud-dms-service").replace(/\/$/, "");

// Site Photo uploaded to DMS under service SITE, object = site uuid. Loads once the card scrolls into view; renders `fallback` when there is none.
const SitePhoto = ({ uuid, alt, fallback, className = "bkg-photo" }) => {
  const box = useRef(null);
  const [seen, setSeen] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (seen || !box.current) return undefined;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(box.current);
    return () => io.disconnect();
  }, [seen]);

  const q = useQuery(
    ["BKG_SITE_PHOTO", uuid],
    async () => {
      const list = await fetchServiceDocumentList("SITE", uuid);
      const doc = list.find((d) => d.attachment && d.attachment.url);
      if (!doc) return null;
      const res = await fetch(`${dmsBase()}/dms/downloadFile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(Digit.UserService.getUser() || {}).access_token}` },
        body: JSON.stringify({ RequestInfo: { apiId: "Rainmaker" }, id: doc.attachment.url }),
      });
      const type = res.headers.get("content-type") || "";
      if (!res.ok || type.indexOf("image") < 0) return null;
      return URL.createObjectURL(await res.blob());
    },
    { enabled: !!uuid && seen, staleTime: Infinity, cacheTime: Infinity, retry: 0, refetchOnWindowFocus: false }
  );

  return (
    <span className={className} ref={box}>
      {q.data ? <img src={q.data} alt={alt} loading="lazy" /> : fallback}
    </span>
  );
};

export default SitePhoto;
