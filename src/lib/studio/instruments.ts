/**
 * The instrument catalogue the Studio writes scores for.
 *
 * Every entry carries the facts an engraver and a playback engine both need:
 * which clef the part is written in, how far the written pitch sits from the
 * sounding one, where the instrument's range begins and ends, and how to
 * synthesise a passable imitation of its timbre.
 */

export type Family =
  | "strings"
  | "woodwinds"
  | "brass"
  | "percussion"
  | "keyboards"
  | "voices"
  | "guitars"
  | "electronic"
  | "world";

export const FAMILY_LABELS: Record<Family, string> = {
  strings: "Strings",
  woodwinds: "Woodwinds",
  brass: "Brass",
  percussion: "Percussion",
  keyboards: "Keyboards",
  voices: "Voices",
  guitars: "Guitars",
  electronic: "Electronic",
  world: "World",
};

export const FAMILY_ORDER: Family[] = [
  "woodwinds",
  "brass",
  "percussion",
  "keyboards",
  "voices",
  "guitars",
  "strings",
  "electronic",
  "world",
];

export type Clef = "treble" | "bass" | "alto" | "tenor" | "percussion" | "tab";

/** The timbre families the synth knows how to shape an envelope for. */
export type Timbre =
  | "bowed"
  | "plucked"
  | "reed"
  | "flute"
  | "brass"
  | "struck"
  | "voice"
  | "electronic"
  | "drum";

export interface Instrument {
  id: string;
  name: string;
  /** How the part is labelled after the first system, e.g. "Vln. I". */
  short: string;
  family: Family;
  /** One clef per staff: two entries means a grand staff. */
  clefs: Clef[];
  /** Sounding pitch minus written pitch. A Bb clarinet is -2. */
  transpose: number;
  /** Playable range as MIDI numbers, sounding. */
  range: [number, number];
  timbre: Timbre;
  /** Staff lines — percussion parts often want one, tablature six. */
  lines?: number;
  /** True when the two staves are joined by a brace rather than a bracket. */
  brace?: boolean;
}

/* -------------------------------------------------------------------------- */
/* The catalogue                                                               */
/* -------------------------------------------------------------------------- */

const I = (
  id: string,
  name: string,
  short: string,
  family: Family,
  clefs: Clef[],
  transpose: number,
  range: [number, number],
  timbre: Timbre,
  extra: Partial<Instrument> = {}
): Instrument => ({ id, name, short, family, clefs, transpose, range, timbre, ...extra });

