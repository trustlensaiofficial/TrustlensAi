/** Inline icon set. One consistent 24-grid, 1.7 stroke, no icon dependency. */
type P = { className?: string; style?: React.CSSProperties; title?: string };
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const LensIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M11 7.5v7M7.5 11h7" opacity=".55" /><path d="m20 20-3.6-3.6" /></svg>
);
export const ShieldIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 3l7 3v5.5c0 4.3-2.9 8.2-7 9.5-4.1-1.3-7-5.2-7-9.5V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const EvidenceIcon = (p: P) => (
  <svg {...base} {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>
);
export const ChecklistIcon = (p: P) => (
  <svg {...base} {...p}><path d="m4 7 2 2 3-3M4 17l2 2 3-3M12 8h8M12 18h8" /></svg>
);
export const AlertIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 9v4M12 16.5v.5" /><path d="M10.3 4.2 3.5 16a2 2 0 0 0 1.7 3h13.6a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" /></svg>
);
export const ScalesIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 4v16M7 8h10M4 19h16" /><path d="M7 8 4 14h6L7 8ZM17 8l-3 6h6l-3-6Z" /></svg>
);
export const ArrowIcon = (p: P) => (
  <svg {...base} {...p}><path d="M5 12h13M13 6l6 6-6 6" /></svg>
);
export const SunIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></svg>
);
export const MoonIcon = (p: P) => (
  <svg {...base} {...p}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" /></svg>
);
export const TrashIcon = (p: P) => (
  <svg {...base} {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>
);
export const ClockIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const InfoIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.8v.4" /></svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const CopyIcon = (p: P) => (
  <svg {...base} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></svg>
);
export const DownloadIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 4v11M8 11l4 4 4-4M5 19h14" /></svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base} {...p}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const ChevronRightIcon = (p: P) => (
  <svg {...base} {...p}><path d="m9 6 6 6-6 6" /></svg>
);
export const BriefcaseIcon = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12h18" /></svg>
);
export const ReceiptIcon = (p: P) => (
  <svg {...base} {...p}><path d="M5 3v18l2.5-1.6L10 21l2-1.6L14 21l2.5-1.6L19 21V3H5Z" /><path d="M9 8h6M9 12h6" /></svg>
);
export const DocumentIcon = (p: P) => (
  <svg {...base} {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M8 13h8M8 17h5" /></svg>
);
export const GlobeIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.3 3.3 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.3-5.3-3.3-8.5S9.8 5.8 12 3.5Z" /></svg>
);
export const MessageIcon = (p: P) => (
  <svg {...base} {...p}><path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9Z" /></svg>
);
export const SparkIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" /><path d="M18.5 16.5 19 18l1.5.5L19 19l-.5 1.5L18 19l-1.5-.5L18 18l.5-1.5Z" /></svg>
);
export const HelpIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.7-.9 1.3v.4M12 16.6v.3" /></svg>
);
export const ListIcon = (p: P) => (
  <svg {...base} {...p}><path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" /></svg>
);
