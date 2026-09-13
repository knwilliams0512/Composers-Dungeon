/**
 * The music-theory roadmap: five levels, absolute beginner to virtuoso.
 *
 * The Academy used to be a flat list of twenty-five lessons ordered by
 * difficulty. That tells a learner what comes next but never what they are in
 * the middle of, or how far the whole thing goes — and "difficulty 6" is not a
 * destination anyone recognises. This is the map: named levels, numbered
 * units, each unit owning exactly one lesson.
 *
 * The numbering is the contract. A unit's number is stable, so "I'm on 3.4" is
 * a thing a person can say and come back to. Lessons can be rewritten, split
 * or retitled underneath a unit without the map changing shape.
 */

export interface CurriculumUnit {
  /** Stable identifier shown to the learner, e.g. "2.3". */
  unit: string;
  title: string;
  /** What this unit is actually about, in one line. */
  blurb: string;
  /**
   * The lessons that teach it, in order. Usually one; sometimes a unit of the
   * roadmap is three of the Academy's lessons put together, and forcing a
   * one-to-one map would have meant either orphaning two of them or pretending
   * a forty-minute unit was a single sitting.
   */
  slugs: string[];
}

export interface CurriculumLevel {
  level: number;
  name: string;
  /** The promise of the level — what you can do once it is behind you. */
  summary: string;
  icon: string;
  accent: string;
  units: CurriculumUnit[];
}

