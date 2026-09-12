/**
 * Creative Sparks — prompts you may take or ignore.
 *
 * The dungeon hands out briefs and grades what comes back. This is the
 * opposite: a spark is a suggestion with nothing attached to it. Nothing
 * checks whether you followed it, nothing is worth more for having used one,
 * and drawing one costs nothing. That is the whole point — a prompt that is
 * graded is a brief, and the app already has plenty of those.
 *
 * The sparks are deliberately constraints rather than subjects. "Write
 * something sad" is a wish; "write something using only three notes" is a
 * problem, and a problem is what gets you out of a blank page.
 */

export type SparkKind = "LIMIT" | "SHAPE" | "IMAGE" | "GAME" | "TECHNIQUE";

export interface Spark {
  id: string;
  kind: SparkKind;
  text: string;
  /** The reason it works, shown under the prompt. Never a rule. */
  why: string;
}

export const SPARK_KINDS: Record<
  SparkKind,
  { label: string; plural: string; icon: string; hex: string }
> = {
  // `label` names one card ("A limit"); `plural` counts them ("10 limits"),
  // because the two read badly in each other's sentence.
  LIMIT: { label: "A limit", plural: "limits", icon: "lock", hex: "#f292b0" },
  SHAPE: { label: "A shape", plural: "shapes", icon: "column", hex: "#8098e4" },
  IMAGE: { label: "An image", plural: "images", icon: "moon", hex: "#c28ef5" },
  GAME: { label: "A game", plural: "games", icon: "puzzle", hex: "#57d9a9" },
  TECHNIQUE: { label: "A technique", plural: "techniques", icon: "bolt", hex: "#f2d071" },
};