export const INSTRUMENTS: Instrument[] = [
  /* ---- Woodwinds -------------------------------------------------------- */
  I("piccolo", "Piccolo", "Picc.", "woodwinds", ["treble"], 12, [74, 108], "flute"),
  I("flute", "Flute", "Fl.", "woodwinds", ["treble"], 0, [60, 96], "flute"),
  I("alto-flute", "Alto Flute", "A. Fl.", "woodwinds", ["treble"], -5, [55, 91], "flute"),
  I("recorder", "Recorder", "Rec.", "woodwinds", ["treble"], 0, [72, 98], "flute"),
  I("oboe", "Oboe", "Ob.", "woodwinds", ["treble"], 0, [58, 91], "reed"),
  I("english-horn", "English Horn", "E. Hn.", "woodwinds", ["treble"], -7, [52, 84], "reed"),
  I("clarinet-bb", "Clarinet in B♭", "Cl.", "woodwinds", ["treble"], -2, [50, 91], "reed"),
  I("clarinet-a", "Clarinet in A", "Cl. A", "woodwinds", ["treble"], -3, [49, 89], "reed"),
  I("bass-clarinet", "Bass Clarinet", "B. Cl.", "woodwinds", ["treble"], -14, [38, 79], "reed"),
  I("bassoon", "Bassoon", "Bsn.", "woodwinds", ["bass"], 0, [34, 74], "reed"),
  I("contrabassoon", "Contrabassoon", "Cbsn.", "woodwinds", ["bass"], -12, [22, 60], "reed"),
  I("soprano-sax", "Soprano Saxophone", "S. Sax.", "woodwinds", ["treble"], -2, [56, 87], "reed"),
  I("alto-sax", "Alto Saxophone", "A. Sax.", "woodwinds", ["treble"], -9, [49, 80], "reed"),
  I("tenor-sax", "Tenor Saxophone", "T. Sax.", "woodwinds", ["treble"], -14, [44, 75], "reed"),
  I("baritone-sax", "Baritone Saxophone", "Bar. Sax.", "woodwinds", ["treble"], -21, [37, 68], "reed"),

  /* ---- Brass ------------------------------------------------------------ */
  I("horn", "Horn in F", "Hn.", "brass", ["treble"], -7, [34, 77], "brass"),
  I("trumpet", "Trumpet in B♭", "Tpt.", "brass", ["treble"], -2, [52, 82], "brass"),
  I("trumpet-c", "Trumpet in C", "C Tpt.", "brass", ["treble"], 0, [54, 84], "brass"),
  I("cornet", "Cornet", "Cnt.", "brass", ["treble"], -2, [52, 82], "brass"),
  I("flugelhorn", "Flugelhorn", "Flg.", "brass", ["treble"], -2, [52, 79], "brass"),
  I("trombone", "Trombone", "Tbn.", "brass", ["bass"], 0, [40, 72], "brass"),
  I("bass-trombone", "Bass Trombone", "B. Tbn.", "brass", ["bass"], 0, [34, 67], "brass"),
  I("euphonium", "Euphonium", "Euph.", "brass", ["bass"], 0, [38, 72], "brass"),
  I("tuba", "Tuba", "Tba.", "brass", ["bass"], 0, [26, 65], "brass"),

  /* ---- Percussion ------------------------------------------------------- */
  I("timpani", "Timpani", "Timp.", "percussion", ["bass"], 0, [36, 60], "drum"),
  I("snare", "Snare Drum", "S. D.", "percussion", ["percussion"], 0, [38, 38], "drum", { lines: 1 }),
  I("bass-drum", "Bass Drum", "B. D.", "percussion", ["percussion"], 0, [35, 35], "drum", { lines: 1 }),
  I("drum-set", "Drum Set", "Drs.", "percussion", ["percussion"], 0, [35, 59], "drum", { lines: 5 }),
  I("cymbals", "Cymbals", "Cym.", "percussion", ["percussion"], 0, [49, 49], "drum", { lines: 1 }),
  I("triangle", "Triangle", "Tri.", "percussion", ["percussion"], 0, [81, 81], "drum", { lines: 1 }),
  I("tambourine", "Tambourine", "Tamb.", "percussion", ["percussion"], 0, [54, 54], "drum", { lines: 1 }),
  I("glockenspiel", "Glockenspiel", "Glock.", "percussion", ["treble"], 24, [79, 108], "struck"),
  I("xylophone", "Xylophone", "Xyl.", "percussion", ["treble"], 12, [65, 108], "struck"),
  I("vibraphone", "Vibraphone", "Vib.", "percussion", ["treble"], 0, [53, 89], "struck"),
  I("marimba", "Marimba", "Mrmb.", "percussion", ["treble", "bass"], 0, [45, 96], "struck", { brace: true }),
  I("tubular-bells", "Tubular Bells", "Bells", "percussion", ["treble"], 0, [60, 89], "struck"),

  /* ---- Keyboards -------------------------------------------------------- */
  I("piano", "Piano", "Pno.", "keyboards", ["treble", "bass"], 0, [21, 108], "struck", { brace: true }),
  I("harpsichord", "Harpsichord", "Hpsd.", "keyboards", ["treble", "bass"], 0, [29, 89], "plucked", { brace: true }),
  I("celesta", "Celesta", "Cel.", "keyboards", ["treble", "bass"], 12, [60, 108], "struck", { brace: true }),
  I("organ", "Organ", "Org.", "keyboards", ["treble", "bass"], 0, [36, 96], "reed", { brace: true }),
  I("harp", "Harp", "Hp.", "keyboards", ["treble", "bass"], 0, [24, 103], "plucked", { brace: true }),
  I("accordion", "Accordion", "Acc.", "keyboards", ["treble", "bass"], 0, [41, 89], "reed", { brace: true }),

  /* ---- Voices ----------------------------------------------------------- */
  I("soprano", "Soprano", "S.", "voices", ["treble"], 0, [60, 81], "voice"),
  I("mezzo-soprano", "Mezzo-Soprano", "M-S.", "voices", ["treble"], 0, [57, 79], "voice"),
  I("alto-voice", "Alto", "A.", "voices", ["treble"], 0, [55, 74], "voice"),
  I("tenor-voice", "Tenor", "T.", "voices", ["treble"], -12, [48, 72], "voice"),
  I("baritone-voice", "Baritone", "Bar.", "voices", ["bass"], 0, [45, 67], "voice"),
  I("bass-voice", "Bass", "B.", "voices", ["bass"], 0, [40, 64], "voice"),

  /* ---- Guitars ---------------------------------------------------------- */
  I("guitar", "Classical Guitar", "Gtr.", "guitars", ["treble"], -12, [40, 84], "plucked"),
  I("steel-guitar", "Steel-String Guitar", "St. Gtr.", "guitars", ["treble"], -12, [40, 84], "plucked"),
  I("electric-guitar", "Electric Guitar", "E. Gtr.", "guitars", ["treble"], -12, [40, 88], "plucked"),
  I("guitar-tab", "Guitar (Tablature)", "Gtr.", "guitars", ["tab"], -12, [40, 84], "plucked", { lines: 6 }),
  I("bass-guitar", "Bass Guitar", "B. Gtr.", "guitars", ["bass"], -12, [28, 67], "plucked"),
  I("ukulele", "Ukulele", "Uku.", "guitars", ["treble"], 0, [60, 88], "plucked"),
  I("banjo", "Banjo", "Bjo.", "guitars", ["treble"], 0, [50, 84], "plucked"),
  I("mandolin", "Mandolin", "Mdl.", "guitars", ["treble"], 0, [55, 88], "plucked"),

  /* ---- Strings ---------------------------------------------------------- */
  I("violin", "Violin", "Vln.", "strings", ["treble"], 0, [55, 100], "bowed"),
  I("violin-1", "Violin I", "Vln. I", "strings", ["treble"], 0, [55, 100], "bowed"),
  I("violin-2", "Violin II", "Vln. II", "strings", ["treble"], 0, [55, 96], "bowed"),
  I("viola", "Viola", "Vla.", "strings", ["alto"], 0, [48, 88], "bowed"),
  I("cello", "Violoncello", "Vc.", "strings", ["bass"], 0, [36, 81], "bowed"),
  I("double-bass", "Double Bass", "Cb.", "strings", ["bass"], -12, [28, 67], "bowed"),

  /* ---- Electronic ------------------------------------------------------- */
  I("synth-lead", "Synth Lead", "Ld.", "electronic", ["treble"], 0, [36, 96], "electronic"),
  I("synth-pad", "Synth Pad", "Pad", "electronic", ["treble", "bass"], 0, [24, 96], "electronic", { brace: true }),
  I("synth-bass", "Synth Bass", "S. Bass", "electronic", ["bass"], 0, [24, 60], "electronic"),
  I("electric-piano", "Electric Piano", "E. Pno.", "electronic", ["treble", "bass"], 0, [28, 103], "struck", { brace: true }),

  /* ---- World ------------------------------------------------------------ */
  I("sitar", "Sitar", "Sit.", "world", ["treble"], 0, [48, 84], "plucked"),
  I("koto", "Koto", "Koto", "world", ["treble"], 0, [48, 84], "plucked"),
  I("shakuhachi", "Shakuhachi", "Shak.", "world", ["treble"], 0, [62, 86], "flute"),
  I("pan-flute", "Pan Flute", "P. Fl.", "world", ["treble"], 0, [60, 91], "flute"),
  I("bagpipes", "Bagpipes", "Bagp.", "world", ["treble"], 0, [67, 79], "reed"),
  I("djembe", "Djembe", "Djm.", "world", ["percussion"], 0, [45, 45], "drum", { lines: 1 }),
  I("tabla", "Tabla", "Tbl.", "world", ["percussion"], 0, [45, 45], "drum", { lines: 2 }),
];

