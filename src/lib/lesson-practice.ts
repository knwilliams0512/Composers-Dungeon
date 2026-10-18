/**
 * Which drill a lesson sends you to, and which ones it must not.
 *
 * The Academy explains, the Dungeon asks you to compose, and the Proving
 * Grounds is the only place that asks you to *recognise* anything by ear —
 * which is the skill that separates knowing what a minor sixth is from hearing
 * one. src/lib/drills.ts says so in its own first paragraph. The problem was
 * that the Proving Grounds is somewhere else entirely: a learner finishing a
 * lesson on intervals had to guess, unprompted, that one of six drills in a
 * different part of the app trained what they had just read. Almost nobody
 * does that, so lessons ended at "read this, now answer three questions about
 * whether you read it", which is a worksheet.
 *
 * So each lesson names the drill that trains it, and the lesson offers it.
 *
 * TWO RULES, both enforced by scripts/check-practice.ts:
 *
 * 1. A lesson may only offer a drill whose vocabulary it has already met.
 *    The drills do not start easy — at streak 0 INTERVAL_EAR already offers
 *    "Tritone" and "Major 7th" as choices, and SCALE_MODE asks Dorian against
 *    Phrygian. Handing that to someone four lessons into the alphabet does not
 *    make learning fun, it makes their first taste of ear training a failure.
 *    Each drill therefore has an `introducedBy` lesson, and no lesson earlier
 *    in teaching order may offer it.
 *
 * 2. Every lesson appears here. A lesson with no suitable drill says so, with
 *    a reason. Most of the orchestration, form and analysis lessons are in
 *    that group and should be: there is no ear drill for "where horns sit in a
 *    score", and pretending KEY_SIGNATURE trains it would be worse than
 *    offering nothing. An empty list is a judgement, not an omission, and the
 *    checker can tell the two apart only if the judgement is written down.
 */
import { type DrillKey } from "@/lib/drills";

/**
 * The lesson that first teaches enough for a drill to be fair.
 *
 * STAFF_READ is the exception with no gate: it asks only for letter names on
 * the staff, which is the second thing the Academy teaches.
 */
export const DRILL_INTRODUCED_BY: Record<DrillKey, string | null> = {
  STAFF_READ: "the-staff",
  INTERVAL_EAR: "basic-intervals",
  CHORD_QUALITY: "triads-major-minor",
  KEY_SIGNATURE: "circle-of-fifths",
  RHYTHM_ECHO: "note-values-and-rests",
  SCALE_MODE: "modes",
};

export interface LessonPractice {
  /** Drills this lesson sends you to, best fit first. May be empty. */
  drills: DrillKey[];
  /** Why there is nothing, when there is nothing. Required if drills is empty. */
  noDrill?: string;
}