export const SPARKS: Spark[] = [
  // --- Limits: take something away -----------------------------------------
  { id: "three-notes", kind: "LIMIT", text: "Write a whole piece using only three pitches.", why: "With three pitches the only things left to vary are rhythm, register and silence — which is where most of the character was hiding anyway." },
  { id: "no-repeats", kind: "LIMIT", text: "Never play the same rhythm twice.", why: "Repetition is the easiest way to make music cohere. Taking it away forces you to find the harder ways." },
  { id: "one-hand", kind: "LIMIT", text: "Write something playable by one hand.", why: "Five fingers and a span of an octave is a real constraint, and real constraints produce real decisions." },
  { id: "eight-bars", kind: "LIMIT", text: "Say everything you have to say in eight bars.", why: "Most first drafts are three good bars and a lot of throat-clearing." },
  { id: "no-tonic", kind: "LIMIT", text: "Never land on the tonic until the very last note.", why: "You will discover how much of your writing was quietly steering home." },
  { id: "one-dynamic", kind: "LIMIT", text: "One dynamic marking for the whole piece. No changes.", why: "Contrast has to come from texture and register instead, which is where it is more interesting anyway." },
  { id: "no-leaps", kind: "LIMIT", text: "Stepwise motion only — no interval larger than a second.", why: "Singers have made careers out of this restriction. It is not as small as it sounds." },
  { id: "low-only", kind: "LIMIT", text: "Stay below middle C the entire time.", why: "The low register muddies fast. You will have to space the notes to hear them." },
  { id: "silence-half", kind: "LIMIT", text: "At least half the piece must be silence.", why: "Rests are not the absence of music. They are the loudest thing you can write." },
  { id: "one-chord", kind: "LIMIT", text: "One chord for the whole piece.", why: "Harmony stops being the thing that moves, so something else has to." },

  // --- Shapes: start with a form -------------------------------------------
  { id: "arch", kind: "SHAPE", text: "Build an arch: start low and quiet, peak in the middle, end where you began.", why: "The oldest shape there is, and it works because listeners feel the return before they hear it." },
  { id: "backwards", kind: "SHAPE", text: "Write the ending first, then work out what has to happen before it.", why: "Endings are the hardest part and writing forwards means arriving at them exhausted." },
  { id: "question-answer", kind: "SHAPE", text: "Every phrase is a question; the next one answers it.", why: "Antecedent and consequent is how conversation works, which is why it sounds natural." },
  { id: "shrinking", kind: "SHAPE", text: "Each section is half as long as the one before.", why: "Acceleration built into the form itself. The piece will feel like it is falling." },
  { id: "interruption", kind: "SHAPE", text: "Something interrupts at the two-thirds mark and never resolves.", why: "Unresolved material is what makes a piece feel like it was about something." },
  { id: "two-ideas", kind: "SHAPE", text: "Two ideas that never sound at the same time, until they do.", why: "The moment they combine is the piece. Everything before is setup." },
  { id: "one-long-line", kind: "SHAPE", text: "A single melodic line with no breaks — one breath from start to finish.", why: "You will find out exactly where your instincts want to stop, and have to write through them." },
  { id: "theme-hidden", kind: "SHAPE", text: "State your theme plainly only at the very end.", why: "Everything before becomes a set of variations on something the listener has not heard yet." },

  // --- Images: start with a scene ------------------------------------------
  { id: "room-above", kind: "IMAGE", text: "Someone is playing in the room above yours. Write what you can hear through the ceiling.", why: "Filtering is a real compositional choice: which parts survive a wall?" },
  { id: "machine-failing", kind: "IMAGE", text: "A machine that is running slightly wrong, and getting worse.", why: "Regularity decaying into irregularity is a structure you can actually hear." },
  { id: "empty-hall", kind: "IMAGE", text: "An enormous empty hall. One instrument. A very long reverb.", why: "Space is a compositional parameter. Write for the room, not just the player." },
  { id: "two-clocks", kind: "IMAGE", text: "Two clocks in the same room, not quite in sync.", why: "Phase is a rhythmic idea that needs almost no notes to be interesting." },
  { id: "half-remembered", kind: "IMAGE", text: "A tune someone half-remembers, with the gaps filled in wrong.", why: "Wrong is a much richer source than right." },
  { id: "underwater", kind: "IMAGE", text: "The same piece heard from underwater.", why: "Losing the top of the spectrum changes what the piece is about." },
  { id: "last-one-out", kind: "IMAGE", text: "The last person in the building, turning the lights off one by one.", why: "Subtraction as a form: something leaves in every section." },
  { id: "argument", kind: "IMAGE", text: "Two people arguing who are both right.", why: "Counterpoint with a reason: neither voice can be allowed to win." },

  // --- Games: a rule to play against ---------------------------------------
  { id: "dice", kind: "GAME", text: "Write four bars. Roll for which one to repeat, and build the piece from that.", why: "Removing a decision you were going to agonise over frees you to make the next twelve." },
  { id: "first-idea-out", kind: "GAME", text: "Write down your first idea. Then throw it away and use the second.", why: "The first idea is usually something you have heard. The second is more often yours." },
  { id: "wrong-note", kind: "GAME", text: "Put one deliberately wrong note in and make the rest of the piece justify it.", why: "This is how a lot of harmonic language got invented." },
  { id: "steal", kind: "GAME", text: "Take the rhythm of a piece you love and write an entirely new melody on it.", why: "Rhythm is not copyrightable and it is most of what makes a tune feel like itself." },
  { id: "constraint-swap", kind: "GAME", text: "Write four bars, then swap every rhythm for its opposite — long for short.", why: "Inversion of any parameter tends to produce something related but unfamiliar." },
  { id: "ten-minutes", kind: "GAME", text: "Ten minutes. Whatever exists at the end is the piece.", why: "A deadline is the only editor that works on a first draft." },
  { id: "name-first", kind: "GAME", text: "Name the piece before you write a note, then keep the promise.", why: "A title is a constraint disguised as a decoration." },
  { id: "someone-else", kind: "GAME", text: "Write it as a composer you admire would, then change one thing so it is yours.", why: "Imitation is how everyone learned. The one change is the part that matters." },

  // --- Techniques: try a tool ----------------------------------------------
  { id: "pedal", kind: "TECHNIQUE", text: "Hold one bass note under everything and let the harmony move over it.", why: "A pedal point creates tension for free and resolves it the instant you let go." },
  { id: "augment", kind: "TECHNIQUE", text: "State a theme, then state it again at half speed underneath something new.", why: "Augmentation is the cheapest way to make a piece sound like it has a structure." },
  { id: "canon-2", kind: "TECHNIQUE", text: "Write a melody that works against itself two beats later.", why: "If it does, you have a canon and it will sound far cleverer than the effort it took." },
  { id: "modal-swap", kind: "TECHNIQUE", text: "Write a phrase in a major key, then rewrite it in the parallel minor.", why: "Hearing the same line in both modes teaches more about mode than any lesson." },
  { id: "ostinato", kind: "TECHNIQUE", text: "One repeating figure, unchanged, for the entire piece. Everything else moves.", why: "The unchanging thing becomes a ruler the listener measures everything against." },
  { id: "register-jump", kind: "TECHNIQUE", text: "Move the melody up two octaves halfway through and change nothing else.", why: "Register is a dynamic. The same notes higher are a different piece." },
  { id: "chromatic-descent", kind: "TECHNIQUE", text: "A bass line that descends chromatically under a repeating melody.", why: "Four hundred years of laments say this works." },
  { id: "unison-open", kind: "TECHNIQUE", text: "Begin with every voice in unison and let them separate one at a time.", why: "The listener hears the texture being built, which makes the full texture mean something." },
  { id: "silence-open", kind: "TECHNIQUE", text: "Begin with a bar of silence.", why: "It makes the first sound an event rather than a start." },
  { id: "one-crescendo", kind: "TECHNIQUE", text: "One crescendo, across the entire piece, and nothing else.", why: "Long-range shape is hard to hear in a first draft. This makes it impossible to miss." },
];

/**
 * The spark of the day, the same for everyone on a given date.
 *
 * Deterministic from the date rather than random so it is a shared thing —
 * two composers on the same day are looking at the same prompt, which is
 * worth more than a private roll. Drawing another is always available.
 */
export function sparkOfTheDay(date = new Date()): Spark {
  const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return SPARKS[Math.abs(hash) % SPARKS.length];
}
