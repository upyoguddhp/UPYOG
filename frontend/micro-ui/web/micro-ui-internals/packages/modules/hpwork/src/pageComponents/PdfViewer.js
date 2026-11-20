import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { wrkText } from "../config/hpworkMessages";

/* In-page bill viewer, same approach as the old admin theme: desktop browsers show the PDF in their own
   viewer (iframe); phones/tablets, where a blob PDF cannot be shown in an iframe, draw each page with pdf.js
   (served from /digit-ui/pdf.min.js + pdf.worker.min.js, loaded only when first needed). */
const IS_MOBILE = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
const base = () => `${(window.contextPath ? `/${window.contextPath}` : "/digit-ui").replace(/\/+$/, "")}`;

let loader;
const loadPdfJs = () => {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `${base()}/pdf.min.js`;
      s.onload = () => {
        const lib = window.pdfjsLib || window["pdfjs-dist/build/pdf"];
        if (!lib) return reject(new Error("pdfjs missing"));
        lib.GlobalWorkerOptions.workerSrc = `${base()}/pdf.worker.min.js`;
        resolve(lib);
      };
      s.onerror = () => { loader = null; reject(new Error("pdfjs load failed")); };
      document.head.appendChild(s);
    });
  }
  return loader;
};

const PdfViewer = ({ blob, fileName = "Bill.pdf", onClose }) => {
  const { t } = useTranslation();
  const tt = (k, p) => wrkText(t, k, p);
  const [nativeUrl, setNativeUrl] = useState(null);
  const [status, setStatus] = useState(IS_MOBILE ? "loading" : "ready"); // loading | ready | error
  const [note, setNote] = useState("");
  const holder = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (IS_MOBILE || !blob) return undefined;
    const url = URL.createObjectURL(blob);
    setNativeUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  useEffect(() => {
    if (!IS_MOBILE || !blob) return undefined;
    let cancelled = false;
    let doc = null;
    (async () => {
      try {
        const lib = await loadPdfJs();
        doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        const el = holder.current;
        if (cancelled || !el) return;
        el.innerHTML = "";
        const width = Math.max(el.clientWidth - 8, 240);
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const base1 = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: (width / base1.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width; canvas.height = vp.height;
          canvas.style.cssText = `display:block;margin:0 auto 10px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.18);width:${width}px;height:${vp.height / ratio}px`;
          el.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
        }
        if (!cancelled) setStatus("ready");
      } catch (e) {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; if (doc) doc.destroy(); };
  }, [blob]);

  const download = () => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };
  const print = () => {
    const url = URL.createObjectURL(blob);
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    f.src = url;
    f.onload = () => {
      try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { window.open(url, "_blank"); }
      setTimeout(() => { document.body.removeChild(f); URL.revokeObjectURL(url); }, 60000);
    };
    document.body.appendChild(f);
  };
  const share = async () => {
    const file = new File([blob], fileName, { type: "application/pdf" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: fileName }); return; }
      setNote(tt("WRK_PDF_SHARE_NA")); download();
    } catch (e) {
      if (e && e.name !== "AbortError") setNote(tt("WRK_PDF_SHARE_FAIL"));
    }
  };

  return (
    <div className="wrk-modal wrk-modal--pv wrk-modal--top" role="dialog" aria-modal="true" aria-labelledby="wrk-pdf-title" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="wrk-pv wrk-pdf">
        <header className="wrk-pv__head">
          <div><h2 id="wrk-pdf-title">{tt("WRK_PDF_TITLE")}</h2><p>{fileName}</p></div>
          <button type="button" className="wrk-pv__x" onClick={onClose} aria-label={tt("WRK_CLOSE")} autoFocus>×</button>
        </header>
        <div className="wrk-pdf__view">
          {status === "loading" ? <p className="wrk-pdf__msg" role="status">{tt("WRK_PDF_PREPARING")}</p> : null}
          {status === "error" ? <p className="wrk-pdf__msg wrk-prev__bad" role="alert">{tt("WRK_PDF_ERROR")}</p> : null}
          {nativeUrl ? <iframe title={tt("WRK_PDF_TITLE")} src={nativeUrl} className="wrk-pdf__frame" /> : null}
          <div ref={holder} />
        </div>
        {note ? <p className="wrk-pdf__note" role="status">{note}</p> : null}
        <footer className="wrk-pv__foot">
          <button type="button" className="npt-btn npt-btn--ghost" onClick={share}><span>{tt("WRK_PDF_SHARE")}</span></button>
          {IS_MOBILE ? <button type="button" className="npt-btn npt-btn--ghost" onClick={print}><span>{tt("WRK_PDF_PRINT")}</span></button> : null}
          {IS_MOBILE ? <button type="button" className="npt-btn npt-btn--primary" onClick={download}><span>{tt("WRK_PDF_DOWNLOAD")}</span></button> : null}
        </footer>
      </div>
    </div>
  );
};

export default PdfViewer;
