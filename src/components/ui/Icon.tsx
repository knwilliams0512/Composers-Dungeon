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
  | "staff"
  | "arch"
  | "waveform"
  | "user"
  | "clef";

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
  arch: (
    <>
      <path d="M4 21V11a8 8 0 0 1 16 0v10" />
      <path d="M4 21h16M8 21v-8M16 21v-8" />
    </>
  ),
  waveform: (
    <>
      <path d="M3 12h2M21 12h-2" />
      <path d="M7 12v0M7 9v6M11 5v14M15 8v8M19 12v0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6" />
    </>
  ),
  note: (
    <>
      <path d="M9 18V5l10-2v13" />
      <ellipse cx="6.5" cy="18" rx="2.5" ry="2" />
      <ellipse cx="16.5" cy="16" rx="2.5" ry="2" />
    </>
  ),
  /* A treble clef, written the way the glyph is: bottom hook, up the stem,
     crook over the top, down the left, out around the bowl, spiral into the
     eye. One continuous stroke, so it holds together down to 16px. */
  clef: (
    <path d="M9.2 20.8C8.5 22.8 10.7 23.8 12.3 22.4 13.3 21.4 13 19.9 12.8 18.5 13.4 13.2 14.3 7.4 13.7 3.4 13.5 1.6 11.1 1.2 10.2 3.1 9 5.5 10.1 8 11.7 10 13.6 12.2 16.2 13.6 16.2 16.2 16.2 19.2 13.5 20.9 10.9 20.2 8.3 19.5 6.8 17.4 7.1 15.1 7.4 13 9.2 11.8 11 12.3 12.6 12.7 13.3 14 12.9 15.2" />
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

/**
 * Filled counterparts for the marks that name a place in the app.
 *
 * Line icons read as chrome; a destination wants weight and a colour of its
 * own, so the Academy's book and the Guild's crowd carry the same presence
 * here as the artwork they sit beside. Details are cut as holes
 * (`fill-rule="evenodd"`) rather than painted in a background colour, so a
 * mark looks right on a sidebar, a chip or a photograph alike.
 */
const SOLID_PATHS: Partial<Record<IconName, JSX.Element>> = {
  hall: (
    <path
      fillRule="evenodd"
      d="M12.68 2.26a1 1 0 0 0-1.36 0L1.6 11.1a1 1 0 0 0 .66 1.75H4V21a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.15h1.74a1 1 0 0 0 .66-1.75zM9.7 21.9v-5.3a2.3 2.3 0 0 1 4.6 0v5.3z"
    />
  ),
  book: (
    <>
      <path d="M11 6.6C8.5 4.7 5.7 4.3 2.9 4.8A1.2 1.2 0 0 0 2 6v11.6a1.2 1.2 0 0 0 1.5 1.16c2.3-.5 4.9-.2 7 1.3.3.2.5-.1.5-.4z" />
      <path
        opacity=".5"
        d="M13 6.6c2.5-1.9 5.3-2.3 8.1-1.8A1.2 1.2 0 0 1 22 6v11.6a1.2 1.2 0 0 1-1.5 1.16c-2.3-.5-4.9-.2-7 1.3-.3.2-.5-.1-.5-.4z"
      />
    </>
  ),
  arch: (
    <>
      <path d="M12 1.8A8.6 8.6 0 0 0 3.4 10.4V21a1 1 0 0 0 1 1h3.3a1 1 0 0 0 1-1v-10.6a3.3 3.3 0 0 1 6.6 0V21a1 1 0 0 0 1 1h3.3a1 1 0 0 0 1-1V10.4A8.6 8.6 0 0 0 12 1.8" />
      <path
        opacity=".45"
        d="M12 6.4a4 4 0 0 0-1.6.33V21a1 1 0 0 1-1 1h5.2a1 1 0 0 1-1-1V6.73A4 4 0 0 0 12 6.4"
      />
    </>
  ),
  quill: (
    <path
      fillRule="evenodd"
      d="M21.35 2.14a1.4 1.4 0 0 0-.5-.05c-6.06.66-10.5 3.24-12.66 7.06-1.4 2.47-1.53 5.02-.63 7.2l-1.9 1.9-1.9 1.9a1 1 0 1 0 1.42 1.42l1.9-1.9 1.9-1.9c2.18.9 4.73.77 7.2-.63 3.82-2.16 6.4-6.6 7.06-12.66a1.4 1.4 0 0 0-1.9-1.54zM18.9 5.1l1.06 1.06-9.9 9.9-1.06-1.06z"
    />
  ),
  skull: (
    <path
      fillRule="evenodd"
      d="M12 1.9C7 1.9 3.3 5.5 3.3 10.3c0 2.7 1.2 4.7 2.7 6v3.1a2.6 2.6 0 0 0 2.6 2.6h6.8a2.6 2.6 0 0 0 2.6-2.6v-3.1c1.5-1.3 2.7-3.3 2.7-6C20.7 5.5 17 1.9 12 1.9m-3.3 6.3a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2m6.6 0a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2M12 13.6l1.3 2.6h-2.6z"
    />
  ),
  waveform: (
    <>
      <rect x="2" y="10" width="2.4" height="4" rx="1.2" />
      <rect x="6" y="6.5" width="2.4" height="11" rx="1.2" />
      <rect x="10" y="3" width="2.4" height="18" rx="1.2" />
      <rect x="14" y="7.5" width="2.4" height="9" rx="1.2" />
      <rect x="18" y="10.5" width="2.4" height="3" rx="1.2" />
    </>
  ),
  scroll: (
    <>
      <path d="M3.4 3.6h4.2a1 1 0 0 1 1 1v14.8a1 1 0 0 1-1 1H3.4a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1" />
      <path
        opacity=".55"
        d="M10.4 3.6h4a1 1 0 0 1 1 1v14.8a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1"
      />
      <path
        opacity=".8"
        d="m18.1 4.1 2.9.8a1 1 0 0 1 .7 1.23l-3.7 13.8a1 1 0 0 1-1.23.7l-2.9-.78a1 1 0 0 1-.7-1.23l3.7-13.8a1 1 0 0 1 1.23-.7"
      />
    </>
  ),
  users: (
    <>
      <circle cx="12" cy="7.2" r="3.4" />
      <path d="M5.4 20.4c0-3.6 3-6 6.6-6s6.6 2.4 6.6 6a1 1 0 0 1-1 1H6.4a1 1 0 0 1-1-1" />
      <g opacity=".5">
        <circle cx="4.6" cy="9.4" r="2.5" />
        <path d="M1 19.2c0-2.4 1.6-4.2 3.6-4.2.5 0 1 .1 1.4.3-1 1.1-1.6 2.5-1.7 4z" />
        <circle cx="19.4" cy="9.4" r="2.5" />
        <path d="M23 19.2c0-2.4-1.6-4.2-3.6-4.2-.5 0-1 .1-1.4.3 1 1.1 1.6 2.5 1.7 4z" />
      </g>
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7.6" r="4.1" />
      <path d="M4.6 20.6c0-3.9 3.3-6.6 7.4-6.6s7.4 2.7 7.4 6.6a1.2 1.2 0 0 1-1.2 1.2H5.8a1.2 1.2 0 0 1-1.2-1.2" />
    </>
  ),
  settings: (
    <path
      fillRule="evenodd"
      d="M10.3 1.3a.9.9 0 0 0-.89.75l-.32 2.2a8.4 8.4 0 0 0-2.7 1.56l-2.07-.83a.9.9 0 0 0-1.11.4l-1.7 2.94a.9.9 0 0 0 .22 1.15l1.75 1.36a8.5 8.5 0 0 0 0 3.12l-1.75 1.36a.9.9 0 0 0-.22 1.15l1.7 2.94a.9.9 0 0 0 1.11.4l2.07-.83a8.4 8.4 0 0 0 2.7 1.56l.32 2.2a.9.9 0 0 0 .89.75h3.4a.9.9 0 0 0 .89-.75l.32-2.2a8.4 8.4 0 0 0 2.7-1.56l2.07.83a.9.9 0 0 0 1.11-.4l1.7-2.94a.9.9 0 0 0-.22-1.15l-1.75-1.36a8.5 8.5 0 0 0 0-3.12l1.75-1.36a.9.9 0 0 0 .22-1.15l-1.7-2.94a.9.9 0 0 0-1.11-.4l-2.07.83a8.4 8.4 0 0 0-2.7-1.56l-.32-2.2a.9.9 0 0 0-.89-.75zM12 8.6a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8"
    />
  ),

  /* The marks that stand for a skill, a stat or a room type. Anything without
     an entry here simply keeps its line icon, so the set can grow one glyph at
     a time without a half-drawn shape ever reaching a page. */
  note: (
    <path d="M19.2 2.2a1 1 0 0 0-1.18-.98l-8.4 1.62A1 1 0 0 0 8.8 3.82v10.6a3.4 3.4 0 1 0 2 3.1V8.2l6.4-1.24v5.66a3.4 3.4 0 1 0 2 3.1z" />
  ),
  chord: (
    <>
      <g opacity=".38">
        <rect x="3" y="5.2" width="18" height="1.5" rx=".75" />
        <rect x="3" y="11.25" width="18" height="1.5" rx=".75" />
        <rect x="3" y="17.3" width="18" height="1.5" rx=".75" />
      </g>
      <circle cx="8" cy="5.95" r="2.6" />
      <circle cx="12" cy="12" r="2.6" />
      <circle cx="16" cy="18.05" r="2.6" />
    </>
  ),
  drum: (
    <>
      <path opacity=".6" d="M4 7.4v9.2c0 2.1 3.6 3.8 8 3.8s8-1.7 8-3.8V7.4z" />
      <path
        fillRule="evenodd"
        d="M12 3.7c4.42 0 8 1.66 8 3.7s-3.58 3.7-8 3.7-8-1.66-8-3.7 3.58-3.7 8-3.7m0 1.5c-2.87 0-5.2.98-5.2 2.2s2.33 2.2 5.2 2.2 5.2-.98 5.2-2.2-2.33-2.2-5.2-2.2"
      />
      <path d="M5.6 11.4 8 14.6l-2.4 3.2-.9-.7 1.86-2.5-1.86-2.5zM18.4 11.4l.9.7-1.86 2.5 1.86 2.5-.9.7L16 14.6z" />
    </>
  ),
  column: (
    <>
      <path d="M4.6 2.4h14.8a1 1 0 0 1 1 1v1.4a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1V3.4a1 1 0 0 1 1-1" />
      <path d="M4.6 18.2h14.8a1 1 0 0 1 1 1v1.4a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1v-1.4a1 1 0 0 1 1-1" />
      <g opacity=".72">
        <rect x="6.6" y="6.6" width="3.1" height="11.2" rx="1.2" />
        <rect x="14.3" y="6.6" width="3.1" height="11.2" rx="1.2" />
      </g>
    </>
  ),
  bolt: (
    <path d="M14.05 1.63a.8.8 0 0 0-1.4-.5L4.4 12.9a.8.8 0 0 0 .65 1.27h4.02l-.72 8.2a.8.8 0 0 0 1.44.56l8.25-11.77a.8.8 0 0 0-.66-1.26h-4.05z" />
  ),
  moon: (
    <>
      <path d="M21 14.6A9.4 9.4 0 0 1 9.4 3a9.4 9.4 0 1 0 11.6 11.6" />
      <g opacity=".55">
        <circle cx="17.6" cy="4.6" r="1.2" />
        <circle cx="20.4" cy="8.4" r=".8" />
      </g>
    </>
  ),
  gem: (
    <path
      fillRule="evenodd"
      d="M8.3 2.2h7.4a1 1 0 0 1 .84.46l3.66 5.7a1 1 0 0 1-.03 1.12l-7.36 10.3a1 1 0 0 1-1.62 0L3.83 9.48a1 1 0 0 1-.03-1.12l3.66-5.7a1 1 0 0 1 .84-.46m.6 1.2h.9l-1.7 5.1h-.9zm5.3 0h.9l1.7 5.1h-.9zM4.2 8.5h15.6v.9H4.2z"
    />
  ),
  trophy: (
    <path
      fillRule="evenodd"
      d="M6.6 2.2a1 1 0 0 0-1 1v1.4H3.2a1 1 0 0 0-1 1v1.6a5.2 5.2 0 0 0 4.7 5.18 5.6 5.6 0 0 0 4.1 3.5v2.72H8a1 1 0 0 0-1 1v2.2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2.2a1 1 0 0 0-1-1h-3v-2.72a5.6 5.6 0 0 0 4.1-3.5A5.2 5.2 0 0 0 21.8 7.2V5.6a1 1 0 0 0-1-1h-2.4V3.2a1 1 0 0 0-1-1zM5.6 6.6v3.66A3.2 3.2 0 0 1 4.2 7.2v-.6zm12.8 0h1.4v.6a3.2 3.2 0 0 1-1.4 3.06z"
    />
  ),
  layers: (
    <>
      <path d="M11.5 2.3a1 1 0 0 1 1 0l8.4 4.4a1 1 0 0 1 0 1.77l-8.4 4.4a1 1 0 0 1-1 0L3.1 8.47a1 1 0 0 1 0-1.77z" />
      <path
        opacity=".55"
        d="m3.1 12.1 1.9-1 6.5 3.4a1 1 0 0 0 1 0l6.5-3.4 1.9 1a1 1 0 0 1 0 1.77l-8.4 4.4a1 1 0 0 1-1 0l-8.4-4.4a1 1 0 0 1 0-1.77"
      />
    </>
  ),
  flame: (
    <path
      fillRule="evenodd"
      d="M12.6 1.4a1 1 0 0 0-1.6.5c-.7 2.7-2 4.1-3.3 5.6C6.2 9.2 4.8 10.9 4.8 14a7.2 7.2 0 1 0 14.4 0c0-3.6-1.8-6.1-3.5-8.2a19 19 0 0 1-3.1-4.4M12 11.4c1.6 1.5 2.7 2.8 2.7 4.5a2.7 2.7 0 1 1-5.4 0c0-1.7 1.1-3 2.7-4.5"
    />
  ),
  chest: (
    <path
      fillRule="evenodd"
      d="M4.4 5.2A3.2 3.2 0 0 1 7.6 2h8.8a3.2 3.2 0 0 1 3.2 3.2V9H4.4zM3.4 10.8a1 1 0 0 0-1 1v7.4A2.8 2.8 0 0 0 5.2 22h13.6a2.8 2.8 0 0 0 2.8-2.8v-7.4a1 1 0 0 0-1-1zm7.4 3.2h2.4a1 1 0 0 1 1 1v1.6a1 1 0 0 1-1 1h-2.4a1 1 0 0 1-1-1V15a1 1 0 0 1 1-1"
    />
  ),
  sparkle: (
    <>
      <path d="M12 1.6a.8.8 0 0 1 .77.58l1.36 4.7 4.7 1.36a.8.8 0 0 1 0 1.54l-4.7 1.36-1.36 4.7a.8.8 0 0 1-1.54 0L9.87 11.14 5.17 9.78a.8.8 0 0 1 0-1.54l4.7-1.36 1.36-4.7A.8.8 0 0 1 12 1.6" />
      <path
        opacity=".6"
        d="M18.6 14.4a.6.6 0 0 1 .58.43l.6 2.05 2.05.6a.6.6 0 0 1 0 1.16l-2.05.6-.6 2.05a.6.6 0 0 1-1.16 0l-.6-2.05-2.05-.6a.6.6 0 0 1 0-1.16l2.05-.6.6-2.05a.6.6 0 0 1 .58-.43"
      />
    </>
  ),
  sword: (
    <path d="M20.9 2.2 14 9.1l-1.4-1.4-1.42 1.42 1.4 1.4-1.7 1.7-1.4-1.4L8.06 12.24l1.4 1.4-2.3 2.3a1 1 0 0 0 0 1.42l.72.7-2.9 2.9a1 1 0 1 0 1.42 1.42l2.9-2.9.7.72a1 1 0 0 0 1.42 0l2.3-2.3 1.4 1.4 1.42-1.42-1.4-1.4 1.7-1.7 1.4 1.4 1.42-1.42-1.4-1.4 6.9-6.9z" />
  ),
  puzzle: (
    <path d="M10.4 2a2.6 2.6 0 0 0-2.6 2.6v.8H5.2a1.4 1.4 0 0 0-1.4 1.4v3.1h1.1a2.5 2.5 0 0 1 0 5H3.8v3.1a1.4 1.4 0 0 0 1.4 1.4h3.1v-1.1a2.5 2.5 0 0 1 5 0v1.1h3.1a1.4 1.4 0 0 0 1.4-1.4v-2.6h.8a2.6 2.6 0 0 0 0-5.2h-.8V6.8a1.4 1.4 0 0 0-1.4-1.4H13v-.8A2.6 2.6 0 0 0 10.4 2" />
  ),
  star: (
    <path d="M12 1.8a.9.9 0 0 1 .82.53l2.6 5.62 6.14.74a.9.9 0 0 1 .5 1.56l-4.54 4.2 1.2 6.07a.9.9 0 0 1-1.33.96L12 18.4l-5.39 3.08a.9.9 0 0 1-1.33-.96l1.2-6.07-4.54-4.2a.9.9 0 0 1 .5-1.56l6.14-.74 2.6-5.62A.9.9 0 0 1 12 1.8" />
  ),
  target: (
    <>
      <path
        fillRule="evenodd"
        d="M12 1.8A10.2 10.2 0 1 0 22.2 12 10.2 10.2 0 0 0 12 1.8m0 3.4a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6"
      />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="5" />
      <g opacity=".85">
        <rect x="11" y="1" width="2" height="4" rx="1" />
        <rect x="11" y="19" width="2" height="4" rx="1" />
        <rect x="1" y="11" width="4" height="2" rx="1" />
        <rect x="19" y="11" width="4" height="2" rx="1" />
        <rect x="4.05" y="4.4" width="2" height="4" rx="1" transform="rotate(-45 5.05 6.4)" />
        <rect x="17.95" y="15.6" width="2" height="4" rx="1" transform="rotate(-45 18.95 17.6)" />
        <rect x="4.05" y="15.6" width="2" height="4" rx="1" transform="rotate(45 5.05 17.6)" />
        <rect x="17.95" y="4.4" width="2" height="4" rx="1" transform="rotate(45 18.95 6.4)" />
      </g>
    </>
  ),
  compass: (
    <path
      fillRule="evenodd"
      d="M12 1.8A10.2 10.2 0 1 0 22.2 12 10.2 10.2 0 0 0 12 1.8m4.6 4.5a.9.9 0 0 1 1.1 1.1l-2 6.9a.9.9 0 0 1-.6.6l-6.9 2a.9.9 0 0 1-1.1-1.1l2-6.9a.9.9 0 0 1 .6-.6zm-4.6 4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4"
    />
  ),
};

export function Icon({
  name,
  size = 18,
  className = "",
  solid = false,
  ...rest
}: {
  name: IconName;
  size?: number;
  /** Render the filled mark, where one exists. Falls back to the line icon. */
  solid?: boolean;
} & SVGProps<SVGSVGElement>) {
  const filled = solid ? SOLID_PATHS[name] : undefined;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
      {...rest}
    >
      {filled ?? PATHS[name]}
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
