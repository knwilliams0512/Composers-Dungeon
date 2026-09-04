/**
 * Decorative scenes that sit behind a card and say what it is about.
 *
 * The app has no photography and shipping any would bloat an offline-first
 * installer, so the imagery is drawn: large, soft vector scenes tinted to the
 * card's own colour and anchored to its right edge, where they fill the space
 * a photograph would without ever competing with the text over them.
 *
 * Every motif draws inside a 200×140 box and is scaled by the card.
 */

export type MotifName =
  | "book"
  | "arch"
  | "crown"
  | "sheet"
  | "crystal"
  | "trophy"
  | "keys"
  | "candle"
  | "quill"
  | "tower"
  | "mask"
  | "strings";

export function Motif({
  name,
  tint,
  className = "",
  opacity = 0.5,
}: {
  name: MotifName;
  /** The card's accent; every shape is drawn from it. */
  tint: string;
  className?: string;
  opacity?: number;
}) {
  const id = `m-${name}-${tint.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      viewBox="0 0 200 140"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
    >
      <defs>
        <linearGradient id={`${id}-a`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={tint} stopOpacity="0.9" />
          <stop offset="100%" stopColor={tint} stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="70%" cy="40%" r="60%">
          <stop offset="0%" stopColor={tint} stopOpacity="0.55" />
          <stop offset="100%" stopColor={tint} stopOpacity="0" />
        </radialGradient>
        {/* The scene fades out towards the text on the left. */}
        <linearGradient id={`${id}-fade`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="40%" stopColor="#fff" stopOpacity="0" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={`${id}-mask`}>
          <rect width="200" height="140" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>

      <rect width="200" height="140" fill={`url(#${id}-glow)`} />
      <g mask={`url(#${id}-mask)`} fill="none" stroke={tint} strokeLinecap="round" strokeLinejoin="round">
        <Scene name={name} id={id} tint={tint} />
      </g>
    </svg>
  );
}

