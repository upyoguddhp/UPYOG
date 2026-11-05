import React, { useEffect, useRef, useState } from "react";

const BASE = (process.env.PUBLIC_URL || "/digit-ui").replace(/\/$/, "");

// pdf.js (legacy build) is served as a static file next to the app and loaded on first use, so it is not part of the main bundle
let pdfjsPromise;
const loadPdfJs = () => {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!pdfjsPromise) {
    pdfjsPromise = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = `${BASE}/pdf.min.js`;
      el.onload = () => (window.pdfjsLib ? resolve(window.pdfjsLib) : reject(new Error("pdf.js missing")));
      el.onerror = () => {
        pdfjsPromise = null;
        reject(new Error("pdf.js could not be loaded"));
      };
      document.head.appendChild(el);
    });
  }
  return pdfjsPromise;
};

/**
 * In-page document viewer (pdf.js for PDFs, <img> for images) shown as a modal.
 * props: source (File | Blob), name, labels{ close, zoomIn, zoomOut, download, page, viewFailed }, onClose
 * Pages are drawn to canvases at device pixel ratio, so it is sharp on phones and zoomable on any screen.
 */
const DocViewer = ({ source, name = "", labels = {}, onClose }) => {
  const isPdf = source && (source.type === "application/pdf" || /\.pdf$/i.test(name));
  const [url, setUrl] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(0);
  const [pages, setPages] = useState(0);
  const body = useRef(null);
  const closeBtn = useRef(null);

  useEffect(() => {
    const u = URL.createObjectURL(source);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [source]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current && closeBtn.current.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  // load the PDF
  useEffect(() => {
    if (!isPdf) {
      setStatus("ready");
      return undefined;
    }
    let cancelled = false;
    let task;
    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        pdfjs.GlobalWorkerOptions.workerSrc = `${BASE}/pdf.worker.min.js`;
        const data = await source.arrayBuffer();
        task = pdfjs.getDocument({ data });
        const doc = await task.promise;
        if (cancelled) return;
        setPdf(doc);
        setPages(doc.numPages);
        setStatus("ready");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("DocViewer: could not open the PDF", e);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      task && task.destroy && task.destroy();
    };
  }, [source, isPdf]);

  useEffect(() => {
    const measure = () => body.current && setWidth(body.current.clientWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [status]);

  return (
    <div className="docview" role="dialog" aria-modal="true" aria-label={name} onMouseDown={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <div className="docview__card">
        <header className="docview__bar">
          <strong title={name}>{name}</strong>
          {isPdf && status === "ready" ? <span className="docview__pages">{pages} {labels.page || "pages"}</span> : null}
          <div className="docview__tools">
            {isPdf ? (
              <React.Fragment>
                <button type="button" aria-label={labels.zoomOut || "Zoom out"} onClick={() => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)))}>−</button>
                <span className="docview__zoom">{Math.round(scale * 100)}%</span>
                <button type="button" aria-label={labels.zoomIn || "Zoom in"} onClick={() => setScale((s) => Math.min(3, +(s + 0.25).toFixed(2)))}>+</button>
              </React.Fragment>
            ) : null}
            {url ? <a href={url} download={name} aria-label={labels.download || "Download"}>↓</a> : null}
            <button type="button" ref={closeBtn} aria-label={labels.close || "Close"} onClick={onClose}>✕</button>
          </div>
        </header>
        <div className="docview__body" ref={body}>
          {status === "loading" ? <p className="docview__msg" role="status">…</p> : null}
          {status === "error" ? <p className="docview__msg" role="alert">{labels.viewFailed || "This file could not be displayed."}</p> : null}
          {status === "ready" && !isPdf && url ? <img className="docview__img" style={{ width: `${scale * 100}%` }} src={url} alt={name} /> : null}
          {status === "ready" && isPdf && pdf
            ? Array.from({ length: pages }, (_, i) => <DocPage key={i} pdf={pdf} number={i + 1} width={Math.max(200, (width - 24) * scale)} />)
            : null}
        </div>
      </div>
    </div>
  );
};

const DocPage = ({ pdf, number, width }) => {
  const canvas = useRef(null);
  useEffect(() => {
    let cancelled = false;
    let task;
    (async () => {
      const page = await pdf.getPage(number);
      if (cancelled || !canvas.current) return;
      const base = page.getViewport({ scale: 1 });
      const ratio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: (width / base.width) * ratio });
      const c = canvas.current;
      c.width = viewport.width;
      c.height = viewport.height;
      c.style.width = `${width}px`;
      c.style.height = `${(viewport.height / ratio)}px`;
      task = page.render({ canvasContext: c.getContext("2d"), viewport });
      try {
        await task.promise;
      } catch (e) {
        /* cancelled by a newer render */
      }
    })();
    return () => {
      cancelled = true;
      task && task.cancel && task.cancel();
    };
  }, [pdf, number, width]);
  return <canvas ref={canvas} className="docview__page" />;
};

export default DocViewer;
