/**
 * The Entrance Hall banner's backdrop: a piano keyboard catching warm light
 * on the right, and a curl of handwritten sheet music in the top corner —
 * standing in for the photograph the mockup uses, drawn instead so the app
 * stays installable with no image assets to ship.
 */
export function HallBannerArt() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {/* Piano keys, angled slightly and lit from the upper left. */}
      <svg
        className="absolute inset-y-0 right-0 h-full w-[62%]"
        viewBox="0 0 620 300"
        preserveAspectRatio="xMaxYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="hb-white-key" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdf8ec" />
            <stop offset="55%" stopColor="#e9dfc8" />
            <stop offset="100%" stopColor="#c7b98f" />
          </linearGradient>
          <linearGradient id="hb-black-key" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a3226" />
            <stop offset="100%" stopColor="#0e0b06" />
          </linearGradient>
          <radialGradient id="hb-glow" cx="30%" cy="20%" r="85%">
            <stop offset="0%" stopColor="#f4c86a" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#e3a94a" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#e3a94a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hb-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0a0810" stopOpacity="1" />
            <stop offset="28%" stopColor="#0a0810" stopOpacity="0.55" />
            <stop offset="65%" stopColor="#0a0810" stopOpacity="0" />
            {/* The far edge dims again, like a lens losing focus at the frame's
                border — and, not incidentally, keeps the word list that sits
                there readable against keys that would otherwise run bright
                white right up to the corner. */}
            <stop offset="68%" stopColor="#0a0810" stopOpacity="0" />
            <stop offset="82%" stopColor="#0a0810" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0a0810" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        <g transform="skewY(-6) translate(0 40)">
          {Array.from({ length: 13 }).map((_, i) => (
            <rect
              key={i}
              x={40 + i * 44}
              y={70}
              width={40}
              height={210}
              rx={3}
              fill="url(#hb-white-key)"
              stroke="#00000022"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: 13 }).map((_, group) => {
            const pattern = [true, true, false, true, true, true, false];
            const within = group % 7;
            if (!pattern[within]) return null;
            return (
              <rect
                key={`b${group}`}
                x={40 + group * 44 + 27}
                y={70}
                width={26}
                height={128}
                rx={2.5}
                fill="url(#hb-black-key)"
              />
            );
          })}
        </g>

        <rect x="0" y="0" width="620" height="300" fill="url(#hb-glow)" />
        <rect x="0" y="0" width="620" height="300" fill="url(#hb-fade)" />
      </svg>

      {/* A curl of manuscript paper in the corner, where the mockup's sheet
          music sits — a torn triangle with a few handwritten-looking staff
          lines, catching the same warm light. */}
      <svg
        className="absolute -right-2 -top-4 h-40 w-56 opacity-90"
        viewBox="0 0 220 160"
        aria-hidden
      >
        <defs>
          <linearGradient id="hb-paper" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f6ecd2" />
            <stop offset="100%" stopColor="#d8c89a" />
          </linearGradient>
        </defs>
        <path
          d="M20 0 H220 V130 Q170 160 120 140 Q60 116 20 130 Z"
          fill="url(#hb-paper)"
          opacity={0.16}
        />
        <path
          d="M40 30 Q140 10 210 42"
          stroke="#f4ead1"
          strokeWidth={1.2}
          fill="none"
          opacity={0.5}
        />
        <path
          d="M40 46 Q140 26 210 58"
          stroke="#f4ead1"
          strokeWidth={1.2}
          fill="none"
          opacity={0.4}
        />
        <path
          d="M40 62 Q140 42 210 74"
          stroke="#f4ead1"
          strokeWidth={1.2}
          fill="none"
          opacity={0.3}
        />
      </svg>
    </div>
  );
}
