import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (size = 16): P => ({
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
});

export const CopyIcon = (p: P) => (
  <svg {...base(14)} {...p}>
    <rect x="5" y="5" width="8.5" height="8.5" rx="2" />
    <path d="M10.5 5V3.5a1.5 1.5 0 0 0-1.5-1.5H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5" />
  </svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base(14)} {...p}>
    <path d="M3 8.5l3 3 7-7.5" />
  </svg>
);
export const ArrowRight = (p: P) => (
  <svg {...base(15)} {...p}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);
export const PlayIcon = (p: P) => (
  <svg {...base(14)} {...p} fill="currentColor" stroke="none">
    <path d="M4.5 2.8v10.4a.6.6 0 0 0 .9.5l8.3-5.2a.6.6 0 0 0 0-1L5.4 2.3a.6.6 0 0 0-.9.5z" />
  </svg>
);
export const A11yIcon = (p: P) => (
  <svg {...base(17)} {...p}>
    <circle cx="8" cy="2.8" r="1.3" />
    <path d="M2.5 5.5 8 6.5l5.5-1M8 6.5v3.5M8 10l-2.5 4.5M8 10l2.5 4.5" />
  </svg>
);
export const GridIcon = (p: P) => (
  <svg {...base(15)} {...p}>
    <rect x="2" y="2" width="5" height="5" rx="1.2" />
    <rect x="9" y="2" width="5" height="5" rx="1.2" />
    <rect x="2" y="9" width="5" height="5" rx="1.2" />
    <rect x="9" y="9" width="5" height="5" rx="1.2" />
  </svg>
);
export const ChartIcon = (p: P) => (
  <svg {...base(15)} {...p}>
    <path d="M2 14h12M4 11V7M8 11V3M12 11V8" />
  </svg>
);
export const UsersIcon = (p: P) => (
  <svg {...base(15)} {...p}>
    <circle cx="6" cy="5" r="2.5" />
    <path d="M1.5 13.5a4.5 4.5 0 0 1 9 0M11 2.8a2.5 2.5 0 0 1 0 4.4M12.5 9.8a4.5 4.5 0 0 1 2 3.7" />
  </svg>
);
export const BracesIcon = (p: P) => (
  <svg {...base(15)} {...p}>
    <path d="M5.5 2H5a2 2 0 0 0-2 2v2a2 2 0 0 1-1.5 2A2 2 0 0 1 3 10v2a2 2 0 0 0 2 2h.5M10.5 2h.5a2 2 0 0 1 2 2v2a2 2 0 0 0 1.5 2 2 2 0 0 0-1.5 2v2a2 2 0 0 1-2 2h-.5" />
  </svg>
);

/** The hintbeam mark: a light that curves to a point. */
export const Mark = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <defs>
      <linearGradient id="mark-g" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#9D86FF" />
        <stop offset="1" stopColor="#4CD6FF" />
      </linearGradient>
      <radialGradient id="mark-core">
        <stop offset="0" stopColor="#fff" />
        <stop offset="0.5" stopColor="#4CD6FF" />
        <stop offset="1" stopColor="#9D86FF" />
      </radialGradient>
    </defs>
    <rect x="1" y="1" width="30" height="30" rx="9" fill="#14111f" stroke="rgba(255,255,255,.12)" />
    <path d="M6.5 20 C 10 12, 17 15.5, 24 10" stroke="url(#mark-g)" strokeWidth="1" fill="none" strokeLinecap="round" opacity=".55" />
    <path d="M10.5 26 C 15 17, 19.5 19.5, 24 10" stroke="url(#mark-g)" strokeWidth="1" fill="none" strokeLinecap="round" opacity=".55" />
    <path d="M8 24 C 12 14, 18 17.5, 24 10" stroke="url(#mark-g)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <circle cx="24" cy="10" r="3.6" fill="url(#mark-core)" />
  </svg>
);

/** GitHub's mark (from Octicons, MIT), for linking to the repository. */
export const GitHubIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
  </svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base(18)} {...p}>
    <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
  </svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base(18)} {...p}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);
