/** One icon system: a 24 grid, 1.7 stroke, no icon dependency. */
type P = { className?: string; style?: React.CSSProperties };
const b = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
};

export const Shield = (p: P) => (<svg {...b} {...p}><path d="M12 3l7.5 3.2v5.6c0 4.5-3.1 8.6-7.5 9.9-4.4-1.3-7.5-5.4-7.5-9.9V6.2L12 3Z"/><path d="m9 12 2.2 2.2L15.4 10"/></svg>);
export const ShieldAlert = (p: P) => (<svg {...b} {...p}><path d="M12 3l7.5 3.2v5.6c0 4.5-3.1 8.6-7.5 9.9-4.4-1.3-7.5-5.4-7.5-9.9V6.2L12 3Z"/><path d="M12 8.4v4"/><path d="M12 15.6h.01"/></svg>);
export const Lens = (p: P) => (<svg {...b} {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.7-3.7"/></svg>);
export const Alert = (p: P) => (<svg {...b} {...p}><path d="M10.3 3.9 2.4 17.4A1.9 1.9 0 0 0 4 20.3h16a1.9 1.9 0 0 0 1.6-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z"/><path d="M12 9.5v4"/><path d="M12 17.3h.01"/></svg>);
export const Check = (p: P) => (<svg {...b} {...p}><path d="m20 6-11 11-5-5"/></svg>);
export const Close = (p: P) => (<svg {...b} {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>);
export const Arrow = (p: P) => (<svg {...b} {...p}><path d="M5 12h13M13 6l6 6-6 6"/></svg>);
export const Chevron = (p: P) => (<svg {...b} {...p}><path d="m9 6 6 6-6 6"/></svg>);
export const Clock = (p: P) => (<svg {...b} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.9"/></svg>);
export const Doc = (p: P) => (<svg {...b} {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>);
export const List = (p: P) => (<svg {...b} {...p}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>);
export const Globe = (p: P) => (<svg {...b} {...p}><circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17"/><ellipse cx="12" cy="12" rx="3.8" ry="9"/></svg>);
export const Lock = (p: P) => (<svg {...b} {...p}><rect x="4" y="10.5" width="16" height="10.5" rx="2.2"/><path d="M8 10.5V7.4a4 4 0 1 1 8 0v3.1"/></svg>);
export const Bell = (p: P) => (<svg {...b} {...p}><path d="M18 8.6a6 6 0 1 0-12 0c0 6-2.4 7.4-2.4 7.4h16.8S18 14.6 18 8.6Z"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/></svg>);
export const Users = (p: P) => (<svg {...b} {...p}><path d="M16.5 20.5v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.1a3.6 3.6 0 0 0-3.6 3.6v1.8"/><circle cx="9.5" cy="7.6" r="3.6"/><path d="M21.5 20.5v-1.8a3.6 3.6 0 0 0-2.7-3.5M15.8 4.1a3.6 3.6 0 0 1 0 7"/></svg>);
export const Bolt = (p: P) => (<svg {...b} {...p}><path d="M13.2 2.5 4 13.6h7l-.4 7.9 9.2-11.1h-7l.4-7.9Z"/></svg>);
export const Phone = (p: P) => (<svg {...b} {...p}><path d="M21.5 16.9v2.6a1.8 1.8 0 0 1-2 1.8 17.6 17.6 0 0 1-7.7-2.7 17.3 17.3 0 0 1-5.3-5.3A17.6 17.6 0 0 1 3.8 5.5a1.8 1.8 0 0 1 1.8-2h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.7.6 2.5a1.8 1.8 0 0 1-.4 1.9l-1.1 1.1a14 14 0 0 0 5.3 5.3l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.5.6a1.8 1.8 0 0 1 1.5 1.8Z"/></svg>);
export const Wifi = (p: P) => (<svg {...b} {...p}><path d="M5 12.6a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9.1a15 15 0 0 1 20 0"/><path d="M12 19.9h.01"/></svg>);
export const WifiOff = (p: P) => (<svg {...b} {...p}><path d="M2 2 22 22"/><path d="M8.5 16a5 5 0 0 1 6.1-.8"/><path d="M5 12.6a10 10 0 0 1 4-2.5M15.2 10.4a10 10 0 0 1 3.8 2.2"/><path d="M2 9.1A15 15 0 0 1 6.6 6.3M12.6 4.2A15 15 0 0 1 22 9.1"/><path d="M12 19.9h.01"/></svg>);
export const Settings = (p: P) => (<svg {...b} {...p}><circle cx="12" cy="12" r="3.1"/><path d="M19.6 14.8a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1h-.2a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5v-.2a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.5 1Z"/></svg>);
export const Sun = (p: P) => (<svg {...b} {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>);
export const Moon = (p: P) => (<svg {...b} {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>);
export const Help = (p: P) => (<svg {...b} {...p}><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4"/><path d="M12 17h.01"/></svg>);
export const Trash = (p: P) => (<svg {...b} {...p}><path d="M3.5 6h17M8.5 6V4.4A1.4 1.4 0 0 1 9.9 3h4.2a1.4 1.4 0 0 1 1.4 1.4V6m2.4 0v14a1.6 1.6 0 0 1-1.6 1.6H7.7A1.6 1.6 0 0 1 6.1 20V6"/></svg>);
export const Copy = (p: P) => (<svg {...b} {...p}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
export const Download = (p: P) => (<svg {...b} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>);
export const Scales = (p: P) => (<svg {...b} {...p}><path d="M12 3v18M7 21h10M12 6l7 2-3.5 6.5a3.6 3.6 0 0 0 7 0L19 8M12 6 5 8l3.5 6.5a3.6 3.6 0 0 1-7 0L5 8"/></svg>);
export const Eye = (p: P) => (<svg {...b} {...p}><path d="M2.2 12S5.7 5.5 12 5.5 21.8 12 21.8 12 18.3 18.5 12 18.5 2.2 12 2.2 12Z"/><circle cx="12" cy="12" r="3"/></svg>);
export const Pause = (p: P) => (<svg {...b} {...p}><rect x="6.5" y="4.5" width="4" height="15" rx="1.2"/><rect x="13.5" y="4.5" width="4" height="15" rx="1.2"/></svg>);
export const Play = (p: P) => (<svg {...b} {...p}><path d="M6.5 4.6 19 12 6.5 19.4V4.6Z"/></svg>);
export const Spark = (p: P) => (<svg {...b} {...p}><path d="M12 3.2 13.9 9l5.8 1.9-5.8 1.9L12 18.6 10.1 12.8 4.3 10.9 10.1 9 12 3.2Z"/></svg>);

/* --------------------------------------------------------------------------
 * The second batch.
 *
 * Added for the dashboard's ten feature cards and the surfaces around them.
 * Same 24 grid, same 1.7 stroke, same `currentColor` — an icon that does not
 * share the grid reads as borrowed from somewhere else, which is exactly how
 * a product starts looking assembled rather than designed.
 * ------------------------------------------------------------------------ */

/** A message. The dashboard's first card, so it carries the most weight. */
export const Message = (p: P) => (<svg {...b} {...p}><path d="M20.5 11.5a7.9 7.9 0 0 1-8.5 7.9 9 9 0 0 1-2.6-.4l-4.9 1.5 1.5-4.4a7.8 7.8 0 0 1-1-3.9 7.9 7.9 0 0 1 8-7.9 7.9 7.9 0 0 1 7.5 7.2Z"/><path d="M9 11.5h.01M12.5 11.5h.01M16 11.5h.01"/></svg>);

/** A link. Two rings of a chain, which reads at 18px where a full chain does not. */
export const LinkIcon = (p: P) => (<svg {...b} {...p}><path d="M10 13.5a4 4 0 0 0 5.7.4l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.6 1.6"/><path d="M14 10.5a4 4 0 0 0-5.7-.4l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.6-1.6"/></svg>);

/** A bank. Columns and a pediment — the universal shorthand, and the one
 *  Indian users read fastest for "your bank", over a card or a rupee sign. */
export const Bank = (p: P) => (<svg {...b} {...p}><path d="M3.5 9.5 12 4l8.5 5.5"/><path d="M5.5 9.5v8M9.5 9.5v8M14.5 9.5v8M18.5 9.5v8"/><path d="M3 20.5h18"/></svg>);

/** A job offer. */
export const Briefcase = (p: P) => (<svg {...b} {...p}><rect x="2.5" y="7.5" width="19" height="13" rx="2.2"/><path d="M8.5 7.5V5.8a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.7"/><path d="M2.5 12.5h19"/></svg>);

/** An invoice or payment request. */
export const Receipt = (p: P) => (<svg {...b} {...p}><path d="M5 3.5h14v17l-2.3-1.5-2.4 1.5-2.3-1.5-2.4 1.5L7.3 19 5 20.5Z"/><path d="M9 8.5h6M9 12.5h6"/></svg>);

/** Incident response. A ring buoy: help, not alarm — the card it sits on is
 *  for someone who has already been hurt, and a second warning triangle
 *  there would be shouting at them. */
export const Lifebuoy = (p: P) => (<svg {...b} {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.7"/><path d="m5.6 5.6 3.8 3.8M14.6 14.6l3.8 3.8M18.4 5.6l-3.8 3.8M9.4 14.6l-3.8 3.8"/></svg>);

/** A finished report, as distinct from Doc, which is a blank one. */
export const Report = (p: P) => (<svg {...b} {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/><path d="m9.2 15.4 1.8 1.8 3.6-3.6"/></svg>);

/** History. A clock with a rewind arrow. */
export const History = (p: P) => (<svg {...b} {...p}><path d="M3.3 12a8.7 8.7 0 1 0 2.6-6.2"/><path d="M3 4.5V9h4.5"/><path d="M12 7.6V12l3.1 1.8"/></svg>);

/** Learning. */
export const Book = (p: P) => (<svg {...b} {...p}><path d="M4 4.8A1.8 1.8 0 0 1 5.8 3H19v15.5H5.8A1.8 1.8 0 0 0 4 20.3Z"/><path d="M4 18.5a1.8 1.8 0 0 0 1.8 1.8H19"/><path d="M8.5 8h6"/></svg>);

/* --------------------------------------------------- account and chrome */

export const Key = (p: P) => (<svg {...b} {...p}><circle cx="7.8" cy="16.2" r="3.3"/><path d="m10.2 13.8 8-8"/><path d="m15.5 8.5 2 2M18 6l2.2 2.2"/></svg>);
export const Fingerprint = (p: P) => (<svg {...b} {...p}><path d="M5.5 10.5a6.5 6.5 0 0 1 13 0"/><path d="M8.5 11.5a3.5 3.5 0 0 1 7 0c0 3.3-.6 6-1.6 8.3"/><path d="M11.5 11.5a.5.5 0 0 1 1 0c0 4-.8 7-2.2 9.2"/><path d="M6.8 19.5A13 13 0 0 0 8.5 14"/><path d="M2.8 8A9.5 9.5 0 0 1 12 2.5 9.5 9.5 0 0 1 21.2 8"/></svg>);
export const User = (p: P) => (<svg {...b} {...p}><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>);
export const LogOut = (p: P) => (<svg {...b} {...p}><path d="M9.5 20.5h-4a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4"/><path d="m16 16.5 4-4.5-4-4.5M20 12H9.5"/></svg>);
export const Home = (p: P) => (<svg {...b} {...p}><path d="m3.5 10.5 8.5-7 8.5 7"/><path d="M5.5 9.3v10.2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.3"/><path d="M9.8 20.5v-6h4.4v6"/></svg>);
export const Back = (p: P) => (<svg {...b} {...p}><path d="M19 12H6M11 18l-6-6 6-6"/></svg>);
export const Share = (p: P) => (<svg {...b} {...p}><circle cx="18" cy="5.5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="18.5" r="2.6"/><path d="m8.3 10.7 7.4-3.9M8.3 13.3l7.4 3.9"/></svg>);
export const Language = (p: P) => (<svg {...b} {...p}><path d="M3 6h11M8.5 3.5V6"/><path d="M11.5 6c0 4-3.3 8-7.5 9.5"/><path d="M6 11.5c1.3 2.5 3.5 4 5.5 4.8"/><path d="m13 20.5 4-9.5 4 9.5"/><path d="M14.4 17.3h5.2"/></svg>);
export const Camera = (p: P) => (<svg {...b} {...p}><path d="M4.5 7.5h2.8l1.4-2.3h6.6l1.4 2.3h2.8a1.8 1.8 0 0 1 1.8 1.8v8.2a1.8 1.8 0 0 1-1.8 1.8H4.5a1.8 1.8 0 0 1-1.8-1.8V9.3a1.8 1.8 0 0 1 1.8-1.8Z"/><circle cx="12" cy="13.3" r="3.4"/></svg>);
export const Paste = (p: P) => (<svg {...b} {...p}><path d="M9 4.5H7.3a1.8 1.8 0 0 0-1.8 1.8v12.4a1.8 1.8 0 0 0 1.8 1.8h9.4a1.8 1.8 0 0 0 1.8-1.8V6.3a1.8 1.8 0 0 0-1.8-1.8H15"/><rect x="9" y="2.8" width="6" height="3.6" rx="1.1"/></svg>);
export const Plus = (p: P) => (<svg {...b} {...p}><path d="M12 5v14M5 12h14"/></svg>);
export const Mail = (p: P) => (<svg {...b} {...p}><rect x="2.5" y="5" width="19" height="14" rx="2.2"/><path d="m3.2 6.5 8.8 6 8.8-6"/></svg>);

/* ------------------------------------------------------------- brands
 * Filled, not stroked: these are other companies' marks and they are
 * recognised by their silhouette. Redrawing them on the 1.7 stroke grid
 * would make them consistent with the product and wrong as logos.
 */

export const WhatsApp = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.5.3-.5v-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.1 4.5 1.9.8 2.6.9 3.6.7.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4l-.5-.3Z" />
    <path d="M12 2.2A9.7 9.7 0 0 0 3.6 16.8L2.2 21.8l5.2-1.4A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-3-.2-.3A8 8 0 1 1 12 19.9Z" />
  </svg>
);

export const Telegram = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M21.9 4.3 18.6 20c-.2 1.1-.9 1.4-1.8.9l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13.8l-4.8-1.5c-1-.3-1.1-1 .2-1.5l18.8-7.2c.9-.3 1.6.2 1.3 1.5l.2-.8Z" />
  </svg>
);
