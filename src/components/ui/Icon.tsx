import type { SVGProps } from "react";

/**
 * The app's icon set: line-drawn, 24×24, stroked in `currentColor`.
 *
 * Emoji were quick to ship but render differently on every platform and never
 * match the type. These do — one weight, one grid, one colour source.
 */
export type IconName =
  | "hall"
  | "book"
  | "candle"
  | "skull"
  | "scroll"
  | "shield"
  | "feather"
  | "flame"
  | "sword"
  | "note"
  | "chord"
  | "drum"
  | "column"
  | "bolt"
  | "moon"
  | "harp"
  | "layers"
  | "trophy"
  | "gem"
  | "sparkle"
  | "lock"
  | "check"
  | "arrow"
  | "chevron"
  | "clock"
  | "target"
  | "info"
  | "warning"
  | "insight"
  | "download"
  | "refresh"
  | "sun"
  | "puzzle"
  | "chest"
  | "compass"
  | "quill"
  | "heart"
  | "users"
  | "eye"
  | "eyeOff"
  | "close"
  | "search"
  | "pause"
  | "share"
  | "print"
  | "save"
  | "upload"
  | "history"
  | "comment"
  | "sliders"
  | "piano"
  | "zoomIn"
  | "zoomOut"
  | "expand"
  | "panelLeft"
  | "panelRight"
  | "skipBack"
  | "skipForward"
  | "rewind"
  | "trash"
  | "copy"
  | "pencil"
  | "midi"
  | "settings"
  | "plus"
  | "play"
  | "stop"
  | "undo"
  | "redo"
  | "metronome"
  | "loop"
  | "star"
  | "grid"
  | "staff";