function Scene({ name, id, tint }: { name: MotifName; id: string; tint: string }) {
  const fill = `url(#${id}-a)`;
  switch (name) {
    case "book":
      return (
        <g>
          <path d="M118 96 Q150 82 182 96 L182 44 Q150 30 118 44 Z" fill={fill} strokeWidth="2" />
          <path d="M150 40 L150 92" strokeWidth="2" opacity="0.8" />
          {[54, 62, 70, 78].map((y) => (
            <g key={y} opacity="0.55">
              <path d={`M126 ${y} Q138 ${y - 3} 146 ${y - 1}`} strokeWidth="1.4" />
              <path d={`M154 ${y - 1} Q162 ${y - 3} 174 ${y}`} strokeWidth="1.4" />
            </g>
          ))}
        </g>
      );

    case "arch":
      return (
        <g>
          <path d="M116 118 L116 62 Q150 24 184 62 L184 118 Z" fill={fill} strokeWidth="2" />
          <path d="M130 118 L130 68 Q150 44 170 68 L170 118" strokeWidth="1.6" opacity="0.7" />
          {[76, 90, 104].map((y) => (
            <path key={y} d={`M130 ${y} L170 ${y}`} strokeWidth="1.2" opacity="0.4" />
          ))}
          <circle cx="150" cy="58" r="5" fill={tint} opacity="0.5" stroke="none" />
        </g>
      );

    case "crown":
      return (
        <g>
          <path d="M112 96 L120 50 L136 74 L150 42 L164 74 L180 50 L188 96 Z" fill={fill} strokeWidth="2" />
          <path d="M112 96 L188 96" strokeWidth="3" />
          {[120, 150, 180].map((x, i) => (
            <circle key={x} cx={x} cy={i === 1 ? 42 : 50} r="4" fill={tint} opacity="0.7" stroke="none" />
          ))}
        </g>
      );

    case "sheet":
      return (
        <g>
          <rect x="110" y="36" width="82" height="70" rx="4" fill={fill} strokeWidth="1.6" />
          {[50, 60, 70, 80, 90].map((y) => (
            <path key={y} d={`M118 ${y} L184 ${y}`} strokeWidth="1" opacity="0.5" />
          ))}
          <g fill={tint} stroke="none" opacity="0.85">
            <ellipse cx="132" cy="80" rx="6" ry="4.5" transform="rotate(-20 132 80)" />
            <ellipse cx="158" cy="60" rx="6" ry="4.5" transform="rotate(-20 158 60)" />
          </g>
          <path d="M137 79 L137 54" strokeWidth="1.8" />
          <path d="M163 59 L163 34" strokeWidth="1.8" />
          <path d="M137 54 Q148 50 148 42" strokeWidth="1.8" />
        </g>
      );

    case "crystal":
      return (
        <g>
          <path d="M150 26 L182 62 L164 112 L136 112 L118 62 Z" fill={fill} strokeWidth="2" />
          <path d="M150 26 L150 112 M118 62 L182 62 M136 112 L150 62 L164 112" strokeWidth="1.3" opacity="0.6" />
          <circle cx="150" cy="62" r="26" fill={tint} opacity="0.12" stroke="none" />
        </g>
      );

    case "trophy":
      return (
        <g>
          <path d="M126 38 L174 38 L170 76 Q150 92 130 76 Z" fill={fill} strokeWidth="2" />
          <path d="M126 46 Q110 48 114 62 Q117 72 128 70" strokeWidth="2" />
          <path d="M174 46 Q190 48 186 62 Q183 72 172 70" strokeWidth="2" />
          <path d="M150 88 L150 104 M132 108 L168 108" strokeWidth="3" />
          <path d="M138 112 L162 112" strokeWidth="4" opacity="0.8" />
        </g>
      );

    case "keys":
      return (
        <g>
          <rect x="106" y="46" width="90" height="60" rx="3" fill={fill} strokeWidth="1.6" />
          {[121, 136, 151, 166, 181].map((x) => (
            <path key={x} d={`M${x} 46 L${x} 106`} strokeWidth="1.2" opacity="0.55" />
          ))}
          <g fill={tint} opacity="0.75" stroke="none">
            {[115, 130, 159, 174].map((x) => (
              <rect key={x} x={x} y="46" width="9" height="34" rx="2" />
            ))}
          </g>
        </g>
      );

    case "candle":
      return (
        <g>
          <rect x="136" y="62" width="20" height="48" rx="3" fill={fill} strokeWidth="1.6" />
          <path d="M146 62 L146 54" strokeWidth="2" />
          <path d="M146 54 Q138 44 146 30 Q154 44 146 54 Z" fill={tint} opacity="0.85" strokeWidth="1.4" />
          <circle cx="146" cy="42" r="18" fill={tint} opacity="0.16" stroke="none" />
          <path d="M110 110 L190 110" strokeWidth="2" opacity="0.6" />
          <path d="M162 96 L188 96 L188 110 L162 110 Z" strokeWidth="1.4" opacity="0.5" />
        </g>
      );

    case "quill":
      return (
        <g>
          <path d="M186 30 Q140 46 122 92 Q118 102 126 100 Q168 84 186 30 Z" fill={fill} strokeWidth="1.8" />
          <path d="M176 42 Q146 60 130 92" strokeWidth="1.3" opacity="0.6" />
          <path d="M126 100 L112 114" strokeWidth="2.4" />
          <path d="M108 118 L120 118" strokeWidth="2" opacity="0.5" />
        </g>
      );

    case "tower":
      return (
        <g>
          <path d="M126 116 L126 52 L150 30 L174 52 L174 116 Z" fill={fill} strokeWidth="2" />
          {[66, 84, 102].map((y) => (
            <path key={y} d={`M126 ${y} L174 ${y}`} strokeWidth="1.2" opacity="0.45" />
          ))}
          <rect x="143" y="70" width="14" height="20" rx="7" fill={tint} opacity="0.55" stroke="none" />
          <path d="M150 30 L150 18 M144 20 L156 20" strokeWidth="2" />
        </g>
      );

    case "mask":
      return (
        <g>
          <path d="M118 44 Q150 34 182 44 Q184 84 150 110 Q116 84 118 44 Z" fill={fill} strokeWidth="2" />
          <path d="M132 64 Q140 58 148 64 M152 64 Q160 58 168 64" strokeWidth="2" />
          <path d="M138 88 Q150 96 162 88" strokeWidth="2" opacity="0.7" />
        </g>
      );

    case "strings":
      return (
        <g>
          <path d="M150 28 Q176 48 172 78 Q168 108 150 116 Q132 108 128 78 Q124 48 150 28 Z" fill={fill} strokeWidth="2" />
          <path d="M150 28 L150 116" strokeWidth="1.4" opacity="0.6" />
          {[44, 58].map((x, i) => (
            <path key={x} d={`M${140 + i * 20} 40 L${140 + i * 20} 112`} strokeWidth="1" opacity="0.4" />
          ))}
          <path d="M136 74 Q140 66 144 74 M156 74 Q160 66 164 74" strokeWidth="1.6" opacity="0.7" />
        </g>
      );
  }
}
