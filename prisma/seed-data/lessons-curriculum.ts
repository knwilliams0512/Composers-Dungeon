/**
 * The lessons the roadmap needs that the Academy did not have.
 *
 * Written to fill named gaps in src/lib/curriculum.ts rather than invented for
 * their own sake: each one is a unit of the five-level map that previously had
 * no lesson behind it. `order` is deliberately not meaningful here — the
 * seeder assigns every lesson's order from its position in the roadmap, so the
 * Academy always lists in teaching order no matter what these files say.
 */

import type { SeedLesson } from "./types";

export const curriculumLessons: SeedLesson[] = [
  // ---------------------------------------------------------------- 1.1 ----
  {
    slug: "what-sound-is",
    title: "What Sound Is",
    description: "Pitch, octaves, timbre and dynamics — the words, and what they actually point at.",
    category: "FUNDAMENTALS",
    difficulty: 1,
    tierRequirement: "NO_EXPERIENCE",
    order: 0,
    xpReward: 50,
    content: [
      {
        heading: "Pitch is frequency",
        body:
          "A sound is air vibrating. How fast it vibrates is its frequency, measured in hertz — vibrations per second — and how fast it vibrates is what you hear as high or low. That is all pitch is. The note orchestras tune to, A above middle C, vibrates 440 times a second, which is why you will see it written A4 = 440 Hz.\n\nNothing about 440 is natural law. It is an agreement, and a fairly recent one: orchestras have tuned anywhere from 415 to 450 over the last few centuries, and some period ensembles still tune low on purpose.",
        callout: {
          kind: "note",
          text: "If you have ever heard an orchestra tune, that is the oboe playing A4 and everyone else matching it.",
        },
      },
      {
        heading: "An octave is a doubling",
        body:
          "Double a frequency and you get a note that sounds like the same note, higher. A4 is 440 Hz; A5 is 880; A3 is 220. Every culture that has looked at this has landed on the same conclusion, because the ear genuinely hears them as versions of one thing.\n\nWestern music divides that doubling into twelve equal steps. Twelve is not inevitable — other traditions divide it differently — but it is the grid everything in this Academy sits on.",
        example: "A2 = 110 Hz · A3 = 220 Hz · A4 = 440 Hz · A5 = 880 Hz",
      },
      {
        heading: "Timbre is why a piano is not a violin",
        body:
          "Play A4 on a piano and on a violin and both are 440 Hz, yet nobody confuses them. The difference is timbre, and it comes from the overtones: alongside the 440 Hz the instrument also produces quieter sounds at 880, 1320, 1760 and so on, and the recipe of which overtones are loud is what your ear recognises as \"piano\".\n\nThis matters more than it sounds. Orchestration — choosing who plays what — is almost entirely the craft of combining timbres, and it is Level 5 of this roadmap.",
      },
      {
        heading: "Dynamics are loudness, written down",
        body:
          "Volume is marked with Italian abbreviations, quiet to loud: pp (pianissimo), p (piano), mp (mezzo-piano), mf (mezzo-forte), f (forte), ff (fortissimo). A crescendo gets louder across a passage; a diminuendo or decrescendo gets quieter.\n\nThey are relative, not absolute. A forte in a string quartet and a forte in a symphony are different amounts of air. The marking tells a player where they are on their own range, not how many decibels to produce.",
        callout: {
          kind: "insight",
          text: "A piece marked entirely forte has no forte in it. Loud only exists next to quiet.",
        },
      },
    ],
    quiz: [
      { subject: "Fundamentals", difficulty: 1, prompt: "A4 is 440 Hz. What is the frequency of A5?", choices: ["220 Hz", "660 Hz", "880 Hz", "1320 Hz"], answerIndex: 2, explanation: "An octave up doubles the frequency: 440 × 2 = 880 Hz." },
      { subject: "Fundamentals", difficulty: 1, prompt: "Two instruments play the same pitch at the same volume and still sound different. What differs?", choices: ["Frequency", "Timbre", "Dynamics", "Tempo"], answerIndex: 1, explanation: "Timbre — the pattern of overtones each instrument produces above the fundamental." },
      { subject: "Fundamentals", difficulty: 1, prompt: "How many equal steps does Western music divide the octave into?", choices: ["7", "8", "12", "24"], answerIndex: 2, explanation: "Twelve — the twelve pitches you see as the black and white keys within one octave." },
      { subject: "Fundamentals", difficulty: 1, prompt: "Order these quietest to loudest: f, pp, mf, p", choices: ["pp, p, mf, f", "p, pp, f, mf", "pp, mf, p, f", "f, mf, p, pp"], answerIndex: 0, explanation: "pianissimo, piano, mezzo-forte, forte — pp is the quietest of the four." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Find the octaves", prompt: "On a keyboard, play any note, then find the same letter above and below it. Listen for the sameness — that is the doubling.", hint: "Count twelve keys up, black and white both." },
      { type: "COMPOSITION", title: "One note, four dynamics", prompt: "Write four bars that use only one pitch, but move from pp to ff and back. Prove that dynamics alone can make a shape." },
    ],
    skillRewards: { EXPRESSION: 20, TECHNIQUE: 10 },
  },

  // ---------------------------------------------------------------- 1.3 ----
  {
    slug: "the-staff",
    title: "The Staff",
    description: "Five lines, two clefs, and how to read a note without counting from the bottom every time.",
    category: "FUNDAMENTALS",
    difficulty: 1,
    tierRequirement: "NO_EXPERIENCE",
    order: 0,
    xpReward: 55,
    content: [
      {
        heading: "Five lines and four spaces",
        body:
          "The staff is five horizontal lines. A note sits either on a line or in a space between two lines, and moving up one line-or-space moves up one letter of the musical alphabet. That is the whole system: vertical position means pitch.\n\nWhat the positions mean depends on the clef at the start of the line. Without a clef the staff says nothing.",
      },
      {
        heading: "Treble and bass",
        body:
          "The treble clef is also called the G clef, and the curl in its middle wraps around the line that is G. The bass clef is the F clef, and its two dots sit either side of the line that is F. Every other note follows from that one anchor.\n\nTreble carries higher instruments and the right hand at a keyboard; bass carries lower instruments and the left hand.",
        example:
          "Treble lines, bottom to top: E G B D F · spaces: F A C E\nBass lines, bottom to top: G B D F A · spaces: A C E G",
        callout: {
          kind: "note",
          text: "The mnemonics are a ladder you throw away. Fluent readers recognise positions the way you recognise words, not by spelling them out.",
        },
      },
      {
        heading: "The grand staff",
        body:
          "Piano music uses both clefs at once, braced together — the grand staff. Between them sits middle C, which needs its own little ledger line because it falls in the gap: one line below the treble staff, or one line above the bass staff, and those are the same note.\n\nThat shared C is the hinge. Once you know where it is on both staves, you can read either one from it.",
      },
      {
        heading: "Ledger lines",
        body:
          "Music that goes above or below the staff gets extra short lines, one per step, added as needed. They are the staff continuing — the pattern of line, space, line does not change, there is just no need to print lines nobody uses.\n\nBeyond about three ledger lines reading gets slow, which is why composers switch clef or use 8va (play an octave higher than written) instead.",
      },
    ],
    quiz: [
      { subject: "Fundamentals", difficulty: 1, prompt: "What does the curl of a treble clef wrap around?", choices: ["The line that is E", "The line that is G", "The line that is B", "Middle C"], answerIndex: 1, explanation: "It is the G clef — the curl identifies G above middle C, and everything else follows from it." },
      { subject: "Fundamentals", difficulty: 1, prompt: "Reading up from the bottom, what are the four spaces of the treble staff?", choices: ["E G B D", "F A C E", "A C E G", "G B D F"], answerIndex: 1, explanation: "F, A, C, E — which spells a word, which is why it is the mnemonic everyone remembers." },
      { subject: "Fundamentals", difficulty: 2, prompt: "On the grand staff, where is middle C?", choices: ["The middle line of the treble staff", "On a ledger line between the two staves", "The bottom line of the bass staff", "It cannot be written on a grand staff"], answerIndex: 1, explanation: "It sits in the gap — one ledger line below treble, or one above bass. The same note, writable either way." },
      { subject: "Fundamentals", difficulty: 2, prompt: "Why do composers use 8va rather than many ledger lines?", choices: ["It sounds different", "It is required above three ledger lines", "Ledger lines get slow to read", "It changes the key"], answerIndex: 2, explanation: "Purely legibility. 8va means play an octave higher than written; the sound is identical either way." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Name ten notes", prompt: "Write ten notes at random on a treble staff and name each one without using a mnemonic. Then do it in bass clef.", hint: "Anchor on the clef's own note and step from there." },
      { type: "COMPOSITION", title: "Cross the gap", prompt: "Write a short phrase for piano that starts in the bass clef and rises through middle C into the treble. Notice where you have to switch staves." },
    ],
    skillRewards: { TECHNIQUE: 20, MELODY: 10 },
  },

  // ---------------------------------------------------------------- 2.3 ----
  {
    slug: "diatonic-harmony",
    title: "Diatonic Harmony",
    description: "The seven chords a key hands you for free, and the roman numerals that name them.",
    category: "HARMONY",
    difficulty: 3,
    tierRequirement: "NEW_TO_COMPOSING",
    order: 0,
    xpReward: 80,
    content: [
      {
        heading: "Build a triad on every degree",
        body:
          "Take a major scale and build a triad on each of its seven notes, using only notes from that scale. You get seven chords, and the pattern of their qualities is the same in every major key — which is why learning it once is worth so much.\n\nIn C major: C E G, D F A, E G B, F A C, G B D, A C E, B D F. Three major, three minor, one diminished, always in that order.",
        example: "I  ii  iii  IV  V  vi  vii°\nC  Dm  Em   F   G  Am  B°",
      },
      {
        heading: "Roman numerals name the function, not the letter",
        body:
          "Uppercase is major, lowercase is minor, ° is diminished and + is augmented. The numeral counts scale degrees, so I is the chord on the first note of whatever key you are in.\n\nThat abstraction is the point. \"I–V–vi–IV\" describes a progression in every key at once, and a musician reading it can play it in D or A♭ without transposing anything in their head.",
        callout: {
          kind: "insight",
          text: "Letter names say what to play. Roman numerals say what it is doing. You want both, but the second travels.",
        },
      },
      {
        heading: "Minor keys have their own pattern",
        body:
          "Natural minor gives a different but equally fixed sequence: i, ii°, III, iv, v, VI, VII. In A minor that is Am, B°, C, Dm, Em, F, G.\n\nIn practice the fifth chord is usually made major — E rather than Em in A minor — by raising the seventh degree. That borrowed sharp is what harmonic minor exists for, and it is what gives a minor key a dominant with real pull.",
      },
    ],
    quiz: [
      { subject: "Harmony", difficulty: 3, prompt: "In a major key, what quality is the chord on the second degree?", choices: ["Major", "Minor", "Diminished", "Augmented"], answerIndex: 1, explanation: "ii is minor in every major key — the pattern is major, minor, minor, major, major, minor, diminished." },
      { subject: "Harmony", difficulty: 3, prompt: "Which degree of a major key carries the diminished triad?", choices: ["The third", "The fifth", "The sixth", "The seventh"], answerIndex: 3, explanation: "vii° — built on the leading tone, and unstable in a way that pushes hard toward the tonic." },
      { subject: "Harmony", difficulty: 3, prompt: "In G major, what chord is vi?", choices: ["Em", "Am", "Bm", "C"], answerIndex: 0, explanation: "The sixth degree of G major is E, and vi is minor: E minor." },
      { subject: "Harmony", difficulty: 4, prompt: "Why is the v chord in a minor key usually played major?", choices: ["To match the relative major", "To give the dominant a leading tone", "To avoid a diminished fifth", "Convention with no reason"], answerIndex: 1, explanation: "Raising the seventh degree turns v into V, which supplies a leading tone a half step below the tonic — and that half step is what makes a cadence pull." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Harmonise a scale", prompt: "Write out the seven diatonic triads of D major and label them with roman numerals. Then do F major.", hint: "The qualities never change; only the letters do." },
      { type: "COMPOSITION", title: "Four chords, one key", prompt: "Write eight bars using only I, IV, V and vi of a key you choose. Order them however you like — the constraint is staying diatonic." },
    ],
    skillRewards: { HARMONY: 35, FORM: 10 },
    prerequisiteSlug: "triads-major-minor",
  },

  // ---------------------------------------------------------------- 2.5 ----
  {
    slug: "seventh-chords",
    title: "Seventh Chords",
    description: "Adding a fourth note, and the five flavours that result.",
    category: "HARMONY",
    difficulty: 4,
    tierRequirement: "KNOW_A_LITTLE",
    order: 0,
    xpReward: 90,
    content: [
      {
        heading: "One more third on top",
        body:
          "A triad is two stacked thirds. Add a third more and you have a seventh chord — four notes, named for the interval between the root and that new top note.\n\nThe quality depends on two things independently: what the triad underneath is, and whether the seventh is major or minor. That is why there are five common types rather than three.",
        example:
          "Cmaj7  C E G B   major triad + major 7th\nC7     C E G B♭  major triad + minor 7th\nCm7    C E♭ G B♭ minor triad + minor 7th\nCm7♭5  C E♭ G♭ B♭ diminished triad + minor 7th\nC°7    C E♭ G♭ B♭♭ diminished triad + diminished 7th",
      },
      {
        heading: "The dominant seventh does the work",
        body:
          "C7 — major triad, minor seventh — is the engine of tonal music. It contains a tritone between its third and its seventh, and that tritone is unstable in a very specific way: the third wants to rise a half step and the seventh wants to fall a half step, and if you let them both do it you land on the tonic.\n\nThat is the whole mechanism of a V7–I cadence. Every other use of a dominant seventh is a variation on it.",
        callout: {
          kind: "insight",
          text: "In C major, G7 contains B and F. B wants to go to C; F wants to go to E. Both are in the C chord. The resolution is baked into the notes.",
        },
      },
      {
        heading: "The fully diminished seventh is symmetrical",
        body:
          "Stack three minor thirds and every interval in the chord is identical, which means it has no obvious root — any of its four notes can be heard as the bottom. That ambiguity makes it a pivot: one diminished seventh can lead convincingly into four different keys.\n\nRomantic composers used this constantly, and it is why a diminished seventh so often marks the moment a piece changes direction.",
      },
    ],
    quiz: [
      { subject: "Harmony", difficulty: 4, prompt: "What is the difference between Cmaj7 and C7?", choices: ["The triad underneath", "The seventh: major in Cmaj7, minor in C7", "One is inverted", "Nothing, they are the same chord"], answerIndex: 1, explanation: "Both have a major triad. Cmaj7 adds B; C7 adds B♭." },
      { subject: "Harmony", difficulty: 4, prompt: "Which two notes of G7 create its tritone?", choices: ["G and D", "G and F", "B and F", "D and F"], answerIndex: 2, explanation: "B (the third) and F (the seventh) are a tritone apart — and resolving them outward and inward lands on C and E." },
      { subject: "Harmony", difficulty: 5, prompt: "Why can a fully diminished seventh chord lead to several different keys?", choices: ["It has no third", "It is symmetrical, so it has no single obvious root", "It contains every note of the scale", "It is always played in first inversion"], answerIndex: 1, explanation: "Three stacked minor thirds means every interval is identical — any note can be heard as the root, and each hearing implies a different resolution." },
      { subject: "Harmony", difficulty: 4, prompt: "A half-diminished seventh chord is built from which triad?", choices: ["Major", "Minor", "Diminished", "Augmented"], answerIndex: 2, explanation: "A diminished triad with a minor seventh on top — written m7♭5 or ø7." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Spell all five", prompt: "Write out the five seventh-chord types on the root F, then on the root A. Say each one out loud as you spell it.", hint: "Decide the triad first, then the seventh separately." },
      { type: "COMPOSITION", title: "Resolve the tritone", prompt: "Write a four-bar phrase ending in a V7–I cadence. Make sure the third rises and the seventh falls by step — hear what that does." },
    ],
    skillRewards: { HARMONY: 40, EXPRESSION: 10 },
    prerequisiteSlug: "diatonic-harmony",
  },

  // ---------------------------------------------------------------- 3.2 ----
  {
    slug: "voice-leading",
    title: "Voice Leading",
    description: "Moving four independent parts so each one is worth singing.",
    category: "HARMONY",
    difficulty: 5,
    tierRequirement: "KNOW_A_LITTLE",
    order: 0,
    xpReward: 95,
    content: [
      {
        heading: "Four singers, not four chords",
        body:
          "Write a progression as blocks and you get a sequence of chords. Write it as four voices — soprano, alto, tenor, bass — and you get four melodies that happen to agree. The second is what voice leading is for, and it is the difference between harmony that sounds correct and harmony that sounds alive.\n\nThe governing principle is simple: move each voice as little as possible. Common tones stay put, everything else steps.",
      },
      {
        heading: "The rules worth knowing",
        body:
          "Avoid parallel fifths and octaves between any two voices — when two parts move in the same direction a fifth or octave apart, they stop sounding like two people and start sounding like one with a thickened tone.\n\nResolve tendency tones: the leading tone rises to the tonic, and a chordal seventh falls by step. Keep the voices in order — soprano above alto above tenor above bass — and avoid gaps larger than an octave between adjacent upper voices.",
        callout: {
          kind: "warning",
          text: "These are conventions of one style, not laws of music. Parallel fifths are the entire point of some medieval and much rock writing. Learn what they do before deciding to use them.",
        },
      },
      {
        heading: "Why parallels weaken the texture",
        body:
          "Independence is what makes four voices sound like four. Two voices moving in parallel octaves are doubling, not conversing, so you have lost a line. Parallel fifths do a milder version of the same thing — the fifth is so consonant that the two parts fuse.\n\nContrary motion is the cure and the default: when the bass goes down, let the soprano go up. It keeps every part audible and it makes the texture feel wider than it is.",
        example: "Bad:  S: C→D   B: F→G   (parallel fifths)\nBetter: S: C→B   B: F→G   (contrary motion)",
      },
    ],
    quiz: [
      { subject: "Harmony", difficulty: 5, prompt: "Two voices a fifth apart both move up a step. What is that called?", choices: ["Contrary motion", "Parallel fifths", "Oblique motion", "A suspension"], answerIndex: 1, explanation: "Parallel fifths — same interval, same direction — and the two parts stop sounding independent." },
      { subject: "Harmony", difficulty: 5, prompt: "Which way should a chordal seventh resolve?", choices: ["Up by step", "Down by step", "Up by leap", "It does not need to resolve"], answerIndex: 1, explanation: "Down by step. The seventh is a dissonance leaning downward, and stepping down is what releases it." },
      { subject: "Harmony", difficulty: 5, prompt: "What is the simplest general principle of good voice leading?", choices: ["Use as many notes as possible", "Move each voice as little as possible", "Keep all voices in parallel", "Always double the third"], answerIndex: 1, explanation: "Common tones held, everything else stepping. Smooth lines are both easier to sing and easier to hear as separate." },
      { subject: "Harmony", difficulty: 5, prompt: "Why is contrary motion useful?", choices: ["It is easier to write", "It keeps voices independent and widens the texture", "It avoids all dissonance", "It is required in every style"], answerIndex: 1, explanation: "Moving parts in opposite directions keeps each audible as its own line and opens the spacing." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Find the parallels", prompt: "Write a I–V–I in four parts deliberately containing parallel fifths. Then rewrite it without them and compare how each sounds." },
      { type: "COMPOSITION", title: "Four real lines", prompt: "Harmonise an eight-note melody in four parts. Afterwards, sing or play each inner voice alone — if the alto is boring, the harmony is not finished." },
    ],
    skillRewards: { HARMONY: 35, COUNTERPOINT: 20 },
    prerequisiteSlug: "seventh-chords",
  },

  // ---------------------------------------------------------------- 3.4 ----
  {
    slug: "non-chord-tones",
    title: "Non-Chord Tones",
    description: "The notes that do not belong to the chord, and are most of what makes a line sing.",
    category: "MELODY",
    difficulty: 4,
    tierRequirement: "KNOW_A_LITTLE",
    order: 0,
    xpReward: 85,
    content: [
      {
        heading: "Decoration is not filler",
        body:
          "If every melody note belonged to the chord under it, melodies would be arpeggios. The notes in between — the ones that clash briefly and then resolve — are where expression lives. They are called non-chord tones, and each type is defined by how you arrive at it and how you leave.",
      },
      {
        heading: "The catalogue",
        body:
          "A passing tone steps between two chord tones in the same direction. A neighbour tone steps away and comes straight back. A suspension is held over from the previous chord and resolves down by step — it is the one that creates real tension, because the listener hears the new harmony arrive with an old note still in it.\n\nAn appoggiatura is leapt into and resolves by step, which makes it the most emphatic of the group. An anticipation arrives early, sounding a note of the next chord before the chord gets there. A pedal tone is a bass note held while the harmony changes over it.",
        example: "C chord, melody C–D–E : D is a passing tone\nC chord, melody E–F–E : F is a neighbour tone\nG7→C, melody holds D into the C chord, then falls to C : suspension",
      },
      {
        heading: "Suspensions are worth a lesson of their own",
        body:
          "Three stages: preparation (the note is a chord tone in the previous harmony), suspension (the harmony changes, the note stays and is now dissonant), resolution (it steps down into the new chord).\n\nThat pattern is the backbone of a great deal of Baroque and choral writing, and it is the reason a plain chord progression can be made to ache without adding a single new chord.",
        callout: {
          kind: "insight",
          text: "Play a I–IV–I and it is fine. Suspend the tonic over the IV and resolve it, and suddenly it is expressive. Same chords.",
        },
      },
    ],
    quiz: [
      { subject: "Melody", difficulty: 4, prompt: "A note steps away from a chord tone and immediately steps back. What is it?", choices: ["Passing tone", "Neighbour tone", "Suspension", "Anticipation"], answerIndex: 1, explanation: "A neighbour tone — away and back, upper or lower." },
      { subject: "Melody", difficulty: 4, prompt: "What are the three stages of a suspension?", choices: ["Attack, decay, release", "Preparation, suspension, resolution", "Leap, step, leap", "Tonic, dominant, tonic"], answerIndex: 1, explanation: "Prepared as a consonance, held into the new chord as a dissonance, resolved down by step." },
      { subject: "Melody", difficulty: 4, prompt: "Which non-chord tone is approached by leap and left by step?", choices: ["Passing tone", "Anticipation", "Appoggiatura", "Pedal tone"], answerIndex: 2, explanation: "An appoggiatura — leapt into, which is why it lands with emphasis, then resolved by step." },
      { subject: "Melody", difficulty: 4, prompt: "What is a pedal tone?", choices: ["A note played with the foot", "A sustained bass note held while harmony changes above it", "The lowest note of a chord", "A note that resolves upward"], answerIndex: 1, explanation: "A held bass note — usually tonic or dominant — under changing chords, creating tension until the harmony agrees with it again." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Label the decorations", prompt: "Take any melody you know, write out the chords under it, and label every note that is not in its chord with which kind it is." },
      { type: "COMPOSITION", title: "Same chords, twice", prompt: "Write four bars of plain chord tones. Then rewrite the melody over identical harmony using passing tones, a neighbour and one suspension. Compare." },
    ],
    skillRewards: { MELODY: 35, EXPRESSION: 20 },
    prerequisiteSlug: "cadences-and-accompaniment",
  },

  // ---------------------------------------------------------------- 3.5 ----
  {
    slug: "modes",
    title: "Modes",
    description: "The major scale started from each of its own degrees, and why each rotation has a colour.",
    category: "HARMONY",
    difficulty: 5,
    tierRequirement: "BASIC_COMPOSER",
    order: 0,
    xpReward: 95,
    content: [
      {
        heading: "Same notes, different home",
        body:
          "Play the white keys from C to C and you have C major. Play the same white keys from D to D and you have D Dorian — identical pitches, different tonic, and it does not sound like C major at all.\n\nThat is the whole idea. A mode is a scale defined by where the half steps fall relative to its own tonic, and rotating the starting point moves them.",
        example: "Ionian   C D E F G A B C   (major)\nDorian   D E F G A B C D\nPhrygian E F G A B C D E\nLydian   F G A B C D E F\nMixolydian G A B C D E F G\nAeolian  A B C D E F G A   (natural minor)\nLocrian  B C D E F G A B",
      },
      {
        heading: "Learn each by its one odd note",
        body:
          "The efficient way to hear a mode is against the major or minor scale it most resembles, noticing the single degree that differs.\n\nDorian is minor with a raised sixth — minor, but not sad; folk and jazz live here. Phrygian is minor with a lowered second, which gives it a dark Spanish edge. Lydian is major with a raised fourth, and that one note is why it floats — film composers reach for it constantly. Mixolydian is major with a lowered seventh, which is most of rock and blues. Locrian has a diminished fifth above its tonic, so its home chord is unstable, which is why almost nobody writes in it.",
        callout: {
          kind: "insight",
          text: "One note is the difference between Lydian and major. That single raised fourth is doing all the work of \"dreamy\".",
        },
      },
      {
        heading: "Making a mode actually sound modal",
        body:
          "Writing the notes is not enough. If your D Dorian piece keeps cadencing onto C, the ear will hear C major with an odd start. To establish a mode you have to keep returning to its tonic, lean on the chord built on it, and use the characteristic note prominently.\n\nAvoid the leading tone. A half step below the tonic is what makes a key sound like a key rather than a mode — which is precisely why most modes do not have one.",
      },
    ],
    quiz: [
      { subject: "Harmony", difficulty: 5, prompt: "Dorian differs from natural minor by which degree?", choices: ["A lowered second", "A raised sixth", "A raised seventh", "A lowered fifth"], answerIndex: 1, explanation: "Dorian is natural minor with a raised sixth — the note that keeps it from sounding straightforwardly sad." },
      { subject: "Harmony", difficulty: 5, prompt: "Which mode is major with a raised fourth?", choices: ["Mixolydian", "Lydian", "Phrygian", "Locrian"], answerIndex: 1, explanation: "Lydian. That raised fourth is the whole flavour — bright and unresolved at once." },
      { subject: "Harmony", difficulty: 5, prompt: "Why is Locrian rarely used as a tonal centre?", choices: ["It has too many flats", "Its tonic chord is diminished and unstable", "It has no third", "It is identical to Phrygian"], answerIndex: 1, explanation: "A diminished fifth above the tonic means the home chord itself will not sit still." },
      { subject: "Harmony", difficulty: 5, prompt: "You want a piece to sound like D Dorian rather than C major. What matters most?", choices: ["Using only white keys", "Cadencing on D and leaning on the D chord", "Avoiding the note B", "Writing in 6/8"], answerIndex: 1, explanation: "The notes alone do not decide the tonic — where you keep landing does." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Seven rotations", prompt: "Play the white keys from each of the seven letters in turn. Name the mode and say which single degree makes it different from major or minor." },
      { type: "COMPOSITION", title: "Commit to a mode", prompt: "Write eight bars in Lydian. Land on the tonic often and use the raised fourth where it will be heard — no leading tone anywhere." },
    ],
    skillRewards: { HARMONY: 30, EXPRESSION: 25 },
    prerequisiteSlug: "minor-scales",
  },

  // ---------------------------------------------------------------- 3.6 ----
  {
    slug: "transposition",
    title: "Transposition",
    description: "Moving music to another key, and why the trumpet part is not in the key you think.",
    category: "FUNDAMENTALS",
    difficulty: 4,
    tierRequirement: "KNOW_A_LITTLE",
    order: 0,
    xpReward: 80,
    content: [
      {
        heading: "Shift everything by the same interval",
        body:
          "Transposing means moving every note by an identical interval, so the relationships between them survive intact. The tune is recognisably the same tune; only its absolute pitch has changed.\n\nThat is why it works: music is heard as intervals, not frequencies. Sing Happy Birthday in any key and everyone still knows it.",
      },
      {
        heading: "Why singers ask for it",
        body:
          "Voices have ranges, and a song sitting a third too high is unsingable no matter how good the singer. Dropping it a third fixes the problem and changes nothing else.\n\nThe practical method: work out the interval between the old and new tonic, apply it to every note, then rewrite the key signature. Doing it by interval rather than by scale degree keeps accidentals correct.",
        callout: {
          kind: "note",
          text: "Transposing by scale degree instead of by interval is the classic mistake — it quietly changes chromatic notes into diatonic ones.",
        },
      },
      {
        heading: "Transposing instruments",
        body:
          "Some instruments are built so that their written C sounds as a different pitch. A B♭ trumpet playing a written C sounds a B♭ — a major second lower than written. An F horn playing a written C sounds F, a perfect fifth lower.\n\nThis exists so a player can move between instruments of the same family using the same fingerings. It means a composer writing for them must transpose in the opposite direction: to have a B♭ trumpet sound a concert C, you write a D.",
        example: "B♭ instruments sound a major 2nd below written\nE♭ instruments sound a major 6th below written\nF horn sounds a perfect 5th below written",
      },
    ],
    quiz: [
      { subject: "Fundamentals", difficulty: 4, prompt: "What stays the same when music is transposed?", choices: ["The absolute frequencies", "The intervals between notes", "The key signature", "The clef"], answerIndex: 1, explanation: "Every note moves by the same interval, so the relationships between them are preserved — which is what makes it the same tune." },
      { subject: "Fundamentals", difficulty: 4, prompt: "A B♭ trumpet plays a written C. What pitch sounds?", choices: ["C", "B♭", "D", "F"], answerIndex: 1, explanation: "B♭ instruments sound a major second below what is written." },
      { subject: "Fundamentals", difficulty: 5, prompt: "You want a B♭ clarinet to sound a concert F. What do you write?", choices: ["E♭", "F", "G", "B♭"], answerIndex: 2, explanation: "Write a major second above the sounding pitch: G sounds as F." },
      { subject: "Fundamentals", difficulty: 4, prompt: "Why should you transpose by interval rather than by scale degree?", choices: ["It is faster", "It keeps chromatic notes chromatic", "It avoids changing the clef", "There is no difference"], answerIndex: 1, explanation: "Scale-degree thinking flattens accidentals into the new key and silently rewrites the harmony." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Down a third", prompt: "Take an eight-bar melody in C major and transpose it to A major. Then to E♭. Check every accidental survived." },
      { type: "COMPOSITION", title: "Write for a trumpet", prompt: "Write four bars you want to sound in concert F major, notated correctly for a B♭ trumpet. Say which key signature the player sees." },
    ],
    skillRewards: { TECHNIQUE: 25, INSTRUMENTATION: 25 },
    prerequisiteSlug: "circle-of-fifths",
  },

  // ---------------------------------------------------------------- 4.2 ----
  {
    slug: "modulation-techniques",
    title: "Modulation",
    description: "Four ways to change key — pivot, direct, sequential and chromatic mediant.",
    category: "HARMONY",
    difficulty: 6,
    tierRequirement: "BASIC_COMPOSER",
    order: 0,
    xpReward: 110,
    content: [
      {
        heading: "Changing key is a matter of persuasion",
        body:
          "A modulation is not simply playing notes from a different scale — it is convincing the listener that home has moved. That requires establishing the new tonic, usually with its own dominant and a cadence. Without that, the ear hears a passing chromatic detour and waits to be returned.",
      },
      {
        heading: "Pivot chord: the smooth one",
        body:
          "Find a chord that exists in both keys, treat it as belonging to the old key when you arrive and to the new key when you leave, then cadence in the new key. The listener does not notice the join.\n\nC major to G major: Am is vi in C and ii in G. Arrive on it as vi, leave it as ii, go ii–V–I in G, and you are somewhere else without a seam.",
        example: "C: I  vi ———— G: ii  V  I\n   C  Am           Am  D  G",
      },
      {
        heading: "Direct, sequential, chromatic mediant",
        body:
          "A direct modulation simply starts the new key, usually at a phrase boundary — abrupt, and effective precisely because it is. The key change into a final chorus is almost always this.\n\nA sequential modulation repeats a melodic or harmonic pattern at successively higher or lower pitches until it has drifted into a new key; the repetition itself is what makes it sound inevitable.\n\nA chromatic mediant modulation moves to a key a third away that shares little with the old one — C to E major, or C to A♭. Romantic composers and film scorers use it for a specific effect: the sound of the ground shifting.",
        callout: {
          kind: "insight",
          text: "Chromatic mediants are why so much film music sounds \"magical\". The move is a third away with one common tone, and the ear cannot quite explain it.",
        },
      },
      {
        heading: "Where you go matters",
        body:
          "Closely related keys — the dominant, the subdominant, the relative minor — share most of their notes with home, so the journey is easy and the return easy too. Distant keys cost more to reach and more to leave, which is exactly why arriving in one is an event.\n\nClassical form uses this structurally: a sonata exposition moves to the dominant not for colour but because that tension is what the rest of the movement resolves.",
      },
    ],
    quiz: [
      { subject: "Harmony", difficulty: 6, prompt: "What makes a pivot chord work?", choices: ["It is always diminished", "It belongs to both the old and the new key", "It is played louder", "It contains the leading tone of both keys"], answerIndex: 1, explanation: "A chord shared by both keys can be reinterpreted mid-stream, so the change of function happens without a seam." },
      { subject: "Harmony", difficulty: 6, prompt: "In C major moving to G major, which chord could pivot as vi becoming ii?", choices: ["Em", "Am", "F", "Dm"], answerIndex: 1, explanation: "Am is the sixth degree of C and the second degree of G — the same chord with two jobs." },
      { subject: "Harmony", difficulty: 6, prompt: "What is a chromatic mediant relationship?", choices: ["A key a second away", "A key a third away sharing little with the original", "A key a fifth away", "The relative minor"], answerIndex: 1, explanation: "A third away, chromatically altered — C to E or C to A♭ — which is why it sounds like the floor moving." },
      { subject: "Harmony", difficulty: 6, prompt: "What must happen for a listener to accept that the key has genuinely changed?", choices: ["A new key signature is written", "The new tonic is established, usually by a cadence", "The tempo changes", "The melody stops"], answerIndex: 1, explanation: "Notation persuades nobody. A cadence in the new key is what moves home." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Find the pivots", prompt: "List every chord shared between C major and each of G, F and A minor. Those are your pivot options in each direction." },
      { type: "COMPOSITION", title: "Two routes out", prompt: "Write the same eight-bar phrase twice: once modulating to the dominant by pivot, once by direct modulation. Which suits the material?" },
    ],
    skillRewards: { HARMONY: 45, FORM: 20 },
    prerequisiteSlug: "modulation-secondary-dominants",
  },

  // ---------------------------------------------------------------- 4.3 ----
  {
    slug: "borrowed-chords",
    title: "Borrowed Chords",
    description: "Modal mixture — taking chords from the parallel mode for colour without leaving the key.",
    category: "HARMONY",
    difficulty: 6,
    tierRequirement: "BASIC_COMPOSER",
    order: 0,
    xpReward: 105,
    content: [
      {
        heading: "Same tonic, other mode",
        body:
          "C major and C minor share a tonic and differ in their third, sixth and seventh degrees. Borrowing means using a chord from one while you are in the other, without modulating — the key does not change, the palette does.\n\nBecause the tonic is shared, the ear accepts the borrowed chord as a shading of home rather than a departure from it.",
      },
      {
        heading: "The useful ones in a major key",
        body:
          "iv — the minor subdominant — is the classic. Where IV is open and bright, iv is the same chord with a flattened sixth and it aches. Putting iv immediately after IV is a move so common you will start hearing it everywhere.\n\n♭VI and ♭VII come from the same place and are most of what makes rock and film harmony sound the way it does: in C, that is A♭ and B♭, neither of which belongs to C major. ♭III completes the set.",
        example: "C major borrowing:  C  F  Fm  C     (IV → iv → I)\nRock cadence:       C  B♭ F  C     (I ♭VII IV I)",
        callout: {
          kind: "insight",
          text: "The IV–iv–I move is everywhere once you notice it. The flattened sixth appears for one chord and then resolves down by a half step into the tonic's fifth.",
        },
      },
      {
        heading: "Borrowing the other way",
        body:
          "A minor key can borrow from major too. The Picardy third — ending a minor-key piece on a major tonic chord — is the oldest example, and it works because the raised third arrives exactly where the ear has stopped expecting change.\n\nRaising the sixth degree in a minor key gives you the major IV, which Dorian-flavoured writing uses constantly.",
      },
    ],
    quiz: [
      { subject: "Harmony", difficulty: 6, prompt: "What does borrowing a chord mean?", choices: ["Modulating to a new key", "Using a chord from the parallel mode without changing key", "Playing a chord from the relative minor", "Using a chord with no root"], answerIndex: 1, explanation: "Parallel — same tonic, other mode. The key stays put; the colour changes." },
      { subject: "Harmony", difficulty: 6, prompt: "In C major, which chord is the borrowed iv?", choices: ["F major", "F minor", "A minor", "A♭ major"], answerIndex: 1, explanation: "F minor — the subdominant with a flattened sixth degree (A♭) borrowed from C minor." },
      { subject: "Harmony", difficulty: 6, prompt: "A minor-key piece ends on a major tonic chord. What is that called?", choices: ["A deceptive cadence", "A Picardy third", "A plagal cadence", "Modal mixture in reverse"], answerIndex: 1, explanation: "The Picardy third — a raised third on the final tonic, borrowed from the parallel major." },
      { subject: "Harmony", difficulty: 6, prompt: "In C major, what are ♭VI and ♭VII?", choices: ["A minor and B minor", "A♭ major and B♭ major", "A major and B major", "F minor and G minor"], answerIndex: 1, explanation: "A♭ and B♭ major, both borrowed from C minor — and together the sound of a great deal of rock and film writing." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Swap the mode", prompt: "Write out the seven diatonic triads of C major and C minor side by side. Circle every chord that differs — those are everything you can borrow." },
      { type: "COMPOSITION", title: "One borrowed chord", prompt: "Write eight bars in a major key that are entirely diatonic except for a single iv or ♭VI. Put it where it will be heard." },
    ],
    skillRewards: { HARMONY: 40, EXPRESSION: 25 },
    prerequisiteSlug: "modulation-techniques",
  },

  // ---------------------------------------------------------------- 4.5 ----
  {
    slug: "extended-altered-chords",
    title: "Extended & Altered Chords",
    description: "Ninths, elevenths, thirteenths, altered tensions, and the chords that refuse to have a third.",
    category: "HARMONY",
    difficulty: 7,
    tierRequirement: "DECENT_COMPOSER",
    order: 0,
    xpReward: 120,
    content: [
      {
        heading: "Keep stacking thirds",
        body:
          "A triad is two thirds, a seventh chord three. Carry on and you get the ninth, eleventh and thirteenth — and once you reach the thirteenth you have used all seven notes of the scale, so there is nowhere further to go.\n\nIn practice nobody plays all of them. A voicing picks the notes that matter: root, third, seventh and whichever extension is the point. The fifth is usually the first thing dropped, because it says the least.",
        example: "C9   C E G B♭ D\nC11  C E G B♭ D F   (the 11th clashes with E — usually raised or the 3rd omitted)\nC13  C E G B♭ D F A",
      },
      {
        heading: "Altered tensions",
        body:
          "Sharpen or flatten an extension and you get ♭9, ♯9, ♯11 and ♭13. These are almost always applied to dominant chords, where the existing instability makes room for more.\n\nThe ♯9 is the famous one — a dominant seventh with both a major third and what sounds like a minor third above it. It should not work and it is one of the most recognisable sounds in popular music.",
        callout: {
          kind: "note",
          text: "An altered dominant is still a dominant. Everything you know about V–I still applies; the alterations colour the tension, they do not remove it.",
        },
      },
      {
        heading: "Sus and slash chords",
        body:
          "A suspended chord replaces the third with the second or fourth. With no third it is neither major nor minor, which makes it open and unresolved — sus4 leaning toward resolution, sus2 simply hanging.\n\nA slash chord names a bass note that is not the root: C/E is a C chord with E underneath. Sometimes that is just first inversion written for a guitarist; sometimes the bass note is not in the chord at all, and then you are writing a genuinely different sound.",
      },
    ],
    quiz: [
      { subject: "Harmony", difficulty: 7, prompt: "How many notes would a complete thirteenth chord contain?", choices: ["Five", "Six", "Seven", "Eight"], answerIndex: 2, explanation: "Root, 3rd, 5th, 7th, 9th, 11th, 13th — all seven notes of the scale, which is why it is the end of the line." },
      { subject: "Harmony", difficulty: 7, prompt: "Which chord tone is usually dropped first from an extended voicing?", choices: ["The root", "The third", "The fifth", "The seventh"], answerIndex: 2, explanation: "The fifth carries the least information — the third and seventh define the quality and the extensions are the point." },
      { subject: "Harmony", difficulty: 7, prompt: "What does a sus4 chord replace the third with?", choices: ["The second", "The fourth", "The sixth", "The seventh"], answerIndex: 1, explanation: "The fourth. With no third the chord is neither major nor minor, and it leans toward resolving down to the third." },
      { subject: "Harmony", difficulty: 7, prompt: "C/E most often indicates what?", choices: ["A C chord with E in the bass", "An E chord with C in the bass", "C and E played as a dyad", "A modulation to E"], answerIndex: 0, explanation: "The letter after the slash is the bass note — here a C triad in first inversion." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Voice a thirteenth", prompt: "Write a four-note voicing of C13 that keeps the third and seventh and drops what you do not need. Justify each note you kept." },
      { type: "COMPOSITION", title: "Alter the dominant", prompt: "Write a ii–V–I in a major key, then rewrite it with a ♭9 and again with a ♯9 on the V. Listen to what each alteration does to the pull." },
    ],
    skillRewards: { HARMONY: 50, EXPRESSION: 20 },
    prerequisiteSlug: "seventh-chords",
  },

  // ---------------------------------------------------------------- 5.1 ----
  {
    slug: "jazz-harmony",
    title: "Jazz Harmony",
    description: "ii–V–I, tritone substitution, modal jazz, reharmonisation and quartal voicings.",
    category: "HARMONY",
    difficulty: 8,
    tierRequirement: "ADVANCED_COMPOSER",
    order: 0,
    xpReward: 140,
    content: [
      {
        heading: "ii–V–I is the sentence",
        body:
          "Almost all jazz harmony is built from one unit: ii7–V7–Imaj7. Predominant, dominant, tonic — the same functional logic as classical harmony, but with sevenths as the default rather than the exception, and moving by descending fifths.\n\nIn minor it becomes iiø7–V7♭9–i, with the half-diminished second degree and an altered dominant. Learn both in all twelve keys and you can read most standards.",
        example: "C major:  Dm7  G7  Cmaj7\nC minor:  Dm7♭5  G7♭9  Cm7",
      },
      {
        heading: "Tritone substitution",
        body:
          "A dominant seventh's identity lives in the tritone between its third and seventh. G7 has B and F. D♭7 has F and C♭ — enharmonically F and B, the same two notes.\n\nSo D♭7 can replace G7. Both resolve to C, but the bass now steps down chromatically, D♭ to C, instead of leaping a fifth. That single substitution is most of what makes a jazz bassline sound like one.",
        callout: {
          kind: "insight",
          text: "The two chords share a tritone and nothing else. That shared tritone is enough for the ear to accept the swap.",
        },
      },
      {
        heading: "Modal jazz and reharmonisation",
        body:
          "By the late fifties some players found the density of changes exhausting, and the answer was to slow them down drastically — one mode for sixteen bars, improvisation shaped by melody rather than by chasing chords. Kind of Blue is the record that made the case.\n\nReharmonisation runs the other way: keep a melody and put new chords underneath. Every melody note can be harmonised many ways, and choosing a chord where the tune's note is a ninth or a thirteenth rather than a root is how a familiar song is made strange.",
      },
      {
        heading: "Quartal voicings",
        body:
          "Stack fourths instead of thirds — C F B♭ E♭ — and the result has no clear quality, major or minor. It is open, modern and deliberately ambiguous, which is exactly why modal jazz reached for it.\n\nThirds tell the ear what key it is in. Fourths decline to.",
      },
    ],
    quiz: [
      { subject: "Harmony", difficulty: 8, prompt: "What is the central cadential unit of jazz harmony?", choices: ["I–IV–V", "ii–V–I", "vi–IV–I–V", "I–♭VII–IV"], answerIndex: 1, explanation: "ii–V–I: predominant, dominant, tonic, moving by descending fifths with sevenths throughout." },
      { subject: "Harmony", difficulty: 8, prompt: "Why can D♭7 substitute for G7?", choices: ["They share a root", "They share the same tritone", "They are both diminished", "They are a fifth apart"], answerIndex: 1, explanation: "G7's B and F are, enharmonically, D♭7's C♭ and F — the same tritone, so the same resolving tendency." },
      { subject: "Harmony", difficulty: 8, prompt: "What does a quartal voicing stack?", choices: ["Thirds", "Fourths", "Fifths", "Seconds"], answerIndex: 1, explanation: "Fourths — which leaves the chord without a clear major or minor quality." },
      { subject: "Harmony", difficulty: 8, prompt: "What distinguishes modal jazz from bebop?", choices: ["Faster tempos", "Far fewer chord changes, held much longer", "No improvisation", "Only minor keys"], answerIndex: 1, explanation: "One mode held for many bars instead of dense changes, shifting the improviser's job from navigating chords to shaping melody." },
    ],
    exercises: [
      { type: "PRACTICE", title: "ii–V–I around the circle", prompt: "Write ii7–V7–Imaj7 in four keys moving by descending fifths. Then write the minor version of each." },
      { type: "COMPOSITION", title: "Substitute the dominant", prompt: "Write a twelve-bar phrase using ii–V–I, then rewrite it replacing each V7 with its tritone substitution. Compare the basslines." },
    ],
    skillRewards: { HARMONY: 55, EXPRESSION: 25 },
    prerequisiteSlug: "extended-altered-chords",
  },

  // ---------------------------------------------------------------- 5.2 ----
  {
    slug: "post-tonal-theory",
    title: "20th & 21st-Century Theory",
    description: "Atonality, set theory, twelve-tone method, minimalism, spectralism and chance.",
    category: "VIRTUOSO",
    difficulty: 9,
    tierRequirement: "ADVANCED_COMPOSER",
    order: 0,
    xpReward: 150,
    content: [
      {
        heading: "What happens when there is no tonic",
        body:
          "Atonal music avoids establishing any pitch as home. That is harder than it sounds — the ear will nominate a tonic given the slightest excuse, so avoiding one takes active work: no triads left exposed, no note repeated often enough to become a centre, no leading tones resolving.\n\nOnce tonality is gone, so is every analytical tool built on it. Roman numerals describe nothing. New tools were needed.",
      },
      {
        heading: "Pitch-class set theory",
        body:
          "Treat the twelve pitches as numbers 0–11, ignore octave and spelling, and analyse music as unordered sets. C E G becomes {0,4,7}; so does any voicing, inversion or transposition of it, which is the point — the tool describes what the collection *is* rather than how it happens to be arranged.\n\nSets are catalogued by their interval content. Two passages built from the same set class sound related even when nothing on the page looks similar.",
        example: "{0,1,4} — set class 3-3\nC C♯ E, or E G A♭, or any transposition: the same shape",
      },
      {
        heading: "Twelve-tone and total serialism",
        body:
          "Schoenberg's method: arrange all twelve pitches into a fixed order — a row — and derive the piece from it. The row can be used in its prime form, inverted, backwards (retrograde), backwards-and-inverted, and transposed to any of twelve levels, giving forty-eight forms of one idea.\n\nNo pitch repeats until all twelve have sounded, which is the mechanism that prevents any of them becoming a tonic. Later composers extended the row principle to rhythm, dynamics and articulation — total serialism — where almost nothing is left to moment-by-moment choice.",
        callout: {
          kind: "note",
          text: "Serialism is a way of generating material, not a style. Two pieces on the same row can sound nothing alike.",
        },
      },
      {
        heading: "Minimalism, spectralism, chance",
        body:
          "Minimalism builds from process: a short pattern repeated and transformed gradually — phasing two identical loops slowly out of sync, or adding one note per repetition. The material is simple and the interest is in the change.\n\nSpectralism composes from the overtone spectrum of an actual sound, treating the harmonic series itself as the source of harmony rather than any inherited scale.\n\nAleatoric music leaves elements to chance or to the performer, which shifts the composer's job from specifying a result to designing the conditions that produce one.",
      },
    ],
    quiz: [
      { subject: "Virtuoso", difficulty: 9, prompt: "In pitch-class set theory, what is ignored?", choices: ["Rhythm only", "Octave and spelling", "Dynamics only", "Nothing"], answerIndex: 1, explanation: "Pitches are reduced to classes 0–11, so C4, C5 and B♯ are all the same class — the tool describes the collection, not the voicing." },
      { subject: "Virtuoso", difficulty: 9, prompt: "How many forms of a twelve-tone row are available?", choices: ["4", "12", "24", "48"], answerIndex: 3, explanation: "Four transformations — prime, inversion, retrograde, retrograde-inversion — each at twelve transpositions." },
      { subject: "Virtuoso", difficulty: 9, prompt: "What does total serialism apply the row principle to?", choices: ["Pitch only", "Pitch and rhythm only", "Pitch, rhythm, dynamics and articulation", "Only dynamics"], answerIndex: 2, explanation: "Every parameter becomes serially organised, not just pitch." },
      { subject: "Virtuoso", difficulty: 9, prompt: "Spectralism derives its harmony from what?", choices: ["The circle of fifths", "The overtone spectrum of a sound", "A twelve-tone row", "Folk modes"], answerIndex: 1, explanation: "The harmonic series of an actual analysed sound becomes the source material." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Build a row", prompt: "Write a twelve-tone row of your own, then write out its inversion, retrograde and retrograde-inversion." },
      { type: "COMPOSITION", title: "A process piece", prompt: "Write a short minimalist passage: one short figure, repeated, with exactly one thing changing per repetition. Let the process be audible." },
    ],
    skillRewards: { EXPRESSION: 45, FORM: 30, TECHNIQUE: 20 },
    prerequisiteSlug: "chromatic-harmony-modal-writing",
  },

  // ---------------------------------------------------------------- 5.4 ----
  {
    slug: "advanced-analysis",
    title: "Advanced Analysis",
    description: "Schenkerian layers, Neo-Riemannian transformations, and modern theories of form.",
    category: "VIRTUOSO",
    difficulty: 9,
    tierRequirement: "ADVANCED_COMPOSER",
    order: 0,
    xpReward: 150,
    content: [
      {
        heading: "Schenker: the piece under the piece",
        body:
          "Schenkerian analysis reduces a tonal work in layers. The foreground is the notes as written; strip away decoration and you reach the middleground; strip again and you reach the background, which for a great many tonal pieces turns out to be astonishingly simple — a descending line over a I–V–I bass, called the Ursatz.\n\nThe claim is that a twenty-minute movement is one enormous elaborated cadence. You do not have to accept the claim to find the method useful: it forces you to ask which notes are structural and which are decoration, and that is a question worth asking of your own writing.",
        callout: {
          kind: "warning",
          text: "Schenker's method is powerful and was built on explicitly nationalist assumptions about which music deserved analysis. Use the tool; know its history.",
        },
      },
      {
        heading: "Neo-Riemannian transformations",
        body:
          "Romantic music modulates in ways functional harmony struggles to describe — chords a third apart with no dominant preparation, progressions that never cadence. Neo-Riemannian theory describes them as transformations between triads rather than as functions in a key.\n\nThree basic moves, each changing exactly one note: P (parallel) swaps major and minor, C major to C minor. R (relative) goes to the relative, C major to A minor. L (leading-tone exchange) goes C major to E minor. Chains of these describe passages that roman numerals cannot.",
        example: "C major —L→ E minor —P→ E major —L→ G♯ minor\nFour chords, four keys implied, no dominant anywhere.",
      },
      {
        heading: "Modern theories of form",
        body:
          "\"Sonata form is exposition, development, recapitulation\" is true and almost useless for analysing an actual movement, because the interesting questions are all inside those labels.\n\nCaplin's formal functions describe passages by what they do — presentation, continuation, cadential — at the phrase level. Hepokoski and Darcy's Sonata Theory treats form as a set of norms a composer either meets or deliberately fails to meet, so a movement becomes a dialogue with expectation rather than a template being filled in.",
      },
    ],
    quiz: [
      { subject: "Virtuoso", difficulty: 9, prompt: "What does a Schenkerian background level reveal?", choices: ["The melody in full", "A simple structural skeleton, often a line over I–V–I", "The orchestration", "The original sketches"], answerIndex: 1, explanation: "The Ursatz — a descending fundamental line supported by a I–V–I bass arpeggiation." },
      { subject: "Virtuoso", difficulty: 9, prompt: "In Neo-Riemannian theory, what does the P transformation do?", choices: ["Moves to the relative minor", "Swaps major and minor on the same root", "Transposes up a fifth", "Inverts the chord"], answerIndex: 1, explanation: "Parallel: C major to C minor, changing one note — the third." },
      { subject: "Virtuoso", difficulty: 9, prompt: "Why was Neo-Riemannian theory developed?", choices: ["To analyse atonal music", "To describe chromatic triadic music that functional harmony handles poorly", "To replace Schenker", "To analyse rhythm"], answerIndex: 1, explanation: "Romantic chromatic progressions move between triads in ways roman numerals describe badly or not at all." },
      { subject: "Virtuoso", difficulty: 9, prompt: "What does Hepokoski and Darcy's Sonata Theory treat form as?", choices: ["A fixed template", "A dialogue with a set of norms and expectations", "A purely harmonic scheme", "An eighteenth-century curiosity"], answerIndex: 1, explanation: "Norms a composer meets or pointedly declines to meet — so deviation becomes meaningful rather than an error." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Reduce a phrase", prompt: "Take an eight-bar passage from any tonal piece. Strip the decoration in two passes and write out what is left. What was structural?" },
      { type: "COMPOSITION", title: "Transform without cadencing", prompt: "Write a progression of six triads connected only by P, L and R moves. Do not use a single dominant." },
    ],
    skillRewards: { FORM: 45, HARMONY: 35 },
    prerequisiteSlug: "post-tonal-theory",
  },

  // ---------------------------------------------------------------- 5.6 ----
  {
    slug: "ear-training-fluency",
    title: "Ear Training & Fluency",
    description: "Solfège, dictation, improvisation, and reading a full score without an instrument.",
    category: "VIRTUOSO",
    difficulty: 8,
    tierRequirement: "ADVANCED_COMPOSER",
    order: 0,
    xpReward: 140,
    content: [
      {
        heading: "Theory you cannot hear is trivia",
        body:
          "Everything in the four levels before this one is knowledge about music. This one is the layer that turns it into ability: recognising by ear what you can already name on paper.\n\nIt is also the only part of the roadmap that cannot be read. It has to be practised, in short sessions, over a long time. There is no shortcut and everyone who has it got it the same way.",
      },
      {
        heading: "Solfège gives degrees a name you can sing",
        body:
          "Movable-do assigns do to the tonic of whatever key you are in, so the syllables track scale-degree function rather than absolute pitch — la always sounds like the sixth degree. That is what you want for hearing function.\n\nFixed-do assigns do to C permanently, which suits absolute-pitch work and is standard in much of Europe. Movable-do is the more useful tool for a composer, because function is what you are trying to internalise.",
        callout: {
          kind: "insight",
          text: "The aim is that hearing a note makes you think \"that is the flattened seventh\" rather than \"that is a B♭\". Function first; letters follow.",
        },
      },
      {
        heading: "Dictation is the test",
        body:
          "Hear something and write it down. Start with two-note intervals, move to short melodies, then chord qualities, then progressions, then four-part textures.\n\nBuild in layers rather than note by note: get the rhythm first, then the contour, then the exact pitches. Trying to catch everything at once is how people conclude they have no ear, when in fact they had no method.",
      },
      {
        heading: "Improvisation and score reading",
        body:
          "Improvisation is the fluency test — composing in real time with no undo. It requires scales, arpeggios and progressions internalised past the point of thinking about them, which is exactly the state you want for writing anyway.\n\nScore reading is the other half: taking a page of many staves, in several clefs, with transposing instruments, and hearing it without playing it. It is slow to acquire and it is the thing that lets a composer sit with a blank score and know what it will sound like.",
      },
    ],
    quiz: [
      { subject: "Virtuoso", difficulty: 8, prompt: "In movable-do solfège, what does 'do' refer to?", choices: ["The note C always", "The tonic of the current key", "The lowest note", "The dominant"], answerIndex: 1, explanation: "Movable-do puts do on the tonic, so syllables track scale-degree function in any key." },
      { subject: "Virtuoso", difficulty: 8, prompt: "What is the recommended order for taking melodic dictation?", choices: ["Exact pitches, then rhythm", "Rhythm, then contour, then pitches", "Key signature, then dynamics", "Write it all at once"], answerIndex: 1, explanation: "Layers, not notes: rhythm first, then shape, then exact pitches. Catching everything simultaneously is what fails." },
      { subject: "Virtuoso", difficulty: 8, prompt: "Which system suits work with absolute pitch and is standard in much of Europe?", choices: ["Movable-do", "Fixed-do", "Numbers", "Neither"], answerIndex: 1, explanation: "Fixed-do — do is always C, regardless of key." },
      { subject: "Virtuoso", difficulty: 8, prompt: "Why does score reading matter to a composer?", choices: ["It is required by publishers", "It lets you hear what you write before anyone plays it", "It replaces ear training", "It is only for conductors"], answerIndex: 1, explanation: "Hearing a page internally is what makes writing for a large ensemble something other than guesswork." },
    ],
    exercises: [
      { type: "PRACTICE", title: "Ten intervals a day", prompt: "Have someone play ten random intervals. Name each by ear, then check. Do this daily for a fortnight and record your score each day." },
      { type: "COMPOSITION", title: "Write it before you play it", prompt: "Compose eight bars entirely in your head and notate them without touching an instrument. Then play it and note every difference." },
    ],
    skillRewards: { TECHNIQUE: 40, MELODY: 30, EXPRESSION: 20 },
    prerequisiteSlug: "modes",
  },
];
