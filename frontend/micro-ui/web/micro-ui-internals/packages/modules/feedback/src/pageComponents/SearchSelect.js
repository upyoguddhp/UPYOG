import React, { useEffect, useMemo, useRef, useState } from "react";

// Searchable dropdown: a button that opens a filterable list. options: [{ value, label }].
const SearchSelect = ({ value, options, onChange, allLabel, searchPlaceholder, emptyLabel, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [hot, setHot] = useState(0);
  const box = useRef(null);
  const input = useRef(null);

  const all = useMemo(() => [{ value: "", label: allLabel }].concat(options), [options, allLabel]);
  const shown = useMemo(() => {
    const q = term.trim().toLowerCase();
    return q ? all.filter((o) => String(o.label).toLowerCase().includes(q)) : all;
  }, [all, term]);
  const current = all.find((o) => o.value === value) || all[0];

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    if (input.current) input.current.focus();
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); };
  }, [open]);

  const pick = (o) => { onChange(o.value); setOpen(false); setTerm(""); };
  const key = (e) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") { e.preventDefault(); setHot((h) => Math.min(h + 1, shown.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHot((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && shown[hot]) { e.preventDefault(); pick(shown[hot]); }
  };

  return (
    <div className="bkg-ss" ref={box}>
      <button type="button" className="bkg-select bkg-ss__btn" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} onClick={() => { setOpen(!open); setHot(0); }}>
        <span>{current.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open ? (
        <div className="bkg-ss__panel">
          <input ref={input} type="search" className="bkg-ss__search" value={term} placeholder={searchPlaceholder} aria-label={searchPlaceholder} onChange={(e) => { setTerm(e.target.value); setHot(0); }} onKeyDown={key} />
          <ul role="listbox" className="bkg-ss__list">
            {shown.length === 0 ? <li className="bkg-ss__empty">{emptyLabel}</li> : null}
            {shown.map((o, i) => (
              <li key={o.value || "__all"} role="option" aria-selected={o.value === value} className={`${i === hot ? "is-hot " : ""}${o.value === value ? "is-on" : ""}`} onMouseEnter={() => setHot(i)} onClick={() => pick(o)}>
                {o.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default SearchSelect;