export const LESSON_PRACTICE: Record<string, LessonPractice> = {
  /* ---- Fundamentals --------------------------------------------------- */
  "what-sound-is": {
    drills: [],
    noDrill: "Pitch, timbre and loudness as ideas. Nothing to name back yet.",
  },
  "what-are-musical-notes": {
    drills: [],
    noDrill: "The alphabet and the octave, before the staff exists to read them on.",
  },
  "keyboard-layout": {
    drills: [],
    noDrill: "Finding keys by eye. No drill tests the keyboard's geography.",
  },
  "the-staff": { drills: ["STAFF_READ"] },
  // These two come BEFORE the staff in teaching order — positions 2 and 3
  // against the staff's 4 — which is the opposite of what I assumed when first
  // writing this table. check-practice.ts caught it. A note-naming drill needs
  // the staff to read it on, and intervals are not taught until later still,
  // so there is genuinely nothing fair to offer here.
  "sharps-and-flats": {
    drills: [],
    noDrill: "Taught before the staff exists to read notes on, and before intervals.",
  },
  "whole-and-half-steps": {
    drills: [],
    noDrill: "Step size, still before the staff. INTERVAL_EAR waits for basic-intervals.",
  },
  "major-scales": { drills: ["STAFF_READ"] },
  "minor-scales": { drills: ["STAFF_READ"] },
  "basic-intervals": { drills: ["INTERVAL_EAR"] },
  // No drill tests transposition itself — it is arithmetic on the page rather
  // than a sound to recognise. Note reading is its prerequisite, though, and
  // transposing fluently means naming notes without counting up from the
  // bottom line, so the staff drill is the honest nearest thing.
  transposition: { drills: ["STAFF_READ"] },

  /* ---- Rhythm ---------------------------------------------------------- */
  "note-values-and-rests": { drills: ["RHYTHM_ECHO"] },
  "time-signatures": { drills: ["RHYTHM_ECHO"] },
  "advanced-rhythm-texture": { drills: ["RHYTHM_ECHO"] },

  /* ---- Harmony --------------------------------------------------------- */
  "triads-major-minor": { drills: ["CHORD_QUALITY"] },
  "diatonic-harmony": { drills: ["CHORD_QUALITY"] },
  "basic-progressions": { drills: ["CHORD_QUALITY"] },
  "cadences-and-accompaniment": { drills: ["CHORD_QUALITY"] },
  "circle-of-fifths": { drills: ["KEY_SIGNATURE"] },
  "chord-functions-inversions": { drills: ["CHORD_QUALITY"] },
  "seventh-chords": { drills: ["CHORD_QUALITY"] },
  // Voice leading is about the distance between two lines and how it changes.
  // Hearing a fifth as a fifth is what makes a parallel one audible rather
  // than merely a rule you were told.
  "voice-leading": { drills: ["INTERVAL_EAR"] },
  modes: { drills: ["SCALE_MODE"] },
  "modulation-secondary-dominants": { drills: ["KEY_SIGNATURE", "CHORD_QUALITY"] },
  "modulation-techniques": { drills: ["KEY_SIGNATURE"] },
  "borrowed-chords": { drills: ["CHORD_QUALITY"] },
  "extended-altered-chords": { drills: ["CHORD_QUALITY"] },
  "chromatic-harmony-modal-writing": { drills: ["SCALE_MODE", "CHORD_QUALITY"] },
  "jazz-harmony": { drills: ["CHORD_QUALITY"] },

  /* ---- Melody ---------------------------------------------------------- */
  // A craft lesson, so outside the roadmap's order. Melodic writing lives on
  // steps against leaps, which is the interval drill's subject exactly.
  "melody-writing": { drills: ["INTERVAL_EAR"] },
  "phrases-question-answer": {
    drills: [],
    noDrill: "Phrase shape is judged over a whole phrase; no drill asks a question that size.",
  },
  "motifs-repetition-variation": {
    drills: [],
    noDrill: "Recognising a motif's transformations needs the piece it came from.",
  },
  // Passing tones, neighbours and appoggiaturas are defined by whether they
  // arrive by step or by leap — an interval judgement every time.
  "non-chord-tones": { drills: ["INTERVAL_EAR"] },

  /* ---- Counterpoint ---------------------------------------------------- */
  // First species is nothing but a chain of intervals judged by ear, so this
  // is the rare case where the drill is the lesson's actual subject.
  "counterpoint-species": { drills: ["INTERVAL_EAR"] },
  "fugue-large-form": {
    drills: [],
    noDrill: "Subject, answer and stretto are heard across a whole exposition.",
  },

  /* ---- Form ------------------------------------------------------------ */
  "binary-ternary-form": {
    drills: [],
    noDrill: "Form is a shape in time. A one-question drill cannot pose it.",
  },
  "large-form-architecture": {
    drills: [],
    noDrill: "Proportion over ten minutes. There is nothing to name in two seconds.",
  },

  /* ---- Orchestration --------------------------------------------------- */
  "countermelody-orchestration-basics": {
    drills: [],
    noDrill: "Ranges and families are reference knowledge, not an ear skill.",
  },
  "full-score-layout": {
    drills: [],
    noDrill: "Score order is a convention to read, not a sound to recognise.",
  },
  "transposing-instruments": {
    drills: [],
    noDrill: "Transposition is arithmetic on the page; no drill covers it yet.",
  },
  "string-section-writing": {
    drills: [],
    noDrill: "Divisi, double stops and harmonics need the instrument in the room.",
  },
  "extended-techniques": {
    drills: [],
    noDrill: "These are colours to hear once, not categories to name at speed.",
  },
  "orchestral-balance-colour": {
    drills: [],
    noDrill: "Balance is judged on a full texture, which no drill can pose.",
  },

  /* ---- Virtuoso -------------------------------------------------------- */
  "virtuoso-writing": {
    drills: [],
    noDrill: "Idiomatic difficulty is a judgement about a passage, not a label.",
  },
  // Nothing drills set theory or a tone row. The mode drill at least keeps the
  // ear working on collections rather than keys, which is the habit this
  // lesson needs most.
  "post-tonal-theory": { drills: ["SCALE_MODE"] },
  "advanced-analysis": {
    drills: [],
    noDrill: "Schenker and Neo-Riemannian analysis apply to whole pieces.",
  },
  "ear-training-fluency": {
    // The one lesson that is explicitly about this, so it offers everything.
    drills: ["INTERVAL_EAR", "CHORD_QUALITY", "SCALE_MODE", "KEY_SIGNATURE", "STAFF_READ", "RHYTHM_ECHO"],
  },
};

/** The drills a lesson offers, or an empty list. */
export function practiceFor(slug: string): DrillKey[] {
  return LESSON_PRACTICE[slug]?.drills ?? [];
}
