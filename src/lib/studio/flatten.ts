/**
 * Turning a full score into something the grading engine can read.
 *
 * The dungeon's checks were written for a single line with a harmony lane
 * beneath it, which is what the piano-roll composer produces. A score written
 * in the Studio is twenty staves of transposing instruments, and none of the
 * checks know what to do with that.
 *
 * So a submitted score is flattened first: every audible part is brought to
 * sounding pitch, stacked into one list of notes, and the harmony is read back
 * out of the vertical sonorities bar by bar. What the checks then see is what
 * a listener hears — the top note of each onset as the melodic line, and one
 * chord per bar underneath it.
 */

import {
  keyPitchClass,
  romanNumeral,
  scaleSteps,
  triadFor,
  ticksPerBar,
  type ChordQuality,
  type Score,
  type ScoreChord,
  type ScoreMeter,
  type ScoreNote,
} from "@/lib/score";
import { instrumentById } from "@/lib/studio/instruments";
import { audibleParts, type StudioScore } from "@/lib/studio/model";

/** Every note in the score at sounding pitch, sorted by onset. */
export function soundingNotes(studio: StudioScore): ScoreNote[] {
  const out: ScoreNote[] = [];
  for (const part of audibleParts(studio)) {
    // A part may override the catalogue, which is how "Horn in E♭" is written.
    const shift = part.transpose ?? instrumentById(part.instrumentId).transpose;
    for (const staff of part.staves) {
      for (const voice of staff.voices) {
        for (const note of voice.notes) {
          out.push({
            start: note.start,
            duration: note.duration,
            pitch: note.pitch + shift,
          });
        }
      }
    }
  }
  return out.sort((a, b) => a.start - b.start || a.pitch - b.pitch);
}

/**
 * The diatonic triad that best explains what sounds in a span.
 *
 * Scored by how much of the music sits on chord tones, weighted by how long
 * each note lasts — a passing note on the way through should not outvote the
 * chord everything else is built on. Returns null when a bar is empty or too
 * thin to call, which "every bar is harmonised" then reports honestly.
 */
function inferChord(
  notes: ScoreNote[],
  key: string,
  mode: "major" | "minor"
): { degree: number; quality: ChordQuality } | null {
  if (notes.length === 0) return null;

  let best: { degree: number; quality: ChordQuality; score: number } | null = null;
  for (let degree = 1; degree <= 7; degree++) {
    const triad = triadFor(degree, key, mode);
    const tones = triad.pitches.map((p) => ((p % 12) + 12) % 12);
    let weight = 0;
    for (const n of notes) {
      const pc = ((n.pitch % 12) + 12) % 12;
      if (!tones.includes(pc)) continue;
      // The root carries the most evidence, then the fifth, then the third.
      const rank = pc === tones[0] ? 1.5 : pc === tones[2] ? 1.15 : 1;
      weight += n.duration * rank;
    }
    if (!best || weight > best.score) {
      best = { degree, quality: triad.quality, score: weight };
    }
  }
  if (!best || best.score === 0) return null;
  return { degree: best.degree, quality: best.quality };
}

/**
 * Flatten a Studio score into the shape the checks understand.
 *
 * `bars` and `meter` come from the brief rather than the score, so a trial
 * that asked for sixteen bars is measured against sixteen bars even if the
 * writer added more.
 */
export function flattenStudioScore(
  studio: StudioScore,
  brief: { key: string; mode: "major" | "minor"; meter: ScoreMeter; bars: number; tempo?: number; instrument?: string }
): Score {
  const melody = soundingNotes(studio);
  const barTicks = ticksPerBar(brief.meter);

  const chords: ScoreChord[] = [];
  for (let b = 0; b < brief.bars; b++) {
    const from = b * barTicks;
    const to = from + barTicks;
    const inBar = melody.filter((n) => n.start < to && n.start + n.duration > from);
    const found = inferChord(inBar, brief.key, brief.mode);
    if (!found) continue;
    chords.push({
      start: from,
      duration: barTicks,
      degree: found.degree,
      quality: found.quality,
    });
  }

  return {
    version: 1,
    key: brief.key,
    mode: brief.mode,
    meter: brief.meter,
    bars: brief.bars,
    tempo: brief.tempo ?? studio.tempo,
    instrument: brief.instrument ?? "PIANO",
    melody,
    chords,
  };
}

/** A plain-language reading of the harmony, for the feedback panel. */
export function describeHarmony(score: Score): string {
  if (score.chords.length === 0) return "No harmony could be read from the score.";
  return score.chords
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((c) => romanNumeral(c.degree, c.quality))
    .join(" – ");
}

/** How many distinct sounding parts the score actually uses. */
export function voiceCount(studio: StudioScore): number {
  return audibleParts(studio).filter((p) =>
    p.staves.some((s) => s.voices.some((v) => v.notes.length > 0))
  ).length;
}

/** Exported so a checker can exercise the inference directly. */
export const __test = { inferChord, scaleSteps, keyPitchClass };
