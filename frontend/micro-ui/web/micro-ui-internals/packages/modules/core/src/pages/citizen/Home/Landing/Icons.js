import React from "react";

/** Small stroke icon set used only by the landing page (24x24, currentColor). */
const paths = {
  search: <React.Fragment><circle cx="11" cy="11" r="7" /><path d="M21 21l-5-5" /></React.Fragment>,
  mic: <React.Fragment><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></React.Fragment>,
  alert: <React.Fragment><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></React.Fragment>,
  ticket: <React.Fragment><path d="M3 7h18v4a2 2 0 000 4v4H3v-4a2 2 0 000-4z" /><path d="M14 7v12" /></React.Fragment>,
  bot: <React.Fragment><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 4v4M9 13h.01M15 13h.01M9 17h6" /></React.Fragment>,
  upload: <React.Fragment><path d="M12 15V3M7 8l5-5 5 5M4 21h16" /></React.Fragment>,
  download: <React.Fragment><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></React.Fragment>,
  user: <React.Fragment><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></React.Fragment>,
  pay: <React.Fragment><path d="M7 4h11M7 9h11M10 4c6 0 6 6 0 6H7l8 10" /></React.Fragment>,
  clock: <React.Fragment><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></React.Fragment>,
  check: <React.Fragment><path d="M5 13l4 4L19 7" /></React.Fragment>,
  arrow: <React.Fragment><path d="M5 12h14M13 6l6 6-6 6" /></React.Fragment>,
  doc: <React.Fragment><path d="M6 2h9l5 5v15H6z" /><path d="M14 2v6h6M9 13h8M9 17h8" /></React.Fragment>,
  building: <React.Fragment><path d="M4 21V5l8-3 8 3v16" /><path d="M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4" /></React.Fragment>,
  book: <React.Fragment><path d="M4 4h7a3 3 0 013 3v13a3 3 0 00-3-3H4zM20 4h-6a3 3 0 00-3 3v13a3 3 0 013-3h6z" /></React.Fragment>,
  law: <React.Fragment><path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 006 0zM19 7l-3 7a3 3 0 006 0zM8 21h8" /></React.Fragment>,
  phone: <React.Fragment><path d="M5 3h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2z" /></React.Fragment>,
  mail: <React.Fragment><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></React.Fragment>,
  pin: <React.Fragment><path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></React.Fragment>,
  shield: <React.Fragment><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" /><path d="M9 12l2 2 4-4" /></React.Fragment>,
  info: <React.Fragment><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></React.Fragment>,
  users: <React.Fragment><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 010 7M18 14c2.5.6 4 2.5 4 5" /></React.Fragment>,
  help: <React.Fragment><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 115 0c0 1.8-2.5 2-2.5 4M12 17v.5" /></React.Fragment>,
  list: <React.Fragment><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></React.Fragment>,
  leaf: <React.Fragment><path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8" /></React.Fragment>,
  home: <React.Fragment><path d="M3 11l9-8 9 8M5 10v11h14V10M10 21v-6h4v6" /></React.Fragment>,
  lock: <React.Fragment><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></React.Fragment>,
  external: <React.Fragment><path d="M14 4h6v6M20 4l-9 9M18 13v6H5V6h6" /></React.Fragment>,
  calendar: <React.Fragment><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></React.Fragment>,
  cert: <React.Fragment><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 9h8M8 13h5M15 17l1 4 2-1 2 1 1-4" /></React.Fragment>,
  paw: <React.Fragment><circle cx="6" cy="10" r="2" /><circle cx="10" cy="6" r="2" /><circle cx="14" cy="6" r="2" /><circle cx="18" cy="10" r="2" /><path d="M12 12c-3 0-5 3-5 5 0 2 2 2.5 5 2.5s5-.5 5-2.5c0-2-2-5-5-5z" /></React.Fragment>,
  megaphone: <React.Fragment><path d="M3 11v3a1 1 0 001 1h3l6 4V6L7 10H4a1 1 0 00-1 1zM17 8a5 5 0 010 7" /></React.Fragment>,
  pause: <React.Fragment><path d="M8 5v14M16 5v14" /></React.Fragment>,
  play: <React.Fragment><path d="M7 4l13 8-13 8z" /></React.Fragment>,
};

const Icon = ({ name, size = 24, className = "", strokeWidth = 1.9 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {paths[name] || paths.doc}
  </svg>
);

export default Icon;