export const CURRICULUM: CurriculumLevel[] = [
  {
    level: 1,
    name: "Absolute Foundations",
    summary:
      "Sound, notation, rhythm and your first scales. Nothing here assumes you have read music before.",
    icon: "book",
    accent: "#8fbcff",
    units: [
      { unit: "1.1", title: "What Sound Is", blurb: "Pitch, octaves, timbre and dynamics — what the words point at before any notation.", slugs: ["what-sound-is"] },
      { unit: "1.2", title: "The Musical Alphabet", blurb: "A–G, sharps and flats, half and whole steps, and why C♯ and D♭ are the same key.", slugs: ["what-are-musical-notes", "sharps-and-flats", "whole-and-half-steps"] },
      { unit: "1.3", title: "The Staff", blurb: "Five lines, two clefs, the grand staff, and reading ledger lines without counting.", slugs: ["the-staff", "keyboard-layout"] },
      { unit: "1.4", title: "Rhythm Basics", blurb: "Note values, rests, time signatures, ties and dots, and what a tempo marking asks for.", slugs: ["note-values-and-rests", "time-signatures"] },
      { unit: "1.5", title: "Your First Scale: Major", blurb: "The W-W-H-W-W-W-H pattern, and the name and job of each scale degree.", slugs: ["major-scales"] },
      { unit: "1.6", title: "Key Signatures & the Circle of Fifths", blurb: "Why sharps and flats arrive in a fixed order, and how every key relates to its neighbours.", slugs: ["circle-of-fifths"] },
      { unit: "1.7", title: "Minor Scales", blurb: "Natural, harmonic and melodic minor — three answers to the same problem with the seventh.", slugs: ["minor-scales"] },
    ],
  },
  {
    level: 2,
    name: "Intervals & Chords",
    summary:
      "The distance between two notes, and what happens when you stack them. Everything harmonic starts here.",
    icon: "chord",
    accent: "#f292b0",
    units: [
      { unit: "2.1", title: "Intervals", blurb: "Quality and number, consonance and dissonance, and recognising them by ear.", slugs: ["basic-intervals"] },
      { unit: "2.2", title: "Triads", blurb: "Major, minor, diminished and augmented — four ways to stack two thirds.", slugs: ["triads-major-minor"] },
      { unit: "2.3", title: "Diatonic Harmony", blurb: "The chords a key gives you for free, and the roman numerals that name them.", slugs: ["diatonic-harmony"] },
      { unit: "2.4", title: "Chord Inversions", blurb: "Putting a different chord tone in the bass, and what it does to a bassline.", slugs: ["chord-functions-inversions"] },
      { unit: "2.5", title: "Seventh Chords", blurb: "The fourth note: major 7th, dominant 7th, minor 7th, half- and fully-diminished.", slugs: ["seventh-chords"] },
    ],
  },
  {
    level: 3,
    name: "How Music Moves",
    summary:
      "Functional harmony: why one chord wants to go to another, and how to write the lines that carry it.",
    icon: "arch",
    accent: "#a3b4ff",
    units: [
      { unit: "3.1", title: "Cadences", blurb: "Authentic, plagal, half and deceptive — the punctuation marks of tonal music.", slugs: ["cadences-and-accompaniment"] },
      { unit: "3.2", title: "Voice Leading", blurb: "Moving four parts smoothly, resolving tendency tones, and the rules worth knowing before breaking.", slugs: ["voice-leading"] },
      { unit: "3.3", title: "Chord Progressions & Function", blurb: "Tonic, predominant, dominant — the three jobs every chord in a key is doing.", slugs: ["basic-progressions"] },
      { unit: "3.4", title: "Non-Chord Tones", blurb: "Passing tones, neighbours, suspensions, appoggiaturas — the notes that make a line sing.", slugs: ["non-chord-tones"] },
      { unit: "3.5", title: "Modes", blurb: "The major scale started from each of its degrees, and the distinct colour each rotation has.", slugs: ["modes"] },
      { unit: "3.6", title: "Transposition", blurb: "Moving a piece to another key, and why the trumpet part is not in the key you think.", slugs: ["transposition"] },
    ],
  },
  {
    level: 4,
    name: "Advanced Harmony & Form",
    summary:
      "Chromaticism with a reason, modulation that convinces, and the architectures that hold long pieces together.",
    icon: "column",
    accent: "#c28ef5",
    units: [
      { unit: "4.1", title: "Secondary Dominants", blurb: "Borrowing a dominant to make some other chord feel like home for a moment.", slugs: ["modulation-secondary-dominants"] },
      { unit: "4.2", title: "Modulation", blurb: "Pivot, direct, sequential and chromatic-mediant — four ways to change key.", slugs: ["modulation-techniques"] },
      { unit: "4.3", title: "Borrowed Chords", blurb: "Modal mixture: taking chords from the parallel mode for colour without leaving the key.", slugs: ["borrowed-chords"] },
      { unit: "4.4", title: "Chromatic Harmony", blurb: "The Neapolitan, augmented sixths, and common-tone diminished sevenths.", slugs: ["chromatic-harmony-modal-writing"] },
      { unit: "4.5", title: "Extended & Altered Chords", blurb: "Ninths, elevenths, thirteenths, altered tensions, sus and slash chords.", slugs: ["extended-altered-chords"] },
      { unit: "4.6", title: "Musical Form", blurb: "Binary, ternary, variations, rondo, sonata, strophic, twelve-bar blues, verse-chorus.", slugs: ["binary-ternary-form"] },
      { unit: "4.7", title: "Counterpoint", blurb: "Species counterpoint, imitation, fugue, and lines that work either way up.", slugs: ["counterpoint-species", "fugue-large-form"] },
    ],
  },
  {
    level: 5,
    name: "Virtuoso & Professional",
    summary:
      "Jazz harmony, post-tonal systems, advanced rhythm, analysis, orchestration, and the ear that ties it together.",
    icon: "bolt",
    accent: "#f2cf68",
    units: [
      { unit: "5.1", title: "Jazz Harmony", blurb: "ii–V–I, tritone substitution, modal jazz, reharmonisation and quartal voicings.", slugs: ["jazz-harmony"] },
      { unit: "5.2", title: "20th & 21st-Century Theory", blurb: "Atonality, set theory, twelve-tone method, minimalism, spectralism, chance.", slugs: ["post-tonal-theory"] },
      { unit: "5.3", title: "Advanced Rhythm", blurb: "Polyrhythm, polymeter, metric modulation, additive rhythm and hemiola.", slugs: ["advanced-rhythm-texture"] },
      { unit: "5.4", title: "Advanced Analysis", blurb: "Schenkerian layers, Neo-Riemannian transformations, and modern theories of form.", slugs: ["advanced-analysis"] },
      { unit: "5.5", title: "Orchestration & Arranging", blurb: "Ranges, transpositions, voicing and spacing, blend and contrast, texture types.", slugs: ["countermelody-orchestration-basics"] },
      { unit: "5.6", title: "Ear Training & Fluency", blurb: "Solfège, dictation, improvisation and reading a full score without an instrument.", slugs: ["ear-training-fluency"] },
    ],
  },
];

/**
 * Lessons that teach how to write rather than how music works.
 *
 * The roadmap above is music theory, and melody writing, phrasing and motivic
 * development are craft — you can know every unit of Level 4 and still not
 * know how to start a tune. They sit alongside the roadmap rather than inside
 * it, because pretending they are a numbered theory unit would misdescribe
 * both.
 */
export const CRAFT_SLUGS = [
  "melody-writing",
  "phrases-question-answer",
  "motifs-repetition-variation",
  "virtuoso-writing",
] as const;

/** Every unit, flattened, in teaching order. */
export const ALL_UNITS: (CurriculumUnit & { level: number })[] = CURRICULUM.flatMap((l) =>
  l.units.map((u) => ({ ...u, level: l.level }))
);

/** Where a lesson sits in the roadmap, or null if it is craft rather than theory. */
export function unitForSlug(slug: string): (CurriculumUnit & { level: number }) | null {
  return ALL_UNITS.find((u) => u.slugs.includes(slug)) ?? null;
}

/** Every lesson slug the roadmap expects to exist. */
export function curriculumSlugs(): string[] {
  return ALL_UNITS.flatMap((u) => u.slugs);
}

/** The level a unit number belongs to, e.g. "3.4" -> 3. */
export function levelOfUnit(unit: string): number {
  return Number(unit.split(".")[0]) || 1;
}