const BY_ID = new Map(INSTRUMENTS.map((i) => [i.id, i]));

export function instrumentById(id: string): Instrument {
  return BY_ID.get(id) ?? BY_ID.get("piano")!;
}

/** Case-insensitive search across name, short name and family. */
export function searchInstruments(query: string): Instrument[] {
  const q = query.trim().toLowerCase();
  if (!q) return INSTRUMENTS;
  return INSTRUMENTS.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.short.toLowerCase().includes(q) ||
      FAMILY_LABELS[i.family].toLowerCase().includes(q)
  );
}

export function instrumentsByFamily(): { family: Family; items: Instrument[] }[] {
  return FAMILY_ORDER.map((family) => ({
    family,
    items: INSTRUMENTS.filter((i) => i.family === family),
  })).filter((g) => g.items.length > 0);
}

/* -------------------------------------------------------------------------- */
/* Ensemble templates                                                          */
/* -------------------------------------------------------------------------- */

export interface EnsembleTemplate {
  id: string;
  name: string;
  description: string;
  /** Instrument ids in score order. */
  parts: string[];
  /** Contiguous runs that share a bracket, given as [startIndex, endIndex]. */
  groups?: { label: string; from: number; to: number }[];
}

export const ENSEMBLES: EnsembleTemplate[] = [
  {
    id: "solo",
    name: "Solo Instrument",
    description: "A single line — the quickest way to start.",
    parts: ["piano"],
  },
  {
    id: "piano",
    name: "Piano",
    description: "One grand staff, braced.",
    parts: ["piano"],
  },
  {
    id: "voice-piano",
    name: "Voice and Piano",
    description: "A song: vocal line over a grand staff.",
    parts: ["soprano", "piano"],
  },
  {
    id: "string-quartet",
    name: "String Quartet",
    description: "Two violins, viola and cello.",
    parts: ["violin-1", "violin-2", "viola", "cello"],
    groups: [{ label: "Strings", from: 0, to: 3 }],
  },
  {
    id: "piano-trio",
    name: "Piano Trio",
    description: "Violin, cello and piano.",
    parts: ["violin", "cello", "piano"],
  },
  {
    id: "string-orchestra",
    name: "String Orchestra",
    description: "The full string choir with divided violins.",
    parts: ["violin-1", "violin-2", "viola", "cello", "double-bass"],
    groups: [{ label: "Strings", from: 0, to: 4 }],
  },
  {
    id: "woodwind-quintet",
    name: "Woodwind Quintet",
    description: "Flute, oboe, clarinet, horn and bassoon.",
    parts: ["flute", "oboe", "clarinet-bb", "horn", "bassoon"],
    groups: [{ label: "Winds", from: 0, to: 4 }],
  },
  {
    id: "brass-quintet",
    name: "Brass Ensemble",
    description: "Two trumpets, horn, trombone and tuba.",
    parts: ["trumpet", "trumpet", "horn", "trombone", "tuba"],
    groups: [{ label: "Brass", from: 0, to: 4 }],
  },
  {
    id: "choir",
    name: "Choir (SATB)",
    description: "Soprano, alto, tenor and bass.",
    parts: ["soprano", "alto-voice", "tenor-voice", "bass-voice"],
    groups: [{ label: "Choir", from: 0, to: 3 }],
  },
  {
    id: "jazz-combo",
    name: "Jazz Combo",
    description: "Horn, piano, bass and drums.",
    parts: ["tenor-sax", "electric-guitar", "piano", "bass-guitar", "drum-set"],
  },
  {
    id: "concert-band",
    name: "Concert Band",
    description: "Winds, brass and percussion.",
    parts: [
      "flute", "oboe", "clarinet-bb", "bass-clarinet", "alto-sax", "tenor-sax",
      "trumpet", "horn", "trombone", "euphonium", "tuba", "timpani", "snare",
    ],
    groups: [
      { label: "Woodwinds", from: 0, to: 5 },
      { label: "Brass", from: 6, to: 10 },
      { label: "Percussion", from: 11, to: 12 },
    ],
  },
  {
    id: "orchestra",
    name: "Full Orchestra",
    description: "Winds, brass, percussion and the string choir.",
    parts: [
      "flute", "oboe", "clarinet-bb", "bassoon",
      "horn", "trumpet", "trombone", "tuba",
      "timpani",
      "violin-1", "violin-2", "viola", "cello", "double-bass",
    ],
    groups: [
      { label: "Woodwinds", from: 0, to: 3 },
      { label: "Brass", from: 4, to: 7 },
      { label: "Percussion", from: 8, to: 8 },
      { label: "Strings", from: 9, to: 13 },
    ],
  },
];

export function ensembleById(id: string): EnsembleTemplate | undefined {
  return ENSEMBLES.find((e) => e.id === id);
}