const PATHS: Record<IconName, JSX.Element> = {
  hall: (
    <>
      <path d="M3 21h18M5 21V9l7-5 7 5v12" />
      <path d="M9 21v-6h6v6M10 12h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v16H5.5A1.5 1.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A1.5 1.5 0 0 1 5.5 19H19v2H5.5A1.5 1.5 0 0 1 4 20.5zM9 7h6M9 11h6" />
    </>
  ),
  candle: (
    <>
      <path d="M12 2c1.6 1.8 2.4 3.1 2.4 4.2A2.4 2.4 0 0 1 12 8.6a2.4 2.4 0 0 1-2.4-2.4C9.6 5.1 10.4 3.8 12 2z" />
      <path d="M9 11h6v10H9zM12 8.6V11" />
    </>
  ),
  skull: (
    <>
      <path d="M12 3a7 7 0 0 0-7 7v3l2 1.5V18a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3.5L19 13v-3a7 7 0 0 0-7-7z" />
      <circle cx="9.2" cy="11" r="1.4" />
      <circle cx="14.8" cy="11" r="1.4" />
      <path d="M11 15h2" />
    </>
  ),
  scroll: (
    <>
      <path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6" />
      <path d="M6 4a2 2 0 0 0-2 2v1h4M6 20a2 2 0 0 1-2-2v-1h4M9 9h7M9 13h7" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v6c0 4.2-2.9 7.8-7 9-4.1-1.2-7-4.8-7-9V6z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </>
  ),
  feather: (
    <>
      <path d="M19 5c0 7-5.5 11-11 11H5l3-3c0-5 4-8 8-8z" />
      <path d="M5 19l6-6" />
    </>
  ),
  flame: (
    <>
      <path d="M12 3c3.5 3.6 5.5 6.2 5.5 9a5.5 5.5 0 0 1-11 0c0-1.6.6-3 1.8-4.5.4 1.3 1.1 2 2 2 .3-3 .8-4.9 1.7-6.5z" />
    </>
  ),
  sword: (
    <>
      <path d="M18 3h3v3l-9 9-3-3z" />
      <path d="M9 12l-4.5 4.5a1.5 1.5 0 0 0 0 2.1l.9.9a1.5 1.5 0 0 0 2.1 0L12 15M4 20l-1 1" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="9.3" x2="21" y2="9.3" />
      <line x1="3" y1="14.6" x2="21" y2="14.6" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <line x1="15" y1="4" x2="15" y2="20" />
      <rect x="9.8" y="10.2" width="4.4" height="3.4" rx="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  staff: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="9.5" x2="21" y2="9.5" />
      <line x1="3" y1="13" x2="21" y2="13" />
      <line x1="3" y1="16.5" x2="21" y2="16.5" />
      <ellipse cx="14.5" cy="13" rx="2.2" ry="1.7" fill="currentColor" stroke="none" />
      <line x1="16.6" y1="13" x2="16.6" y2="5" />
    </>
  ),
  note: (
    <>
      <path d="M9 18V5l10-2v13" />
      <ellipse cx="6.5" cy="18" rx="2.5" ry="2" />
      <ellipse cx="16.5" cy="16" rx="2.5" ry="2" />
    </>
  ),
  chord: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="8" cy="6" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="16" cy="18" r="1.6" />
    </>
  ),
  drum: (
    <>
      <ellipse cx="12" cy="8" rx="8" ry="3.5" />
      <path d="M4 8v8c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5V8" />
      <path d="M6 10.6l3.5 4M18 10.6l-3.5 4" />
    </>
  ),
  column: (
    <>
      <path d="M4 21h16M6 21V7M10 21V7M14 21V7M18 21V7" />
      <path d="M4 7h16l-8-4z" />
    </>
  ),
  bolt: <path d="M13 2L5 13h5l-1 9 8-11h-5z" />,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  harp: (
    <>
      <path d="M5 20V5c6 0 11 4.5 11 11v4" />
      <path d="M8 20V8M11 20v-8M14 20v-4M4 20h13" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 4.5-9 4.5-9-4.5z" />
      <path d="M3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M10 14h4M9 20h6M12 14v6" />
    </>
  ),
  gem: (
    <>
      <path d="M6 3h12l3 6-9 12L3 9z" />
      <path d="M3 9h18M9 3l-3 6 6 12 6-12-3-6" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M18.5 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10M12 14v2" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  arrow: <path d="M4 12h15m-6-6l6 6-6 6" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.6v.6" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.5l9.5 16.5H2.5z" />
      <path d="M12 9.5v5M12 17.4v.5" />
    </>
  ),
  insight: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .9 1.6h5.2c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 3z" />
    </>
  ),
  download: <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 19h16" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
    </>
  ),
  puzzle: (
    <>
      <path d="M10 4h4v2.2a1.8 1.8 0 1 0 3.6 0V4H20v4.4h-2.2a1.8 1.8 0 1 0 0 3.6H20V20h-4.4v-2.2a1.8 1.8 0 1 0-3.6 0V20H4v-4.4h2.2a1.8 1.8 0 1 0 0-3.6H4V8h4.4" />
    </>
  ),
  chest: (
    <>
      <path d="M3 10a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v9H3z" />
      <path d="M3 12h18M10.5 12h3v3h-3z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.2 8.8l-1.7 4.7-4.7 1.7 1.7-4.7z" />
    </>
  ),
  quill: (
    <>
      <path d="M20 3c-9 1-13 6-14 12l-2 5M4 20c6-1 11-5 12-13" />
      <path d="M12 12h4" />
    </>
  ),
  heart: (
    <path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.6 12 20 12 20z" />
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.3a3.2 3.2 0 0 1 0 5.4M17.5 13.6a5.5 5.5 0 0 1 3 4.9" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5l1.3 2.2 2.5-.4.5 2.5 2.3 1-.9 2.4.9 2.4-2.3 1-.5 2.5-2.5-.4L12 21.5l-1.3-2.2-2.5.4-.5-2.5-2.3-1 .9-2.4-.9-2.4 2.3-1 .5-2.5 2.5.4z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  play: <path d="M8 5.5l11 6.5-11 6.5z" />,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />,
  undo: (
    <>
      <path d="M8 5L3.5 9.5 8 14" />
      <path d="M3.5 9.5H15a5.5 5.5 0 0 1 0 11h-4" />
    </>
  ),
  redo: (
    <>
      <path d="M16 5l4.5 4.5L16 14" />
      <path d="M20.5 9.5H9a5.5 5.5 0 0 0 0 11h4" />
    </>
  ),
  metronome: (
    <>
      <path d="M9.5 3h5L18 21H6z" />
      <path d="M7 16h10M12 16L17.5 5.5" />
    </>
  ),
  loop: (
    <>
      <path d="M17 4l3 3-3 3" />
      <path d="M20 7H8a4.5 4.5 0 0 0 0 9h1M7 20l-3-3 3-3" />
      <path d="M4 17h12a4.5 4.5 0 0 0 2.5-8.2" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8z" />
  ),

  /* ---- Studio ---------------------------------------------------------- */
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 4l16 16" />
      <path d="M9.9 5.9A9.3 9.3 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.3 4M6.5 7.9A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 3.4-.65" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </>
  ),
  pause: (
    <>
      <rect x="7" y="5.5" width="3.5" height="13" rx="1" />
      <rect x="13.5" y="5.5" width="3.5" height="13" rx="1" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" />
    </>
  ),
  print: (
    <>
      <path d="M7 8.5V3.5h10v5" />
      <rect x="3.5" y="8.5" width="17" height="7.5" rx="1.5" />
      <path d="M7 14h10v6.5H7z" />
    </>
  ),
  save: (
    <>
      <path d="M4.5 4.5h11l4 4v11h-15z" />
      <path d="M8 4.5v5h6v-5M8 19.5v-5h8v5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4.5M7.5 9L12 4.5 16.5 9" />
      <path d="M4 15.5v3a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-3" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v4h4" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  comment: (
    <path d="M20.5 15a2.5 2.5 0 0 1-2.5 2.5H8L4 21V6a2.5 2.5 0 0 1 2.5-2.5H18A2.5 2.5 0 0 1 20.5 6z" />
  ),
  sliders: (
    <>
      <path d="M5 20V14M5 10V4M12 20v-9M12 7V4M19 20v-5M19 11V4" />
      <path d="M2.5 14h5M9.5 7h5M16.5 15h5" />
    </>
  ),
  piano: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M8 5v9M13 5v9M18 5v9M3 14h18" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5M8 10.5h5M10.5 8v5" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5M8 10.5h5" />
    </>
  ),
  expand: <path d="M8.5 3.5h-5v5M15.5 3.5h5v5M15.5 20.5h5v-5M8.5 20.5h-5v-5" />,
  panelLeft: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <path d="M9.5 4.5v15" />
    </>
  ),
  panelRight: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <path d="M14.5 4.5v15" />
    </>
  ),
  skipBack: (
    <>
      <path d="M18 5.5v13L8 12z" />
      <path d="M6 5.5v13" />
    </>
  ),
  skipForward: (
    <>
      <path d="M6 5.5v13L16 12z" />
      <path d="M18 5.5v13" />
    </>
  ),
  rewind: <path d="M12 5.5v13L3.5 12zM21 5.5v13L12.5 12z" />,
  trash: (
    <>
      <path d="M4 6.5h16M9.5 6.5V4h5v2.5" />
      <path d="M6 6.5l1 13.5h10l1-13.5M10 10v7M14 10v7" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="1.5" />
      <path d="M15.5 8.5v-3a1.5 1.5 0 0 0-1.5-1.5H5a1.5 1.5 0 0 0-1.5 1.5V14A1.5 1.5 0 0 0 5 15.5h3" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20l.9-4.2L16 4.7a2 2 0 0 1 2.8 0l.5.5a2 2 0 0 1 0 2.8L8.2 19.1z" />
      <path d="M14.5 6.5l3 3" />
    </>
  ),
  midi: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="8.5" cy="10" r="1" />
      <circle cx="15.5" cy="10" r="1" />
      <circle cx="12" cy="8.5" r="1" />
      <path d="M8 17h8" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  className = "",
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Maps a SkillKey to its icon so skill lists stay consistent everywhere. */
export const SKILL_ICONS: Record<string, IconName> = {
  MELODY: "note",
  HARMONY: "chord",
  RHYTHM: "drum",
  FORM: "column",
  TECHNIQUE: "bolt",
  EXPRESSION: "moon",
  INSTRUMENTATION: "harp",
  COUNTERPOINT: "layers",
  ORCHESTRATION: "layers",
};

/** Maps a dungeon room type to its icon. */
export const ROOM_ICONS: Record<string, IconName> = {
  CHALLENGE: "sword",
  PUZZLE: "puzzle",
  CURSE: "moon",
  TREASURE: "chest",
  REST: "flame",
  BOSS: "skull",
  EVENT: "sparkle",
};
