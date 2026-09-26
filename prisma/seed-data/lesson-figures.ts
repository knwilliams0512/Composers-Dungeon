import type { LessonFigure } from "@/lib/lesson-figure";

/**
 * What each lesson looks like on a page.
 *
 * Kept out of the lesson files for the same reason lesson-detail.ts is: a
 * lesson is prose and should read as prose, and a hundred and thirty figures
 * threaded through it would bury the writing. Keyed by slug, then by the
 * heading of the section the figure belongs under, so a figure follows its
 * paragraph even when sections are reordered.
 *
 * Pitches are MIDI numbers — 60 is middle C — and durations are ticks, where 4
 * is a quarter note. scripts/check-figures.ts derives the intervals, chords
 * and scale patterns here from first principles and refuses anything that does
 * not agree with what the lesson claims.
 */

/** Middle C and the octave above, for reference while reading this file. */
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71;
const C5 = 72, D5 = 74, E5 = 76, F5 = 77, G5 = 79, A5 = 81, B5 = 83, C6 = 84;
const A3 = 57, B3 = 59, G3 = 55, F3 = 53, E3 = 52, D3 = 50, C3 = 48;

const Q = 4; // quarter note
const H = 8; // half
const W = 16; // whole
const E = 2; // eighth

export const lessonFigures: Record<string, Record<string, LessonFigure>> = {
  /* ---- Level 1: absolute foundations ----------------------------------- */

  "what-are-musical-notes": {
    "Sound Becomes Music": {
      kind: "keyboard",
      caption: "One key, one pitch",
      from: C4,
      to: C5,
      marks: [{ pitch: C4, label: "C", tone: "root" }],
    },
    "Naming the Notes": {
      kind: "staff",
      caption: "The musical alphabet, written down",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: C4, label: "C", accent: true },
        { pitch: D4, label: "D" },
        { pitch: E4, label: "E" },
        { pitch: F4, label: "F" },
        { pitch: G4, label: "G" },
        { pitch: A4, label: "A" },
        { pitch: B4, label: "B" },
        { pitch: C5, label: "C", accent: true },
      ],
      brackets: [{ from: 0, to: 7, text: "and then it starts again" }],
    },
    "Why Only Seven?": {
      kind: "keyboard",
      caption: "The same letter, an octave apart",
      from: C4,
      to: C6,
      marks: [
        { pitch: C4, label: "C", tone: "root" },
        { pitch: C5, label: "C", tone: "target" },
        { pitch: C6, label: "C", tone: "target" },
      ],
      brackets: [{ from: C4, to: C5, text: "one octave" }],
    },
  },

  "keyboard-layout": {
    "White Keys, Black Keys": {
      kind: "keyboard",
      caption: "Two blacks, then three — the landmark that never moves",
      from: C4,
      to: C5,
      marks: [
        { pitch: 61, tone: "step" },
        { pitch: 63, tone: "step" },
        { pitch: 66, tone: "target" },
        { pitch: 68, tone: "target" },
        { pitch: 70, tone: "target" },
      ],
      brackets: [
        { from: 61, to: 63, text: "two" },
        { from: 66, to: 70, text: "three" },
      ],
      silent: true,
    },
    "Finding C": {
      kind: "keyboard",
      caption: "C sits left of the two; F sits left of the three",
      from: C4,
      to: C6,
      marks: [
        { pitch: C4, label: "C", tone: "root" },
        { pitch: F4, label: "F", tone: "target" },
        { pitch: C5, label: "C", tone: "root" },
        { pitch: F5, label: "F", tone: "target" },
      ],
      silent: true,
    },
  },

  "sharps-and-flats": {
    "Between the Letters": {
      kind: "keyboard",
      caption: "The black key between C and D",
      from: C4,
      to: C5,
      marks: [
        { pitch: C4, label: "C", tone: "root" },
        { pitch: 61, label: "C♯", tone: "step" },
        { pitch: D4, label: "D", tone: "root" },
      ],
      brackets: [{ from: C4, to: D4, text: "a whole step, with a key in between" }],
    },
    "Two Names, One Key": {
      kind: "staff",
      caption: "One sound, two spellings",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: 66, spell: 1, duration: H, label: "F♯", accent: true },
        { pitch: 66, spell: -1, duration: H, label: "G♭", accent: true },
      ],
      brackets: [{ from: 0, to: 1, text: "the same key on the piano" }],
    },
  },

  "whole-and-half-steps": {
    "The Atoms of Melody": {
      kind: "keyboard",
      caption: "E to F has nothing in between — that is a half step",
      from: C4,
      to: C5,
      marks: [
        { pitch: C4, label: "C", tone: "root" },
        { pitch: D4, label: "D", tone: "root" },
        { pitch: E4, label: "E", tone: "target" },
        { pitch: F4, label: "F", tone: "target" },
      ],
      brackets: [
        { from: C4, to: D4, text: "whole" },
        { from: E4, to: F4, text: "half" },
      ],
      silent: true,
    },
    "Hearing the Difference": {
      kind: "staff",
      caption: "A whole step, then a half step",
      hideMeter: true,
      notes: [
        { pitch: C4, duration: H, label: "C" },
        { pitch: D4, duration: H, label: "D" },
        { pitch: E4, duration: H, label: "E", accent: true },
        { pitch: F4, duration: H, label: "F", accent: true },
      ],
      brackets: [
        { from: 0, to: 1, text: "whole step" },
        { from: 2, to: 3, text: "half step" },
      ],
    },
  },

  "note-values-and-rests": {
    "Time Made Visible": {
      kind: "rhythm",
      caption: "Each value is half the one before it",
      meter: { beats: 4, unit: 4 },
      row: [
        { duration: H, label: "half" },
        { duration: Q, label: "quarter" },
        { duration: E, label: "eighth" },
        { duration: E, label: "eighth" },
      ],
    },
    "Silence Is Music Too": {
      kind: "rhythm",
      caption: "A rest is a beat you are still counting",
      meter: { beats: 4, unit: 4 },
      row: [
        { duration: Q, label: "play" },
        { duration: Q, rest: true, label: "rest" },
        { duration: Q, label: "play" },
        { duration: Q, rest: true, label: "rest" },
      ],
    },
  },

  "time-signatures": {
    "The Grid of Time": {
      kind: "rhythm",
      caption: "3/4 — three beats, and the first one is the strong one",
      meter: { beats: 3, unit: 4 },
      row: [
        { duration: Q, label: "strong", accent: true },
        { duration: Q, label: "weak" },
        { duration: Q, label: "weak" },
      ],
    },
    "Feel, Not Just Math": {
      kind: "rhythm",
      caption: "6/8 counts six but is felt in two",
      meter: { beats: 6, unit: 8 },
      row: [
        { duration: E, accent: true, label: "ONE" },
        { duration: E },
        { duration: E },
        { duration: E, accent: true, label: "TWO" },
        { duration: E },
        { duration: E },
      ],
    },
  },

  "major-scales": {
    "One Pattern, Every Key": {
      kind: "staff",
      caption: "Whole, whole, half, whole, whole, whole, half",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: C4, label: "W" },
        { pitch: D4, label: "W" },
        { pitch: E4, label: "H", accent: true },
        { pitch: F4, label: "W" },
        { pitch: G4, label: "W" },
        { pitch: A4, label: "W" },
        { pitch: B4, label: "H", accent: true },
        { pitch: C5 },
      ],
    },
    "Scale Degrees": {
      kind: "staff",
      caption: "Every degree has a job",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: C4, label: "1", accent: true },
        { pitch: D4, label: "2" },
        { pitch: E4, label: "3" },
        { pitch: F4, label: "4" },
        { pitch: G4, label: "5", accent: true },
        { pitch: A4, label: "6" },
        { pitch: B4, label: "7" },
        { pitch: C5, label: "8", accent: true },
      ],
      brackets: [{ from: 6, to: 7, text: "the leading tone pulls home" }],
    },
  },

  "minor-scales": {
    "The Minor Pattern": {
      kind: "staff",
      caption: "A natural minor: the half step arrives two notes earlier",
      key: "A",
      mode: "minor",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: A3, label: "W" },
        { pitch: B3, label: "H", accent: true },
        { pitch: C4, label: "W" },
        { pitch: D4, label: "W" },
        { pitch: E4, label: "H", accent: true },
        { pitch: F4, label: "W" },
        { pitch: G4, label: "W" },
        { pitch: A4 },
      ],
    },
    "Relative Keys": {
      kind: "circle",
      caption: "A minor sits inside C major — same notes, different home",
      highlight: ["C", "a"],
    },
  },

  "basic-intervals": {
    "Distance Has a Name": {
      kind: "staff",
      caption: "A third, a fifth, an octave — measured from the same C",
      hideMeter: true,
      notes: [
        { pitch: C4, duration: H },
        { pitch: E4, duration: H, stack: true, label: "3rd", accent: true },
        { pitch: C4, duration: H },
        { pitch: G4, duration: H, stack: true, label: "5th", accent: true },
        { pitch: C4, duration: H },
        { pitch: C5, duration: H, stack: true, label: "8ve", accent: true },
      ],
    },
    "Consonance and Tension": {
      kind: "staff",
      caption: "A fifth settles; a tritone will not",
      hideMeter: true,
      notes: [
        { pitch: C4, duration: H },
        { pitch: G4, duration: H, stack: true, label: "fifth" },
        { pitch: C4, duration: H },
        { pitch: 66, spell: 1, duration: H, stack: true, label: "tritone", accent: true },
      ],
    },
  },

  "triads-major-minor": {
    "Three Notes, One Sound": {
      kind: "staff",
      caption: "Major and minor differ by one note",
      hideMeter: true,
      notes: [
        { pitch: C4, duration: H },
        { pitch: E4, duration: H, stack: true, accent: true },
        { pitch: G4, duration: H, stack: true },
        { pitch: A3, duration: H },
        { pitch: C4, duration: H, stack: true, accent: true },
        { pitch: E4, duration: H, stack: true },
      ],
      harmony: [
        { at: 0, text: "C major" },
        { at: 3, text: "A minor" },
      ],
    },
    "Chords in a Key": {
      kind: "staff",
      caption: "Every degree of C major, stacked in thirds",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: C4, duration: H }, { pitch: E4, duration: H, stack: true }, { pitch: G4, duration: H, stack: true },
        { pitch: D4, duration: H }, { pitch: F4, duration: H, stack: true }, { pitch: A4, duration: H, stack: true },
        { pitch: E4, duration: H }, { pitch: G4, duration: H, stack: true }, { pitch: B4, duration: H, stack: true },
        { pitch: F4, duration: H }, { pitch: A4, duration: H, stack: true }, { pitch: C5, duration: H, stack: true },
        { pitch: G4, duration: H }, { pitch: B4, duration: H, stack: true }, { pitch: D5, duration: H, stack: true },
        { pitch: A4, duration: H }, { pitch: C5, duration: H, stack: true }, { pitch: E5, duration: H, stack: true },
        { pitch: B4, duration: H }, { pitch: D5, duration: H, stack: true }, { pitch: F5, duration: H, stack: true },
      ],
      harmony: [
        { at: 0, text: "I" }, { at: 3, text: "ii" }, { at: 6, text: "iii" },
        { at: 9, text: "IV" }, { at: 12, text: "V" }, { at: 15, text: "vi" },
        { at: 18, text: "vii°" },
      ],
    },
  },

  "basic-progressions": {
    "The Three Pillars": {
      kind: "staff",
      caption: "I – IV – V – I: home, away, tension, home",
      notes: [
        { pitch: C4, duration: W }, { pitch: E4, duration: W, stack: true }, { pitch: G4, duration: W, stack: true },
        { pitch: F3, duration: W }, { pitch: A3, duration: W, stack: true }, { pitch: C4, duration: W, stack: true },
        { pitch: G3, duration: W }, { pitch: B3, duration: W, stack: true }, { pitch: D4, duration: W, stack: true },
        { pitch: C4, duration: W }, { pitch: E4, duration: W, stack: true }, { pitch: G4, duration: W, stack: true },
      ],
      harmony: [
        { at: 0, text: "I" }, { at: 3, text: "IV" }, { at: 6, text: "V" }, { at: 9, text: "I" },
      ],
    },
    "Adding vi": {
      kind: "staff",
      caption: "I – V – vi – IV: the turn to vi is the surprise",
      notes: [
        { pitch: C4, duration: W }, { pitch: E4, duration: W, stack: true }, { pitch: G4, duration: W, stack: true },
        { pitch: G3, duration: W }, { pitch: B3, duration: W, stack: true }, { pitch: D4, duration: W, stack: true },
        { pitch: A3, duration: W }, { pitch: C4, duration: W, stack: true }, { pitch: E4, duration: W, stack: true },
        { pitch: F3, duration: W }, { pitch: A3, duration: W, stack: true }, { pitch: C4, duration: W, stack: true },
      ],
      harmony: [
        { at: 0, text: "I" }, { at: 3, text: "V" }, { at: 6, text: "vi" }, { at: 9, text: "IV" },
      ],
    },
  },

  "melody-writing": {
    "Contour Is Character": {
      kind: "staff",
      caption: "An arch: rise to one high point, then come down",
      notes: [
        { pitch: C4 }, { pitch: E4 }, { pitch: G4 }, { pitch: A4 },
        { pitch: C5, duration: H, accent: true }, { pitch: A4, duration: H },
        { pitch: G4 }, { pitch: E4 }, { pitch: D4 }, { pitch: C4 },
      ],
      brackets: [{ from: 4, to: 4, text: "the peak, used once" }],
    },
    "Steps, Leaps, and Balance": {
      kind: "staff",
      caption: "A leap, then steps back into the gap it left",
      notes: [
        { pitch: C4, duration: H },
        { pitch: A4, duration: H, accent: true },
        { pitch: G4 }, { pitch: F4 }, { pitch: E4 }, { pitch: D4 },
        { pitch: C4, duration: H },
      ],
      brackets: [
        { from: 0, to: 1, text: "a sixth up" },
        { from: 2, to: 6, text: "stepwise recovery" },
      ],
    },
  },

  "phrases-question-answer": {
    "Music Speaks in Sentences": {
      kind: "staff",
      caption: "The first phrase stops on V; the second finishes on I",
      notes: [
        { pitch: C4 }, { pitch: D4 }, { pitch: E4 }, { pitch: G4 },
        { pitch: A4, duration: H }, { pitch: G4, duration: H, accent: true },
        { pitch: A4 }, { pitch: G4 }, { pitch: F4 }, { pitch: E4 },
        { pitch: D4, duration: H }, { pitch: C4, duration: H, accent: true },
      ],
      brackets: [
        { from: 0, to: 5, text: "question" },
        { from: 6, to: 11, text: "answer" },
      ],
    },
    "The Period": {
      kind: "form",
      caption: "Eight bars, in two halves that need each other",
      sections: [
        { label: "Antecedent", bars: 4, tone: "a", note: "ends open, on V" },
        { label: "Consequent", bars: 4, tone: "b", note: "same opening, closes on I" },
      ],
    },
  },

  "motifs-repetition-variation": {
    "The Seed": {
      kind: "staff",
      caption: "Four notes worth keeping",
      key: "C",
      mode: "minor",
      meter: { beats: 2, unit: 4 },
      notes: [
        { pitch: 0, duration: E, rest: true },
        { pitch: G4, duration: E, accent: true },
        { pitch: G4, duration: E, accent: true },
        { pitch: G4, duration: E, accent: true },
        { pitch: 63, spell: -1, duration: H, accent: true },
      ],
    },
    "Repeat, Then Change": {
      kind: "staff",
      caption: "The same shape, one step lower",
      key: "C",
      mode: "minor",
      meter: { beats: 2, unit: 4 },
      notes: [
        { pitch: 0, duration: E, rest: true },
        { pitch: G4, duration: E }, { pitch: G4, duration: E }, { pitch: G4, duration: E },
        { pitch: 63, spell: -1, duration: H },
        { pitch: 0, duration: E, rest: true },
        { pitch: F4, duration: E, accent: true }, { pitch: F4, duration: E, accent: true },
        { pitch: F4, duration: E, accent: true }, { pitch: D4, duration: H, accent: true },
      ],
      brackets: [
        { from: 1, to: 4, text: "the motif" },
        { from: 6, to: 9, text: "a step down" },
      ],
    },
  },

  "cadences-and-accompaniment": {
    "Punctuation Marks": {
      kind: "staff",
      caption: "Authentic, then plagal — a full stop and a softer one",
      notes: [
        { pitch: G3, duration: W }, { pitch: B3, duration: W, stack: true }, { pitch: D4, duration: W, stack: true },
        { pitch: C4, duration: W }, { pitch: E4, duration: W, stack: true }, { pitch: G4, duration: W, stack: true },
        { pitch: F3, duration: W }, { pitch: A3, duration: W, stack: true }, { pitch: C4, duration: W, stack: true },
        { pitch: C4, duration: W }, { pitch: E4, duration: W, stack: true }, { pitch: G4, duration: W, stack: true },
      ],
      harmony: [
        { at: 0, text: "V" }, { at: 3, text: "I" }, { at: 6, text: "IV" }, { at: 9, text: "I" },
      ],
      brackets: [
        { from: 0, to: 3, text: "authentic" },
        { from: 6, to: 9, text: "plagal" },
      ],
    },
    "Beneath the Melody": {
      kind: "staff",
      caption: "A tune over held chords: the harmony changes once a bar",
      notes: [
        { pitch: E4 }, { pitch: G4 }, { pitch: C5, duration: H },
        { pitch: D5 }, { pitch: C5 }, { pitch: B4, duration: H },
        // The bass is its own voice: one chord a bar, under whatever the tune
        // is doing, so it is placed by tick rather than by what came before.
        { pitch: C4, duration: W, at: 0 },
        { pitch: G3, duration: W, at: 16 },
      ],
      harmony: [
        { at: 6, text: "C" },
        { at: 7, text: "G" },
      ],
    },
  },

  /* ---- Level 4: advanced harmony and form ------------------------------ */

  "circle-of-fifths": {
    "The Wheel of Keys": {
      kind: "circle",
      caption: "Each step clockwise adds a sharp; each step back adds a flat",
      highlight: ["C"],
    },
    "A Composer's Compass": {
      kind: "circle",
      caption: "Neighbours on the circle share six of their seven notes",
      highlight: ["C", "G"],
      arrow: { from: "C", to: "G", text: "one sharp away" },
    },
  },

  "chord-functions-inversions": {
    "Three Jobs": {
      kind: "staff",
      caption: "Home, away, and the chord that has to resolve",
      notes: [
        { pitch: C4, duration: W }, { pitch: E4, duration: W, stack: true }, { pitch: G4, duration: W, stack: true },
        { pitch: F3, duration: W }, { pitch: A3, duration: W, stack: true }, { pitch: C4, duration: W, stack: true },
        { pitch: G3, duration: W }, { pitch: B3, duration: W, stack: true }, { pitch: D4, duration: W, stack: true },
      ],
      harmony: [{ at: 0, text: "I" }, { at: 3, text: "IV" }, { at: 6, text: "V" }],
      brackets: [
        { from: 0, to: 2, text: "tonic" },
        { from: 3, to: 5, text: "subdominant" },
        { from: 6, to: 8, text: "dominant" },
      ],
    },
    Inversions: {
      kind: "staff",
      caption: "The same three notes; a different one at the bottom",
      hideMeter: true,
      notes: [
        { pitch: C4, duration: H }, { pitch: E4, duration: H, stack: true }, { pitch: G4, duration: H, stack: true },
        { pitch: E4, duration: H }, { pitch: G4, duration: H, stack: true }, { pitch: C5, duration: H, stack: true },
        { pitch: G4, duration: H }, { pitch: C5, duration: H, stack: true }, { pitch: E5, duration: H, stack: true },
      ],
      harmony: [
        { at: 0, text: "I" },
        { at: 3, text: "I6" },
        { at: 6, text: "I64" },
      ],
    },
  },

  "modulation-secondary-dominants": {
    "The Pivot": {
      kind: "staff",
      caption: "A minor is vi at home and ii in the new key — so it belongs to both",
      notes: [
        { pitch: C4, duration: W }, { pitch: E4, duration: W, stack: true }, { pitch: G4, duration: W, stack: true },
        { pitch: A3, duration: W }, { pitch: C4, duration: W, stack: true }, { pitch: E4, duration: W, stack: true },
        { pitch: D4, duration: W }, { pitch: 66, spell: 1, duration: W, stack: true }, { pitch: A4, duration: W, stack: true },
        { pitch: G3, duration: W }, { pitch: B3, duration: W, stack: true }, { pitch: D4, duration: W, stack: true },
      ],
      harmony: [{ at: 0, text: "I" }, { at: 3, text: "vi" }],
      brackets: [
        { from: 3, to: 5, text: "the pivot" },
        { from: 6, to: 11, text: "now in G" },
      ],
    },
    "Secondary Dominants": {
      kind: "staff",
      caption: "D major is not in C — it is the dominant of the dominant",
      notes: [
        { pitch: D4, duration: W }, { pitch: 66, spell: 1, duration: W, stack: true },
        { pitch: A4, duration: W, stack: true }, { pitch: C5, duration: W, stack: true },
        { pitch: G3, duration: W }, { pitch: B3, duration: W, stack: true }, { pitch: D4, duration: W, stack: true },
        { pitch: C4, duration: W }, { pitch: E4, duration: W, stack: true }, { pitch: G4, duration: W, stack: true },
      ],
      brackets: [{ from: 0, to: 3, text: "V7 of V" }],
      harmony: [{ at: 4, text: "V" }, { at: 7, text: "I" }],
    },
  },

  "binary-ternary-form": {
    "Two Rooms, Three Rooms": {
      kind: "form",
      caption: "Ternary: leave home, and come back to it changed by the journey",
      sections: [
        { label: "A", bars: 16, tone: "a", note: "the tune, in the home key" },
        { label: "B", bars: 16, tone: "b", note: "new material, often a new key" },
        { label: "A", bars: 16, tone: "a", note: "the same tune, now familiar" },
      ],
    },
    "Theme and Variations": {
      kind: "form",
      caption: "One idea, looked at five ways",
      sections: [
        { label: "Theme", bars: 16, tone: "a" },
        { label: "Var I", bars: 16, tone: "b", note: "faster notes" },
        { label: "Var II", bars: 16, tone: "b", note: "minor" },
        { label: "Var III", bars: 16, tone: "b", note: "new metre" },
        { label: "Var IV", bars: 24, tone: "c", note: "the big one" },
      ],
    },
  },

  "countermelody-orchestration-basics": {
    "The Second Voice": {
      kind: "staff",
      caption: "Two lines moving apart — neither is accompaniment",
      notes: [
        { pitch: G4 }, { pitch: A4 }, { pitch: B4 }, { pitch: C5 },
        { pitch: D5, duration: H }, { pitch: B4, duration: H },
        { pitch: E4, at: 0 }, { pitch: D4, at: 4 }, { pitch: C4, at: 8 }, { pitch: B3, at: 12 },
        { pitch: G3, duration: H, at: 16 }, { pitch: G3, duration: H, at: 24 },
      ],
      brackets: [{ from: 0, to: 5, text: "melody above, countermelody below" }],
    },
    "Know Your Instruments": {
      kind: "scoreOrder",
      caption: "The string family, highest to lowest",
      groups: [
        { name: "Strings", staves: ["Violin I", "Violin II", "Viola", "Cello", "Double Bass"] },
      ],
      highlight: [2],
    },
  },

  "chromatic-harmony-modal-writing": {
    "Borrowing from the Shadow Key": {
      kind: "staff",
      caption: "A flat major in the middle of C major — taken from C minor",
      notes: [
        { pitch: C4, duration: W }, { pitch: E4, duration: W, stack: true }, { pitch: G4, duration: W, stack: true },
        { pitch: 68, spell: -1, duration: W }, { pitch: C5, duration: W, stack: true },
        { pitch: 75, spell: -1, duration: W, stack: true },
        { pitch: G3, duration: W }, { pitch: B3, duration: W, stack: true }, { pitch: D4, duration: W, stack: true },
      ],
      harmony: [{ at: 0, text: "I" }, { at: 6, text: "V" }],
      brackets: [{ from: 3, to: 5, text: "♭VI, borrowed" }],
    },
    "The Modes as Palettes": {
      kind: "staff",
      caption: "D Dorian: the white notes, but the sixth is the reason it is not minor",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: D4, label: "1" }, { pitch: E4, label: "2" }, { pitch: F4, label: "♭3" },
        { pitch: G4, label: "4" }, { pitch: A4, label: "5" },
        { pitch: B4, label: "6", accent: true }, { pitch: C5, label: "♭7" }, { pitch: D5, label: "8" },
      ],
      brackets: [{ from: 5, to: 5, text: "the raised sixth" }],
    },
  },

  "counterpoint-species": {
    "First Species: Note Against Note": {
      kind: "staff",
      caption: "One note against one, and every interval consonant",
      hideMeter: true,
      notes: [
        { pitch: C5, duration: W }, { pitch: B4, duration: W }, { pitch: C5, duration: W },
        { pitch: E5, duration: W }, { pitch: D5, duration: W }, { pitch: C5, duration: W },
        { pitch: C4, duration: W, at: 0 }, { pitch: G3, duration: W, at: 16 },
        { pitch: A3, duration: W, at: 32 }, { pitch: C4, duration: W, at: 48 },
        { pitch: G3, duration: W, at: 64 }, { pitch: C4, duration: W, at: 80 },
      ],
      brackets: [{ from: 0, to: 5, text: "contrary motion, consonance throughout" }],
    },
    "Second and Fourth Species": {
      kind: "staff",
      caption: "Two against one: the second note of each pair may pass through",
      hideMeter: true,
      notes: [
        { pitch: C5, duration: H }, { pitch: D5, duration: H, accent: true },
        { pitch: E5, duration: H }, { pitch: D5, duration: H, accent: true },
        { pitch: C5, duration: H }, { pitch: B4, duration: H, accent: true },
        { pitch: C5, duration: H }, { pitch: C5, duration: H },
        { pitch: C4, duration: W, at: 0 }, { pitch: A3, duration: W, at: 16 },
        { pitch: G3, duration: W, at: 32 }, { pitch: C4, duration: W, at: 48 },
      ],
      brackets: [{ from: 1, to: 1, text: "passing" }],
    },
  },

  "advanced-rhythm-texture": {
    "Irregular Meters": {
      kind: "rhythm",
      caption: "7/8 counted 3 + 2 + 2 — the limp is the point",
      meter: { beats: 7, unit: 8 },
      row: [
        { duration: E, accent: true, label: "1" }, { duration: E }, { duration: E },
        { duration: E, accent: true, label: "2" }, { duration: E },
        { duration: E, accent: true, label: "3" }, { duration: E },
      ],
    },
    "Polyrhythm and Texture": {
      kind: "rhythm",
      caption: "3 + 3 + 2: eight eighths, grouped against the four-beat bar",
      meter: { beats: 4, unit: 4 },
      row: [
        { duration: E * 3, accent: true, label: "3" },
        { duration: E * 3, accent: true, label: "3" },
        { duration: E * 2, accent: true, label: "2" },
      ],
    },
  },

  "fugue-large-form": {
    "The Fugue Machine": {
      kind: "staff",
      caption: "Subject, then the answer a fifth higher",
      key: "C",
      mode: "minor",
      notes: [
        { pitch: C4, duration: H }, { pitch: G4, duration: H }, { pitch: 68, spell: -1, duration: H },
        { pitch: G4, duration: H }, { pitch: F4, duration: Q }, { pitch: 63, spell: -1, duration: Q },
        { pitch: D4, duration: Q }, { pitch: C4, duration: Q },
        { pitch: G4, duration: H, accent: true }, { pitch: D5, duration: H, accent: true },
        { pitch: 75, spell: -1, duration: H, accent: true }, { pitch: D5, duration: H, accent: true },
        { pitch: C5, duration: Q, accent: true }, { pitch: 70, spell: -1, duration: Q, accent: true },
        { pitch: A4, duration: Q, accent: true }, { pitch: G4, duration: Q, accent: true },
      ],
      brackets: [
        { from: 0, to: 7, text: "subject" },
        { from: 8, to: 15, text: "answer, a fifth up" },
      ],
    },
    "Sonata Thinking": {
      kind: "form",
      caption: "Two keys argued out, then reconciled in one",
      sections: [
        { label: "Exposition", bars: 60, tone: "a", note: "first subject at home, second away" },
        { label: "Development", bars: 50, tone: "b", note: "neither key is safe" },
        { label: "Recapitulation", bars: 60, tone: "a", note: "both subjects, both at home" },
        { label: "Coda", bars: 20, tone: "coda" },
      ],
    },
  },

  "virtuoso-writing": {
    "Four Kinds of Difficulty": {
      kind: "staff",
      caption: "Fast is only one of them — this is difficult because it never rests",
      notes: [
        { pitch: C5, duration: E }, { pitch: B4, duration: E }, { pitch: A4, duration: E },
        { pitch: G4, duration: E }, { pitch: F4, duration: E }, { pitch: E4, duration: E },
        { pitch: D4, duration: E }, { pitch: C4, duration: E },
        { pitch: D4, duration: E }, { pitch: E4, duration: E }, { pitch: F4, duration: E },
        { pitch: G4, duration: E }, { pitch: A4, duration: E }, { pitch: B4, duration: E },
        { pitch: C5, duration: E }, { pitch: D5, duration: E },
      ],
    },
    "The Craft of Playable Fire": {
      kind: "keyboard",
      caption: "A tenth is a stretch; a twelfth is a different hand",
      from: C4,
      to: C6,
      marks: [
        { pitch: C4, label: "thumb", tone: "root" },
        { pitch: E5, label: "5th finger", tone: "target" },
        { pitch: G5, label: "no", tone: "muted" },
      ],
      brackets: [
        { from: C4, to: E5, text: "a tenth — reachable" },
        { from: C4, to: G5, text: "a twelfth — not" },
      ],
      silent: true,
    },
    "Difficulty With Purpose": {
      kind: "staff",
      caption: "The same harmony, written so it can be played and still sound huge",
      notes: [
        { pitch: C4, duration: E }, { pitch: G4, duration: E }, { pitch: C5, duration: E },
        { pitch: E5, duration: E }, { pitch: G5, duration: E }, { pitch: E5, duration: E },
        { pitch: C5, duration: E }, { pitch: G4, duration: E },
      ],
      brackets: [{ from: 0, to: 7, text: "one C major chord, spread across the hand" }],
    },
  },

  /* ---- Levels 2, 3 and 5: the roadmap lessons --------------------------- */

  "what-sound-is": {
    "Pitch is frequency": {
      kind: "staff",
      caption: "Low to high is slow to fast — the same fact, written down",
      hideMeter: true,
      hideBarlines: true,
      clef: "bass",
      notes: [
        { pitch: C3, duration: H, label: "131 Hz" },
        { pitch: C4, duration: H, label: "262 Hz" },
      ],
      brackets: [{ from: 0, to: 1, text: "twice the frequency" }],
    },
    "An octave is a doubling": {
      kind: "keyboard",
      caption: "Every C doubles the one below it",
      from: C3,
      to: C6,
      marks: [
        { pitch: C3, label: "131", tone: "root" },
        { pitch: C4, label: "262", tone: "target" },
        { pitch: C5, label: "523", tone: "target" },
        { pitch: C6, label: "1047", tone: "target" },
      ],
    },
    "Dynamics are loudness, written down": {
      kind: "rhythm",
      caption: "The same four notes, getting louder",
      meter: { beats: 4, unit: 4 },
      row: [
        { duration: Q, label: "pp" },
        { duration: Q, label: "mp" },
        { duration: Q, label: "f" },
        { duration: Q, label: "ff", accent: true },
      ],
    },
  },

  "the-staff": {
    "Five lines and four spaces": {
      kind: "staff",
      caption: "Every line and every space is a letter",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: E4, label: "E" }, { pitch: F4, label: "F" }, { pitch: G4, label: "G" },
        { pitch: A4, label: "A" }, { pitch: B4, label: "B" }, { pitch: C5, label: "C" },
        { pitch: D5, label: "D" }, { pitch: E5, label: "E" }, { pitch: F5, label: "F" },
      ],
      brackets: [{ from: 0, to: 8, text: "bottom line to top line" }],
    },
    "Treble and bass": {
      kind: "staff",
      caption: "The same C, written in the bass clef",
      clef: "bass",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: G3, label: "G" }, { pitch: B3, label: "B" }, { pitch: D4, label: "D" },
        { pitch: F3, label: "F" }, { pitch: A3, label: "A" },
        { pitch: C4, label: "middle C", accent: true },
      ],
    },
    "Ledger lines": {
      kind: "staff",
      caption: "Middle C lives on its own short line below the treble staff",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: C4, label: "C", accent: true },
        { pitch: A3, label: "A", accent: true },
        { pitch: E4, label: "E" },
        { pitch: A5, label: "A", accent: true },
        { pitch: C6, label: "C", accent: true },
      ],
    },
  },

  "diatonic-harmony": {
    "Build a triad on every degree": {
      kind: "staff",
      caption: "Stack thirds on each degree and the qualities fall out by themselves",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: C4, duration: H }, { pitch: E4, duration: H, stack: true }, { pitch: G4, duration: H, stack: true },
        { pitch: D4, duration: H }, { pitch: F4, duration: H, stack: true }, { pitch: A4, duration: H, stack: true },
        { pitch: E4, duration: H }, { pitch: G4, duration: H, stack: true }, { pitch: B4, duration: H, stack: true },
        { pitch: F4, duration: H }, { pitch: A4, duration: H, stack: true }, { pitch: C5, duration: H, stack: true },
      ],
      harmony: [
        { at: 0, text: "I" }, { at: 3, text: "ii" }, { at: 6, text: "iii" }, { at: 9, text: "IV" },
      ],
    },
    "Minor keys have their own pattern": {
      kind: "staff",
      caption: "A minor: the same stacking, a different set of qualities",
      key: "A",
      mode: "minor",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: A3, duration: H }, { pitch: C4, duration: H, stack: true }, { pitch: E4, duration: H, stack: true },
        { pitch: B3, duration: H }, { pitch: D4, duration: H, stack: true }, { pitch: F4, duration: H, stack: true },
        { pitch: C4, duration: H }, { pitch: E4, duration: H, stack: true }, { pitch: G4, duration: H, stack: true },
        { pitch: D4, duration: H }, { pitch: F4, duration: H, stack: true }, { pitch: A4, duration: H, stack: true },
      ],
      harmony: [
        { at: 0, text: "i" }, { at: 3, text: "ii" }, { at: 6, text: "III" }, { at: 9, text: "iv" },
      ],
    },
  },

  "seventh-chords": {
    "One more third on top": {
      kind: "staff",
      caption: "A triad, then the same chord with a seventh added",
      hideMeter: true,
      notes: [
        { pitch: G3, duration: H }, { pitch: B3, duration: H, stack: true }, { pitch: D4, duration: H, stack: true },
        { pitch: G3, duration: H }, { pitch: B3, duration: H, stack: true }, { pitch: D4, duration: H, stack: true },
        { pitch: F4, duration: H, stack: true, accent: true },
      ],
      brackets: [{ from: 6, to: 6, text: "the seventh" }],
    },
    "The dominant seventh does the work": {
      kind: "staff",
      caption: "The tritone inside G7 contracts onto the tonic",
      hideMeter: true,
      notes: [
        { pitch: G3, duration: H }, { pitch: B3, duration: H, stack: true, accent: true },
        { pitch: D4, duration: H, stack: true }, { pitch: F4, duration: H, stack: true, accent: true },
        { pitch: C4, duration: H },
        { pitch: E4, duration: H, stack: true, accent: true },
        { pitch: G4, duration: H, stack: true },
      ],
      brackets: [{ from: 1, to: 3, text: "tritone" }],
    },
  },

  "voice-leading": {
    "Four singers, not four chords": {
      kind: "staff",
      caption: "Each voice moves as little as it can",
      hideMeter: true,
      notes: [
        { pitch: G4, duration: W }, { pitch: E4, duration: W, stack: true }, { pitch: C4, duration: W, stack: true },
        { pitch: G4, duration: W }, { pitch: F4, duration: W, stack: true }, { pitch: B3, duration: W, stack: true },
        { pitch: G4, duration: W }, { pitch: E4, duration: W, stack: true }, { pitch: C4, duration: W, stack: true },
      ],
      brackets: [{ from: 0, to: 8, text: "the top voice never moves" }],
    },
    "Why parallels weaken the texture": {
      kind: "staff",
      caption: "Two voices a fifth apart, moving together — they stop sounding like two",
      hideMeter: true,
      silent: true,
      notes: [
        { pitch: C4, duration: H }, { pitch: G4, duration: H, stack: true, accent: true },
        { pitch: D4, duration: H }, { pitch: A4, duration: H, stack: true, accent: true },
        { pitch: E4, duration: H }, { pitch: B4, duration: H, stack: true, accent: true },
      ],
      brackets: [{ from: 0, to: 5, text: "parallel fifths — avoid" }],
    },
  },

  "non-chord-tones": {
    "The catalogue": {
      kind: "staff",
      caption: "A passing tone fills the gap between two chord tones",
      hideMeter: true,
      notes: [
        { pitch: C5, duration: Q }, { pitch: B4, duration: Q, accent: true }, { pitch: A4, duration: H },
        { pitch: C4, duration: W, at: 0 },
      ],
      brackets: [{ from: 1, to: 1, text: "passing" }],
    },
    "Suspensions are worth a lesson of their own": {
      kind: "staff",
      caption: "Prepare, suspend, resolve — the note arrives late on purpose",
      hideMeter: true,
      notes: [
        { pitch: C5, duration: H, label: "prepare" },
        { pitch: C5, duration: H, label: "suspend", accent: true },
        { pitch: B4, duration: H, label: "resolve", accent: true },
        { pitch: F3, duration: W, at: 0 },
        { pitch: G3, duration: W, at: 16 },
      ],
    },
  },

  modes: {
    "Learn each by its one odd note": {
      kind: "staff",
      caption: "Mixolydian is major with a flat seventh — that one note is the mode",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: G4, label: "1" }, { pitch: A4, label: "2" }, { pitch: B4, label: "3" },
        { pitch: C5, label: "4" }, { pitch: D5, label: "5" }, { pitch: E5, label: "6" },
        { pitch: F5, label: "♭7", accent: true }, { pitch: G5, label: "8" },
      ],
      brackets: [{ from: 6, to: 6, text: "F natural, not F sharp" }],
    },
    "Making a mode actually sound modal": {
      kind: "staff",
      caption: "Lean on the odd note and refuse the leading tone",
      hideMeter: true,
      notes: [
        { pitch: G4, duration: Q }, { pitch: F5, duration: H, accent: true }, { pitch: E5, duration: Q },
        { pitch: D5, duration: Q }, { pitch: F5, duration: Q, accent: true }, { pitch: G5, duration: H },
      ],
    },
  },

  transposition: {
    "Shift everything by the same interval": {
      kind: "staff",
      caption: "The same tune, a fourth higher — every interval kept",
      hideMeter: true,
      notes: [
        { pitch: C4 }, { pitch: E4 }, { pitch: G4 }, { pitch: E4 },
        { pitch: F4, accent: true }, { pitch: A4, accent: true },
        { pitch: C5, accent: true }, { pitch: A4, accent: true },
      ],
      brackets: [
        { from: 0, to: 3, text: "in C" },
        { from: 4, to: 7, text: "in F" },
      ],
    },
    "Transposing instruments": {
      kind: "staff",
      caption: "A clarinet in B♭ reads D and the room hears C",
      hideMeter: true,
      notes: [
        { pitch: D4, duration: H, label: "written", accent: true },
        { pitch: C4, duration: H, label: "sounding" },
      ],
      brackets: [{ from: 0, to: 1, text: "a whole step down" }],
    },
  },

  "modulation-techniques": {
    "Pivot chord: the smooth one": {
      kind: "circle",
      caption: "The easiest modulations are one step around the circle",
      highlight: ["C", "G", "F"],
      arrow: { from: "C", to: "G", text: "up a fifth" },
    },
    "Where you go matters": {
      kind: "circle",
      caption: "Far around the circle is a different country",
      highlight: ["C", "E"],
      arrow: { from: "C", to: "E", text: "four sharps away" },
    },
  },

  "borrowed-chords": {
    "The useful ones in a major key": {
      kind: "staff",
      caption: "iv in a major key: the third is flattened, and everything darkens",
      hideMeter: true,
      notes: [
        { pitch: F3, duration: H }, { pitch: A3, duration: H, stack: true }, { pitch: C4, duration: H, stack: true },
        { pitch: F3, duration: H }, { pitch: 68, spell: -1, duration: H, stack: true, accent: true },
        { pitch: C4, duration: H, stack: true },
      ],
      brackets: [
        { from: 0, to: 2, text: "IV" },
        { from: 3, to: 5, text: "iv, borrowed" },
      ],
    },
  },

  "extended-altered-chords": {
    "Keep stacking thirds": {
      kind: "staff",
      caption: "Seventh, ninth, eleventh, thirteenth — the stack just keeps going",
      hideMeter: true,
      notes: [
        { pitch: G3, duration: W }, { pitch: B3, duration: W, stack: true },
        { pitch: D4, duration: W, stack: true }, { pitch: F4, duration: W, stack: true, label: "7" },
        { pitch: A4, duration: W, stack: true, label: "9", accent: true },
        { pitch: C5, duration: W, stack: true, label: "11", accent: true },
        { pitch: E5, duration: W, stack: true, label: "13", accent: true },
      ],
    },
  },

  "jazz-harmony": {
    "ii–V–I is the sentence": {
      kind: "staff",
      caption: "Dm7 – G7 – Cmaj7: the bass falls a fifth each time",
      notes: [
        { pitch: D4, duration: W }, { pitch: F4, duration: W, stack: true },
        { pitch: A4, duration: W, stack: true }, { pitch: C5, duration: W, stack: true },
        { pitch: G3, duration: W }, { pitch: B3, duration: W, stack: true },
        { pitch: D4, duration: W, stack: true }, { pitch: F4, duration: W, stack: true },
        { pitch: C4, duration: W }, { pitch: E4, duration: W, stack: true },
        { pitch: G4, duration: W, stack: true }, { pitch: B4, duration: W, stack: true },
      ],
      brackets: [
        { from: 0, to: 3, text: "ii7" },
        { from: 4, to: 7, text: "V7" },
        { from: 8, to: 11, text: "Imaj7" },
      ],
    },
    "Quartal voicings": {
      kind: "staff",
      caption: "Stacked fourths: no third, so no major or minor",
      hideMeter: true,
      notes: [
        { pitch: D4, duration: W }, { pitch: G4, duration: W, stack: true },
        { pitch: C5, duration: W, stack: true }, { pitch: F5, duration: W, stack: true },
      ],
      brackets: [{ from: 0, to: 3, text: "three fourths, stacked" }],
    },
  },

  "post-tonal-theory": {
    "Twelve-tone and total serialism": {
      kind: "staff",
      caption: "A row: all twelve, none repeated until the row is done",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: C4, duration: Q }, { pitch: 61, spell: 1, duration: Q }, { pitch: 64, duration: Q },
        { pitch: 66, spell: 1, duration: Q }, { pitch: 65, duration: Q }, { pitch: 67, duration: Q },
        { pitch: 70, spell: -1, duration: Q }, { pitch: 69, duration: Q }, { pitch: 71, duration: Q },
        { pitch: 75, spell: -1, duration: Q }, { pitch: 74, duration: Q }, { pitch: 80, spell: -1, duration: Q },
      ],
      brackets: [{ from: 0, to: 11, text: "all twelve pitch classes" }],
    },
  },

  "advanced-analysis": {
    "Schenker: the piece under the piece": {
      kind: "staff",
      caption: "Underneath the surface, a descent to the tonic",
      hideMeter: true,
      notes: [
        { pitch: E5, duration: H, label: "3", accent: true },
        { pitch: D5, duration: H, label: "2", accent: true },
        { pitch: C5, duration: H, label: "1", accent: true },
        { pitch: C4, duration: H, at: 0 },
        { pitch: G3, duration: H, at: 8 },
        { pitch: C4, duration: H, at: 16 },
      ],
      brackets: [{ from: 0, to: 2, text: "the fundamental line" }],
    },
  },

  "ear-training-fluency": {
    "Solfège gives degrees a name you can sing": {
      kind: "staff",
      caption: "The syllable names the degree, in any key",
      hideMeter: true,
      hideBarlines: true,
      notes: [
        { pitch: C4, label: "do" }, { pitch: D4, label: "re" }, { pitch: E4, label: "mi" },
        { pitch: F4, label: "fa" }, { pitch: G4, label: "sol" }, { pitch: A4, label: "la" },
        { pitch: B4, label: "ti" }, { pitch: C5, label: "do" },
      ],
    },
    "Dictation is the test": {
      kind: "staff",
      caption: "Four bars to hear, hold, and write down",
      notes: [
        { pitch: G4, duration: Q }, { pitch: E4, duration: Q }, { pitch: F4, duration: H },
        { pitch: A4, duration: Q }, { pitch: G4, duration: Q }, { pitch: E4, duration: H },
        { pitch: D4, duration: Q }, { pitch: F4, duration: Q }, { pitch: E4, duration: H },
        { pitch: D4, duration: H }, { pitch: C4, duration: H },
      ],
    },
  },

  /* ---- Level 6: the full score ----------------------------------------- */

  "full-score-layout": {
    "The Order Is Not Negotiable": {
      kind: "scoreOrder",
      caption: "Top to bottom, on every orchestral score ever printed",
      groups: [
        { name: "Woodwind", staves: ["Piccolo", "Flutes", "Oboes", "Clarinets", "Bassoons"] },
        { name: "Brass", staves: ["Horns", "Trumpets", "Trombones", "Tuba"] },
        { name: "Percussion", staves: ["Timpani", "Percussion"] },
        { name: "Keyboard & Harp", staves: ["Harp"] },
        { name: "Strings", staves: ["Violin I", "Violin II", "Viola", "Cello", "Double Bass"] },
      ],
    },
    "What Goes Above and Below": {
      kind: "scoreOrder",
      caption: "Soloists and voices sit between the harp and the strings",
      groups: [
        { name: "Brass", staves: ["Horns", "Trumpets"] },
        { name: "Soloist", staves: ["Solo Violin"] },
        { name: "Chorus", staves: ["Soprano", "Alto", "Tenor", "Bass"] },
        { name: "Strings", staves: ["Violin I", "Violin II", "Viola", "Cello", "Double Bass"] },
      ],
      highlight: [2, 3, 4, 5, 6],
    },
  },

  "transposing-instruments": {
    "Why Anyone Would Do This": {
      kind: "staff",
      caption: "One fingering, two instruments: written C sounds B♭ on a B♭ clarinet",
      hideMeter: true,
      notes: [
        { pitch: C5, duration: H, label: "written", accent: true },
        { pitch: 70, spell: -1, duration: H, label: "sounds" },
      ],
      brackets: [{ from: 0, to: 1, text: "down a major second" }],
    },
    "The Ones You Will Actually Write For": {
      kind: "staff",
      caption: "Horn in F: written a perfect fifth above what the room hears",
      hideMeter: true,
      notes: [
        { pitch: G4, duration: H, label: "written", accent: true },
        { pitch: C4, duration: H, label: "sounds" },
      ],
      brackets: [{ from: 0, to: 1, text: "down a perfect fifth" }],
    },
    "Octaves Count Too": {
      kind: "staff",
      caption: "A double bass sounds an octave below the note on the page",
      clef: "bass",
      hideMeter: true,
      notes: [
        { pitch: C3, duration: H, label: "written", accent: true },
        { pitch: 36, duration: H, label: "sounds" },
      ],
      brackets: [{ from: 0, to: 1, text: "down an octave" }],
    },
    "Key Signatures and Accidentals": {
      kind: "circle",
      caption: "Concert C major is D major for the clarinet — two sharps to read",
      highlight: ["C", "D"],
      arrow: { from: "C", to: "D", text: "what the player sees" },
    },
  },

  "string-section-writing": {
    "Divisi Is Not a Double Stop": {
      kind: "staff",
      caption: "Two notes one player must reach, against two notes split between desks",
      hideMeter: true,
      notes: [
        { pitch: D4, duration: H }, { pitch: A4, duration: H, stack: true },
        { pitch: E4, duration: H }, { pitch: C5, duration: H, stack: true },
      ],
      brackets: [
        { from: 0, to: 1, text: "double stop: one player, one bow" },
        { from: 2, to: 3, text: "divisi: half the desks each" },
      ],
    },
    "What a Hand Can Reach": {
      kind: "keyboard",
      caption: "A tenth on the piano; on a violin, an octave is already a stretch",
      from: C4,
      to: C6,
      marks: [
        { pitch: C4, tone: "root", label: "1" },
        { pitch: C5, tone: "target", label: "8ve" },
        { pitch: E5, tone: "muted", label: "10th" },
      ],
      brackets: [{ from: C4, to: C5, text: "comfortable" }],
      silent: true,
    },
    Harmonics: {
      kind: "staff",
      caption: "Touch the string at the halfway point and it sounds an octave up",
      hideMeter: true,
      notes: [
        { pitch: G3, duration: H, label: "stopped" },
        { pitch: D4, duration: H, label: "touched", accent: true },
        { pitch: D5, duration: H, label: "sounds", accent: true },
      ],
      brackets: [{ from: 1, to: 2, text: "an octave above the touch" }],
    },
  },

  "extended-techniques": {
    "Strings, Beyond the Bow": {
      kind: "rhythm",
      caption: "Col legno: struck with the wood, so it is rhythm before it is pitch",
      meter: { beats: 4, unit: 4 },
      row: [
        { duration: E, accent: true }, { duration: E },
        { duration: E, accent: true }, { duration: E },
        { duration: E, accent: true }, { duration: E },
        { duration: E, accent: true }, { duration: E },
      ],
    },
    "Notate It So It Can Be Played": {
      kind: "staff",
      caption: "Say which string, where on it, and how — a symbol alone is a guess",
      hideMeter: true,
      notes: [
        { pitch: A4, duration: H, label: "sul pont." },
        { pitch: B4, duration: H, label: "ord." },
        { pitch: C5, duration: H, label: "sul tasto" },
      ],
    },
  },

  "orchestral-balance-colour": {
    "The Pyramid": {
      kind: "form",
      caption: "Weight at the bottom, air at the top — not the other way up",
      sections: [
        { label: "Piccolo / Trumpet", bars: 1, tone: "c", note: "one is plenty" },
        { label: "Oboes / Horns", bars: 2, tone: "b", note: "the middle needs more" },
        { label: "Cellos / Basses / Bassoons", bars: 4, tone: "a", note: "the foundation carries the rest" },
      ],
    },
    "Doubling Changes Colour, Not Just Volume": {
      kind: "staff",
      caption: "The same line, an octave apart: flute above, clarinet below",
      hideMeter: true,
      notes: [
        { pitch: C5, duration: Q }, { pitch: D5, duration: Q }, { pitch: E5, duration: H },
        { pitch: C4, duration: Q, at: 0 }, { pitch: D4, duration: Q, at: 4 },
        { pitch: E4, duration: H, at: 8 },
      ],
      brackets: [{ from: 0, to: 2, text: "one melody, two colours" }],
    },
    "Texture as Structure": {
      kind: "form",
      caption: "Save the full orchestra for the one place it means something",
      sections: [
        { label: "Strings alone", bars: 3, tone: "a" },
        { label: "+ Woodwind", bars: 3, tone: "b" },
        { label: "Tutti", bars: 2, tone: "c", note: "the arrival" },
        { label: "Strings alone", bars: 3, tone: "a" },
      ],
    },
  },

  "large-form-architecture": {
    "Long Music Needs a Different Kind of Plan": {
      kind: "form",
      caption: "Twenty minutes, planned as shape before a note is written",
      sections: [
        { label: "I. Allegro", bars: 8, tone: "a", note: "sonata, the argument" },
        { label: "II. Adagio", bars: 6, tone: "b", note: "the slow heart" },
        { label: "III. Scherzo", bars: 4, tone: "c", note: "relief" },
        { label: "IV. Finale", bars: 9, tone: "a", note: "everything answered" },
      ],
    },
    "Thematic Transformation": {
      kind: "staff",
      caption: "One theme, three characters: plain, slowed, and in the minor",
      hideMeter: true,
      notes: [
        { pitch: C4, duration: Q }, { pitch: E4, duration: Q }, { pitch: G4, duration: H },
        { pitch: C4, duration: H }, { pitch: E4, duration: H }, { pitch: G4, duration: W },
        { pitch: C4, duration: Q, accent: true }, { pitch: 63, spell: -1, duration: Q, accent: true },
        { pitch: G4, duration: H, accent: true },
      ],
      brackets: [
        { from: 0, to: 2, text: "as written" },
        { from: 3, to: 5, text: "augmented" },
        { from: 6, to: 8, text: "in the minor" },
      ],
    },
    "Pacing and Proportion": {
      kind: "form",
      caption: "The climax late, and only once",
      sections: [
        { label: "Build", bars: 10, tone: "a" },
        { label: "Hold back", bars: 4, tone: "intro", note: "the drop before it" },
        { label: "Climax", bars: 2, tone: "c", note: "here, at about two thirds" },
        { label: "Descent", bars: 6, tone: "b" },
      ],
    },
  },
};
