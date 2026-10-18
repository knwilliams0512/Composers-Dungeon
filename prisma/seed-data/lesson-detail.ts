import type { SeedLessonDetail } from "./types";

/**
 * Depth layered onto each lesson by slug.
 *
 * The lessons themselves teach the concept; this is everything a good teacher
 * adds around it — the vocabulary, the mistakes everyone makes, the recordings
 * that make the idea audible, and a drill short enough to actually do.
 *
 * Every entry is optional and every field is optional. A lesson with no entry
 * here still works exactly as before.
 */
export const lessonDetail: Record<string, SeedLessonDetail> = {
  // -------------------------------------------------------------------------
  // Foundations
  // -------------------------------------------------------------------------
  "what-are-musical-notes": {
    summary:
      "You will be able to name any pitch you hear described, explain why the alphabet stops at G, and understand what makes two notes 'the same note' in different registers.",
    estimatedMinutes: 8,
    keyTerms: [
      { term: "Pitch", definition: "How high or low a sound is, determined by how fast the air vibrates." },
      { term: "Note", definition: "A pitch that has been named and agreed upon, so musicians can share it." },
      { term: "Octave", definition: "The distance between a note and the next note of the same name — a 2:1 frequency ratio." },
      { term: "Register", definition: "Which region of high or low the music sits in. Same notes, different floor of the tower." },
    ],
    commonMistakes: [
      {
        mistake: "Assuming there is an 'H' after G because the alphabet keeps going.",
        fix: "The musical alphabet is a loop, not a line. After G you land on A again, one octave higher.",
      },
      {
        mistake: "Thinking two notes an octave apart are different notes that happen to sound similar.",
        fix: "They are the same note name in a different register. Doubling a melody an octave up thickens it without changing the harmony at all.",
      },
    ],
    listening: [
      {
        piece: "Also sprach Zarathustra, opening fanfare",
        composer: "Richard Strauss",
        why: "The trumpet climbs by octave and fifth — the clearest demonstration in the repertoire of octaves sounding like 'the same note, higher'.",
      },
      {
        piece: "Clair de lune",
        composer: "Claude Debussy",
        why: "Listen for the same melodic idea drifting between registers. Nothing changes but the floor of the tower.",
      },
    ],
    practiceRoutine: [
      "Say the alphabet forwards from C, two octaves up, out loud.",
      "Say it backwards from C, two octaves down.",
      "Pick any letter at random and name the note a step above and a step below within two seconds.",
    ],
    extraSections: [
      {
        heading: "Why Octaves Feel Like the Same Note",
        body: "Double the frequency of any pitch and your ear reports the same note, higher. A at 440 Hz and A at 880 Hz share every other vibration, so their waveforms lock together perfectly. This is not a cultural convention — it appears in nearly every musical tradition on earth, because it is a fact about ears, not about taste.",
        callout: {
          kind: "insight",
          text: "This is why a choir of men and women singing 'the same' melody are usually an octave apart and it sounds like unison, not harmony.",
        },
      },
    ],
  },

  "keyboard-layout": {
    summary:
      "You will be able to find any named note on a piano instantly, using the black-key groups as landmarks rather than counting from the bottom.",
    estimatedMinutes: 10,
    keyTerms: [
      { term: "Landmark", definition: "A visual anchor on the keyboard — the groups of two and three black keys — used to find notes without counting." },
      { term: "Middle C", definition: "The C nearest the middle of a standard 88-key piano; the shared reference point between the two staves." },
      { term: "Natural", definition: "A white key: a note with no sharp or flat attached." },
    ],
    commonMistakes: [
      {
        mistake: "Counting up from the lowest key every time you need to find a note.",
        fix: "Use the black-key groups. C is always immediately left of a group of two; F is always immediately left of a group of three.",
      },
      {
        mistake: "Believing the keyboard is uneven or badly designed because the black keys are irregular.",
        fix: "The irregularity is the point — it makes every key position visually unique, so your hands can navigate by feel in the dark.",
      },
    ],
    listening: [
      {
        piece: "Prelude in C major, BWV 846",
        composer: "J. S. Bach",
        why: "Entirely broken chords in the right hand. Watch a recording of the hands and the keyboard's geography becomes obvious.",
      },
    ],
    practiceRoutine: [
      "Close your eyes, put a finger on any black-key group, and name it before opening them.",
      "Find every C on the instrument in under ten seconds.",
      "Repeat for F, then for B — the two notes with no black key above them.",
    ],
    extraSections: [
      {
        heading: "Which C Is Middle C",
        body:
          "Seven letters name seven keys and a piano has eighty-eight of them, so a letter on its own does not identify a key. The letter is paired with an octave number, and the number changes at every C.\n\nMiddle C is C4 \u2014 the fourth C up on a standard keyboard, near the middle, and the note that sits in the gap between the treble and bass staves. The C above it is C5 and the C below is C3. A4, the A above middle C, is the note orchestras tune to at 440 hertz.\n\nThe numbering is worth getting right early, because every pitch written down anywhere \u2014 in a score, in a range chart, in this app \u2014 is named this way, and C3 for C4 is a whole octave of difference.",
        example: "C3 \u00b7 C4 (middle C) \u00b7 A4 = 440 Hz \u00b7 C5 \u00b7 C6",
        figure: {
          kind: "keyboard",
          caption: "The octave number changes at every C, and middle C is C4",
          from: 48,
          to: 84,
          marks: [
            { pitch: 48, label: "C3" },
            { pitch: 60, label: "C4", tone: "root" },
            { pitch: 69, label: "A4", tone: "target" },
            { pitch: 72, label: "C5" },
            { pitch: 84, label: "C6" },
          ],
        },
        callout: {
          kind: "note",
          text: "Middle C is C4 in the convention this app and most software use. A few older sources call it C3, so a range chart from one world can read an octave out in the other.",
        },
      },
    ],
  },

  "sharps-and-flats": {
    summary:
      "You will understand why the same key can be called two different names, and know when to pick each one.",
    estimatedMinutes: 12,
    keyTerms: [
      { term: "Sharp (♯)", definition: "Raises a note by one half step." },
      { term: "Flat (♭)", definition: "Lowers a note by one half step." },
      { term: "Natural (♮)", definition: "Cancels a previous sharp or flat, returning the note to its plain letter." },
      { term: "Enharmonic", definition: "Two names for the same sounding pitch — F♯ and G♭ are the same key on a piano." },
    ],
    commonMistakes: [
      {
        mistake: "Treating F♯ and G♭ as interchangeable because they sound identical.",
        fix: "They sound identical but mean different things. Spelling follows function: a rising leading tone is a sharp, a falling one is a flat. Wrong spelling makes a page unreadable to a performer.",
      },
      {
        mistake: "Assuming every sharp and flat is a black key.",
        fix: "E♯ is F. C♭ is B. The accidental raises or lowers the letter, and sometimes the result lands on a white key.",
      },
    ],
    listening: [
      {
        piece: "Nocturne in C♯ minor, Op. posth.",
        composer: "Frédéric Chopin",
        why: "Written in sharps. The same music spelled in D♭ minor would need double flats everywhere — a good argument for spelling mattering.",
      },
    ],
    practiceRoutine: [
      "Name the enharmonic twin of five random black keys.",
      "Write out the note a half step above each white key, then a half step below.",
      "Find the two places on the keyboard where two white keys sit adjacent with no black key between them.",
    ],
    extraSections: [
      {
        heading: "Naturals, and How Long an Accidental Lasts",
        body:
          "There is a third accidental. A natural (\u266E) cancels a sharp or a flat and returns the note to its plain letter. You need it to undo an accidental written earlier in the bar, and to undo one the key signature imposed.\n\nAn accidental lasts to the end of the bar it is written in, and applies only to its own octave on its own staff. Write F\u266F on the first beat and every F in that bar is sharp without being marked again; the barline cancels it. An F an octave higher in the same bar is not covered, which is why careful engraving often marks it anyway.\n\nDouble accidentals exist too: a double sharp raises by two half steps, a double flat lowers by two. They look like overkill and they are necessary \u2014 the leading tone of G\u266F minor is F double sharp, and writing G instead would give the scale two Gs and no F at all.",
        example: "F\u266F then F\u266E \u00b7 the barline cancels \u00b7 F double sharp sounds as G but is spelled F",
        figure: {
          kind: "staff",
          caption: "The natural cancels the sharp; the sharp returns when it is written again",
          key: "C",
          hideMeter: true,
          notes: [
            { pitch: 66, spell: 1, label: "m2", accent: true },
            { pitch: 65, spell: 0, accent: true },
            { pitch: 64 },
            { pitch: 66, spell: 1 },
          ],
        },
        callout: {
          kind: "warning",
          text: "An accidental does not carry across a barline, and does not carry into other octaves. Both are routine sources of wrong notes in rehearsal.",
        },
      },
      {
        heading: "Spelling Is a Message to the Performer",
        body: "A performer reads ahead and predicts. When you spell a rising chromatic line with sharps, their eye reads 'this is going up' before their fingers arrive. Spell the same line with flats and you have told them the opposite. On an instrument with no fixed pitch — a violin, a voice — this can even change the intonation a player chooses.",
        callout: {
          kind: "warning",
          text: "Notation software will happily let you write B♯♯. Your players will not thank you.",
        },
      },
    ],
  },

  "whole-and-half-steps": {
    summary:
      "You will be able to build any scale from scratch once you know its step pattern — no memorising required.",
    estimatedMinutes: 12,
    keyTerms: [
      { term: "Half step (semitone)", definition: "The smallest distance in Western music — one key to the very next key, black or white." },
      { term: "Whole step (tone)", definition: "Two half steps — the distance from C to D, or from E to F♯. On a keyboard it usually skips one key." },
      { term: "Step pattern", definition: "The ordered sequence of whole and half steps that defines a scale's character." },
    ],
    commonMistakes: [
      {
        mistake: "Assuming a whole step always means 'skip the black key'.",
        fix: "Between E and F, and between B and C, there is no black key at all — those are natural half steps. E to F♯ is the whole step.",
      },
      {
        mistake: "Counting steps on the staff, where every line-to-space move looks identical.",
        fix: "The staff hides step size: E to F and F to G occupy the same space on the page and are a half step and a whole step. Count on a keyboard, or count semitones, until the two natural half steps are memorised.",
      },
    ],
    listening: [
      {
        piece: "Jaws, main theme",
        composer: "John Williams",
        why: "Two notes, a half step apart, repeated. The smallest interval in the system carrying an entire film's dread.",
      },
      {
        piece: "Whole Tone Étude (Prelude: Voiles)",
        composer: "Claude Debussy",
        why: "A scale of nothing but whole steps. With every step identical, the music loses its sense of home entirely.",
      },
    ],
    practiceRoutine: [
      "Play a half step in ten different places on the keyboard.",
      "Play a whole step starting from every white key and name where you land.",
      "Find the two natural half steps by ear alone.",
    ],
    extraSections: [
      {
        heading: "The Two Natural Half Steps",
        body:
          "Between most pairs of adjacent letters there is a black key, so the distance is a whole step. Two pairs have no black key between them, and those are half steps: E to F, and B to C.\n\nThose two gaps are the whole reason the keyboard looks the way it does \u2014 the black keys fall into groups of two and three because of where the gaps are. They are also why the major scale pattern has its half steps at degrees 3\u20134 and 7\u20138: play the white keys from C to C and the pattern comes out for free.\n\nMemorise the two and you never have to count again. Everything else between adjacent letters is a whole step.",
        example: "E\u2013F and B\u2013C are half steps \u00b7 C\u2013D, D\u2013E, F\u2013G, G\u2013A and A\u2013B are whole",
        figure: {
          kind: "keyboard",
          caption: "No black key between E and F, or between B and C",
          from: 60,
          to: 72,
          marks: [
            { pitch: 64, label: "E", tone: "step" },
            { pitch: 65, label: "F", tone: "step" },
            { pitch: 71, label: "B", tone: "step" },
            { pitch: 72, label: "C", tone: "step" },
          ],
          brackets: [
            { from: 64, to: 65, text: "half" },
            { from: 71, to: 72, text: "half" },
          ],
        },
      },
    ],
  },

  "note-values-and-rests": {
    summary:
      "You will be able to read and write rhythm in proportion — and know why silence is written as carefully as sound.",
    estimatedMinutes: 12,
    keyTerms: [
      { term: "Beat", definition: "The steady pulse you tap your foot to." },
      { term: "Whole / half / quarter note", definition: "Notes in a halving relationship: each is worth half the one above it." },
      { term: "Dot", definition: "Adds half of the note's own value. A dotted half is three beats in common time." },
      { term: "Tie", definition: "Joins two notes of the same pitch into a single longer sound, often across a barline." },
    ],
    commonMistakes: [
      {
        mistake: "Writing rests as an afterthought, or leaving beats unaccounted for.",
        fix: "Every bar must add up exactly. A missing beat is not artistic licence — it is a bar a performer cannot count.",
      },
      {
        mistake: "Treating rests as empty space rather than as material.",
        fix: "A rest is a rhythmic event. Silence placed on a strong beat is one of the loudest things you can write.",
      },
    ],
    listening: [
      {
        piece: "Symphony No. 5, opening",
        composer: "Ludwig van Beethoven",
        why: "The most famous motif in music starts with a rest. That eighth of silence is why the figure lurches rather than marches.",
      },
    ],
    practiceRoutine: [
      "Clap a four-beat bar as quarters, then halves, then whole — feel the proportion.",
      "Write four bars of rhythm and check each one adds to exactly four beats.",
      "Take one of those bars and replace a note with a rest. Clap both versions.",
    ],
    extraSections: [
      {
        heading: "Dots and Ties",
        body:
          "Halving is not enough on its own. Every value is half the one before it, so the system can write one beat and half a beat and never three halves of a beat \u2014 and three halves of a beat is one of the commonest rhythms in music.\n\nA dot after a note adds half of that note's value again. A dotted half is three beats rather than two, a dotted quarter is one and a half, a dotted eighth is three quarters of a beat. A second dot adds half of the first: a double-dotted half is three and a half beats. Rests take dots the same way.\n\nA tie joins two notes of the same pitch into one longer sound, which is how a note crosses a barline or reaches a length no single value and dot can write. A tie is not a slur: a slur joins different pitches and asks for phrasing, while a tie joins the same pitch and asks for one sound.",
        example: "quarter = 1 beat \u00b7 dotted quarter = 1\u00bd \u00b7 half = 2 \u00b7 dotted half = 3 \u00b7 double-dotted half = 3\u00bd",
        figure: {
          kind: "rhythm",
          caption: "A dotted quarter takes one and a half beats, so the eighth after it lands off the beat",
          meter: { beats: 4, unit: 4 },
          row: [
            { duration: 6, label: "dotted", accent: true },
            { duration: 2 },
            { duration: 4 },
            { duration: 4 },
            { duration: 12, label: "dotted", accent: true },
            { duration: 4 },
          ],
        },
        callout: {
          kind: "note",
          text: "A dot adds half of what it follows, not half a beat. A dot on an eighth note adds a sixteenth.",
        },
      },
    ],
  },

  "time-signatures": {
    summary:
      "You will be able to choose a meter that fits the music you hear in your head, rather than defaulting to 4/4 forever.",
    estimatedMinutes: 14,
    keyTerms: [
      { term: "Time signature", definition: "Two stacked numbers: how many beats per bar, and what kind of note gets the beat." },
      { term: "Simple meter", definition: "The beat divides into two — 2/4, 3/4, 4/4." },
      { term: "Compound meter", definition: "The beat divides into three — 6/8, 9/8, 12/8. Counted in dotted beats." },
      { term: "Downbeat", definition: "The first beat of a bar, the strongest by default." },
    ],
    commonMistakes: [
      {
        mistake: "Reading 6/8 as 'six beats in a bar'.",
        fix: "It is normally two beats, each divided into three. Count it in two and it swings; count it in six and it plods.",
      },
      {
        mistake: "Choosing 4/4 by habit for music that naturally lilts.",
        fix: "If your melody keeps wanting to land on a third beat, try 3/4. Meter should describe the music, not fight it.",
      },
    ],
    listening: [
      {
        piece: "Take Five",
        composer: "Paul Desmond / Dave Brubeck Quartet",
        why: "5/4 that grooves. Proof that an odd meter need not sound like an academic exercise.",
      },
      {
        piece: "Danse Macabre",
        composer: "Camille Saint-Saëns",
        why: "3/4 driven so hard it becomes a skeletal waltz — meter as characterisation.",
      },
    ],
    practiceRoutine: [
      "Count a favourite song in 2, in 3, and in 4. Notice which one stops feeling like effort.",
      "Write one bar of rhythm and rewrite it in three different meters.",
      "Tap 6/8 in two, then in six, and hear the character change.",
    ],
    extraSections: [
      {
        heading: "Simple and Compound",
        body:
          "The top number does not always tell you how many beats you will feel. 6/8 has six eighth notes in a bar, and almost nobody counts six \u2014 they count two, each divided into three. That is the difference between simple and compound metre, and it is the one thing the time signature does not say outright.\n\nIn a simple metre the beat divides into two: 2/4, 3/4 and 4/4 all have beats that split into eighths in pairs. In a compound metre the beat divides into three, and the signature counts the divisions rather than the beats \u2014 6/8 is two beats of three, 9/8 is three, 12/8 is four. The beat itself is a dotted quarter, which is exactly why no simple signature can describe it.\n\nSo read 6/8 as two, and 3/4 as three, and notice that both hold six eighth notes. The notes are the same; the grouping is the music.",
        example: "3/4 = three beats of two \u00b7 6/8 = two beats of three \u00b7 both hold six eighths",
        figure: {
          kind: "rhythm",
          caption: "6/8: six eighths, but the accents fall in two groups of three",
          meter: { beats: 6, unit: 8 },
          row: [
            { duration: 2, label: "1", accent: true },
            { duration: 2 },
            { duration: 2 },
            { duration: 2, label: "2", accent: true },
            { duration: 2 },
            { duration: 2 },
          ],
        },
        callout: {
          kind: "insight",
          text: "A piece that shifts between 6/8 and 3/4 keeps the same number of eighth notes and changes how many beats they make. That is a hemiola, and it is one of the oldest rhythmic tricks there is.",
        },
      },
      {
        heading: "Meter Is a Promise",
        body: "The moment a listener identifies your meter, they begin predicting. Every strong beat they expect is a small bet they place, and your music either pays it or refuses. Syncopation, hemiola and the sudden 5/4 bar are all interesting only because the meter set the expectation first. A composer with no meter has nothing to subvert.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Scales, intervals, chords
  // -------------------------------------------------------------------------
  "major-scales": {
    summary:
      "You will be able to construct a major scale on any note using one pattern, and understand why key signatures exist at all.",
    estimatedMinutes: 15,
    keyTerms: [
      { term: "Major scale", definition: "The step pattern W–W–H–W–W–W–H. Every major scale in every key uses it." },
      { term: "Tonic", definition: "The first note of the scale — the note the music treats as home." },
      { term: "Leading tone", definition: "The seventh degree, a half step below the tonic. It leans upward hard." },
      { term: "Key signature", definition: "The sharps or flats printed once at the start, so you don't rewrite them every bar." },
    ],
    commonMistakes: [
      {
        mistake: "Building a scale by ear and then spelling it with whatever accidental is convenient.",
        fix: "Use each letter name exactly once. G major is F♯, never G♭ — otherwise you would have two Gs and no F.",
      },
      {
        mistake: "Learning the pattern as 'whole whole half whole whole whole half' without noticing where the half steps fall.",
        fix: "Learn it by position instead: the half steps are between degrees 3-4 and 7-8. That is two facts, it works from any starting note, and it explains why the leading tone pulls home.",
      },
    ],
    listening: [
      {
        piece: "Do-Re-Mi (The Sound of Music)",
        composer: "Richard Rodgers",
        why: "A major scale, sung as a teaching device, that somehow became a great song.",
      },
      {
        piece: "Ode to Joy, Symphony No. 9",
        composer: "Ludwig van Beethoven",
        why: "A melody built almost entirely of stepwise motion inside one major scale. Simple materials, enormous result.",
      },
    ],
    practiceRoutine: [
      "Build C, G and F major by pattern, saying each step type aloud.",
      "Build the scale on a note you find awkward — E♭ or B — and check every letter appears once.",
      "Sing the scale, stop on the seventh degree, and feel the pull upward.",
    ],
    extraSections: [
      {
        heading: "Key Signatures",
        body:
          "Apply the pattern starting on G and the seventh note comes out as F\u266F. That sharp is not an accident of the moment \u2014 it belongs to the key, and every F in a piece in G major is sharp unless something says otherwise. Writing an accidental in front of each one would be exhausting to read and easy to get wrong.\n\nSo the sharps and flats a key needs are collected at the front of every staff, just after the clef, as the key signature. One sharp means G major, two means D; one flat means F major, two means B\u266D. The signature applies for the whole piece, in every octave, until it changes.\n\nWhich accidentals appear, and in which order, is not arbitrary: sharps arrive F C G D A E B, and flats arrive in exactly the reverse, B E A D G C F. That order is the circle of fifths, which is the next lesson.",
        example: "G major: one sharp (F\u266F) \u00b7 D major: two (F\u266F C\u266F) \u00b7 F major: one flat (B\u266D)",
        figure: {
          kind: "staff",
          caption: "G major \u2014 the F\u266F lives in the key signature, so it is never written as an accidental",
          key: "G",
          mode: "major",
          hideMeter: true,
          hideBarlines: true,
          notes: [
            { pitch: 55 },
            { pitch: 57 },
            { pitch: 59 },
            { pitch: 60 },
            { pitch: 62 },
            { pitch: 64 },
            { pitch: 66, label: "m2", accent: true },
            { pitch: 67 },
          ],
        },
      },
    ],
  },

  "minor-scales": {
    summary:
      "You will know the three minor scales, why there are three, and which one to reach for when writing.",
    estimatedMinutes: 16,
    keyTerms: [
      { term: "Natural minor", definition: "W–H–W–W–H–W–W. The plain minor, with a flat seventh and no leading tone." },
      { term: "Harmonic minor", definition: "Natural minor with the seventh raised, restoring the leading tone for a strong cadence." },
      { term: "Melodic minor", definition: "Sixth and seventh raised going up, natural coming down — smoothing the gap harmonic minor creates." },
      { term: "Relative minor", definition: "The minor key sharing a key signature with a major key, starting on its sixth degree." },
    ],
    commonMistakes: [
      {
        mistake: "Picking one minor scale and using it rigidly for a whole piece.",
        fix: "Real minor-key writing moves between all three. Use harmonic minor at cadences, natural minor for descending lines, melodic minor when a rising melody would otherwise stumble.",
      },
      {
        mistake: "Writing the augmented second of harmonic minor into a melody by accident.",
        fix: "That jump from ♭6 to ♯7 is a distinctive, exotic sound. Use it deliberately or avoid it — never let it appear because you forgot it was there.",
      },
    ],
    listening: [
      {
        piece: "Symphony No. 40, first movement",
        composer: "W. A. Mozart",
        why: "G minor at its most urgent, moving fluidly between the minor forms as the line demands.",
      },
      {
        piece: "Hungarian Dance No. 5",
        composer: "Johannes Brahms",
        why: "The harmonic-minor augmented second used as a flavour, not an accident.",
      },
    ],
    practiceRoutine: [
      "Write A natural minor, then raise the seventh and play both.",
      "Play melodic minor up and down and notice the descending change.",
      "Find the relative minor of three major keys by counting to the sixth degree.",
    ],
    extraSections: [
      {
        heading: "Harmonic and Melodic Minor",
        body:
          "Natural minor has a problem. Its seventh degree sits a whole step below the tonic, so it does not lean home the way a major scale's seventh does, and the chord built on it is minor rather than a dominant. A minor-key phrase written strictly in natural minor has no cadence with any pull in it.\n\nHarmonic minor fixes that by raising the seventh degree a half step: in A minor the G becomes G\u266F. The leading tone is back, V becomes a major chord, and V\u2013i works. The cost is the gap it leaves between the sixth and seventh degrees \u2014 F to G\u266F is three semitones, an augmented second, which is awkward to sing.\n\nMelodic minor fixes that in turn by raising the sixth as well on the way up, and traditionally lowering both again coming down, so the descent is plain natural minor. Three forms, one key, and composers mix them freely inside a single phrase.",
        example: "A natural: A B C D E F G \u00b7 A harmonic: A B C D E F G\u266F \u00b7 A melodic rising: A B C D E F\u266F G\u266F",
        figure: {
          kind: "staff",
          caption: "A harmonic minor \u2014 the raised seventh is a half step from home",
          key: "A",
          mode: "minor",
          hideMeter: true,
          hideBarlines: true,
          notes: [
            { pitch: 57 },
            { pitch: 59 },
            { pitch: 60 },
            { pitch: 62 },
            { pitch: 64 },
            { pitch: 65 },
            { pitch: 68, spell: 1, label: "m2", accent: true },
            { pitch: 69 },
          ],
          brackets: [{ from: 5, to: 6, text: "augmented 2nd" }],
        },
        callout: {
          kind: "insight",
          text: "The raised seventh is not a different key. It is an accidental inside the minor key, which is why minor-key music is full of sharps the key signature never mentions.",
        },
      },
    ],
  },

  "basic-intervals": {
    summary:
      "You will be able to name the distance between any two notes, and know which distances sound stable and which want to move.",
    estimatedMinutes: 16,
    keyTerms: [
      { term: "Interval", definition: "The distance between two pitches, named by number and quality — a major third, a perfect fifth." },
      { term: "Consonance", definition: "An interval that sounds settled: unisons, octaves, fifths, thirds, sixths." },
      { term: "Dissonance", definition: "An interval that sounds unsettled and wants resolution: seconds, sevenths, the tritone." },
      { term: "Tritone", definition: "Three whole steps. The most unstable interval in tonal music, and the engine of the dominant chord." },
    ],
    commonMistakes: [
      {
        mistake: "Counting half steps to identify an interval, then guessing the name.",
        fix: "Count letter names first for the number (C to E is a third because C-D-E is three letters), then check quality. Half-step counting alone cannot distinguish an augmented second from a minor third.",
      },
      {
        mistake: "Treating dissonance as a mistake to be avoided.",
        fix: "Dissonance is the source of motion. A piece of pure consonance has nowhere to go and nothing to resolve.",
      },
    ],
    listening: [
      {
        piece: "Maria (West Side Story)",
        composer: "Leonard Bernstein",
        why: "The melody opens with a tritone that immediately resolves upward — dissonance used as longing.",
      },
      {
        piece: "Somewhere Over the Rainbow",
        composer: "Harold Arlen",
        why: "That opening octave leap is the whole song's character in two notes.",
      },
    ],
    practiceRoutine: [
      "Play a perfect fifth and a tritone back to back until the difference is obvious without thinking.",
      "Name the interval between five random pairs of notes, letters first.",
      "Sing a major third, then a minor third, and label which songs each one reminds you of.",
    ],
    extraSections: [
      {
        heading: "Number and Quality",
        body:
          "Counting letters gives you half of an interval's name. C to E and C to E\u266D are both thirds \u2014 three letters either way \u2014 and they are not the same distance or the same sound. The other half is quality.\n\nSeconds, thirds, sixths and sevenths come in major and minor, a half step apart: C to E is a major third at four semitones, C to E\u266D a minor third at three. Unisons, fourths, fifths and octaves are called perfect instead, because each has only one diatonic size. Widen any interval by a half step and it is augmented; narrow it and it is diminished.\n\nThe one worth knowing by name is six semitones \u2014 the tritone, an augmented fourth or a diminished fifth depending on spelling. It is the most unstable interval in tonal music, and it is why the dominant seventh chord pulls home as hard as it does.",
        example: "C\u2192E major 3rd (4) \u00b7 C\u2192E\u266D minor 3rd (3) \u00b7 C\u2192G perfect 5th (7) \u00b7 C\u2192F\u266F tritone (6)",
        figure: {
          kind: "staff",
          caption: "Same number, different quality \u2014 then the tritone",
          key: "C",
          hideMeter: true,
          hideBarlines: true,
          notes: [
            { pitch: 60, label: "M3" },
            { pitch: 64 },
            { pitch: 60, label: "m3" },
            { pitch: 63, spell: -1 },
            { pitch: 60, label: "P5" },
            { pitch: 67 },
            { pitch: 60, label: "TT", accent: true },
            { pitch: 66, spell: 1, accent: true },
          ],
        },
        callout: {
          kind: "warning",
          text: "Counting semitones alone cannot name an interval. Three semitones is a minor third from C to E\u266D and an augmented second from C to D\u266F \u2014 the same sound, a different name, and the difference decides how it is written and resolved.",
        },
      },
    ],
  },

  "triads-major-minor": {
    summary:
      "You will be able to build and hear the four triad types, and understand why stacking thirds is the foundation of Western harmony.",
    estimatedMinutes: 15,
    keyTerms: [
      { term: "Triad", definition: "Three notes stacked in thirds: root, third, fifth." },
      { term: "Major triad", definition: "Major third on the bottom, minor third on top. Bright, settled." },
      { term: "Minor triad", definition: "Minor third on the bottom, major third on top. Darker, equally settled." },
      { term: "Diminished triad", definition: "Two minor thirds. Contains a tritone; deeply unstable." },
    ],
    commonMistakes: [
      {
        mistake: "Thinking minor means sad and major means happy.",
        fix: "Context decides. Plenty of funeral music is in major and plenty of dance music is in minor. The quality is a colour, not an emotion.",
      },
      {
        mistake: "Spelling a triad by counting semitones, so that C minor comes out as C, D♯, G.",
        fix: "A triad is always root, third and fifth by letter name: C, E, G — then flatten the E for minor. D♯ and E♭ sound the same, but writing D♯ gives the chord two Ds and no E, and every reader has to decode it.",
      },
    ],
    listening: [
      {
        piece: "Canon in D",
        composer: "Johann Pachelbel",
        why: "Nothing but triads, moving in a fixed pattern, and it has outlived nearly everything written since.",
      },
    ],
    practiceRoutine: [
      "Build a major triad on every white key and note which ones need accidentals.",
      "Convert each one to minor by lowering the third.",
      "Play major, minor, diminished and augmented in a row and name them with your eyes shut.",
    ],
    extraSections: [
      {
        heading: "Diminished and Augmented",
        body:
          "Two stacked thirds give four possible triads, not two, because each third can be major or minor independently of the other.\n\nMajor is a major third then a minor: C E G. Minor is a minor third then a major: C E\u266D G. Diminished is two minor thirds: C E\u266D G\u266D \u2014 its outer interval is a diminished fifth, which is the tritone, and it sounds unstable because it is. Augmented is two major thirds: C E G\u266F, whose outer interval is an augmented fifth, and which sounds suspended rather than tense.\n\nYou meet the diminished triad immediately: it is the chord on the seventh degree of every major key, the vii\u00b0 in the family above. Augmented triads are rarer in diatonic writing and turn up in minor keys and in chromatic harmony.",
        example: "C E G major \u00b7 C E\u266D G minor \u00b7 C E\u266D G\u266D diminished \u00b7 C E G\u266F augmented",
        figure: {
          kind: "staff",
          caption: "Four triads on C, in order of shrinking fifth",
          key: "C",
          hideMeter: true,
          hideBarlines: true,
          notes: [
            { pitch: 60, duration: 8, label: "major" },
            { pitch: 64, duration: 8, stack: true },
            { pitch: 67, duration: 8, stack: true },
            { pitch: 60, duration: 8, label: "minor" },
            { pitch: 63, duration: 8, spell: -1, stack: true },
            { pitch: 67, duration: 8, stack: true },
            { pitch: 60, duration: 8, label: "dim", accent: true },
            { pitch: 63, duration: 8, spell: -1, stack: true, accent: true },
            { pitch: 66, duration: 8, spell: -1, stack: true, accent: true },
            { pitch: 60, duration: 8, label: "aug" },
            { pitch: 64, duration: 8, stack: true },
            { pitch: 68, duration: 8, spell: 1, stack: true },
          ],
          harmony: [{ at: 0, text: "I" }],
        },
      },
    ],
  },

  "basic-progressions": {
    summary:
      "You will understand why some chord successions feel inevitable and others feel random, and be able to write a progression that goes somewhere.",
    estimatedMinutes: 18,
    keyTerms: [
      { term: "Roman numerals", definition: "Chord labels relative to the key: I, ii, IV, V. Uppercase major, lowercase minor." },
      { term: "Tonic function", definition: "Chords that feel like home: I, and to a lesser extent vi and iii." },
      { term: "Dominant function", definition: "Chords that pull hard back to tonic: V and vii°." },
      { term: "Predominant function", definition: "Chords that set up the dominant: ii and IV." },
    ],
    commonMistakes: [
      {
        mistake: "Choosing chords because they sound nice individually.",
        fix: "Progressions work by function, not by beauty. Tonic → predominant → dominant → tonic is a shape, and the shape is what makes it feel purposeful.",
      },
      {
        mistake: "Landing on the tonic at the end of every phrase.",
        fix: "Constant resolution kills momentum. Let some phrases end on the dominant — an unanswered question is what makes the listener stay.",
      },
    ],
    listening: [
      {
        piece: "Let It Be",
        composer: "Lennon–McCartney",
        why: "I–V–vi–IV, endlessly. A textbook demonstration that function beats novelty.",
      },
      {
        piece: "Prelude in C minor, WTC Book I",
        composer: "J. S. Bach",
        why: "Relentless harmonic motion where every chord is clearly doing a job.",
      },
    ],
    practiceRoutine: [
      "Write I–IV–V–I in three keys and play them.",
      "Replace the IV with ii and listen to what changed.",
      "End a phrase on V instead of I and notice the question it leaves open.",
    ],
    extraSections: [
      {
        heading: "The Grammar Analogy Actually Works",
        body: "Tonic is a statement, predominant is the setup, dominant is the tension before the full stop. Progressions that ignore function sound like sentences with the words shuffled: every word is fine, and the whole thing means nothing. This is why I–V–vi–IV works in a thousand songs and vi–iii–IV–I usually needs help.",
        callout: {
          kind: "insight",
          text: "When a progression sounds aimless, check whether anything is functioning as a dominant. Usually nothing is.",
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Writing melody
  // -------------------------------------------------------------------------
  "melody-writing": {
    summary:
      "You will be able to write a melody with shape and direction rather than a string of pleasant notes.",
    estimatedMinutes: 20,
    keyTerms: [
      { term: "Contour", definition: "The overall shape of a melody's rise and fall — its silhouette." },
      { term: "Climax", definition: "The melody's highest or most intense point. Most good melodies have exactly one." },
      { term: "Step and leap", definition: "Motion by adjacent scale degrees versus larger jumps. Melodies need both, mostly steps." },
      { term: "Range", definition: "The distance from the lowest to the highest note. A singable melody usually sits within about an octave and a half." },
    ],
    commonMistakes: [
      {
        mistake: "Writing melodies that wander without ever peaking.",
        fix: "Decide where the highest note goes before you write, and save it. A climax used in bar 2 has nothing left for bar 16.",
      },
      {
        mistake: "Leaping repeatedly in the same direction.",
        fix: "After a large leap, step back the other way. This is not a rule for its own sake — it is how melodies stay singable.",
      },
    ],
    listening: [
      {
        piece: "Nimrod, Enigma Variations",
        composer: "Edward Elgar",
        why: "A slow, patient rise to a single climax, then release. The shape is the entire emotional content.",
      },
      {
        piece: "Yesterday",
        composer: "Lennon–McCartney",
        why: "Small range, mostly stepwise, one well-placed leap. Nothing wasted.",
      },
    ],
    practiceRoutine: [
      "Draw a melodic contour as a line on paper before writing a single note.",
      "Write eight bars that reach their highest note in bar 6.",
      "Sing what you wrote. If you cannot, it is not yet a melody.",
    ],
    extraSections: [
      {
        heading: "The Harmony Underneath",
        body:
          "Contour decides whether a line has shape. What decides whether it has sense is the chord it is sitting on.\n\nPut chord tones on the strong beats and anything in between can be a passing or neighbour note. A melody built this way outlines the harmony while sounding free of it, which is why a good tune can be recognised from the tune alone \u2014 the chords are already implied in it. Put non-chord tones on the strong beats instead and the line will sound like a mistake unless you resolve each one deliberately.\n\nThe other practical constraint is range. Most memorable tunes live inside a ninth or a tenth, because that is what a human voice does comfortably, and a melody that spans two octaves is usually two melodies that have not been separated yet.",
        example: "Over C: strong beats on C, E or G \u00b7 D and F passing between them",
        figure: {
          kind: "staff",
          caption: "Chord tones on the strong beats, passing notes off them",
          key: "C",
          grandStaff: true,
          notes: [
            // The chords first, so the harmony claims below can point at them.
            { pitch: 48, duration: 16, staff: 1, at: 0 },
            { pitch: 52, duration: 16, staff: 1, at: 0 },
            { pitch: 55, duration: 16, staff: 1, at: 0 },
            { pitch: 43, duration: 16, staff: 1, at: 16 },
            { pitch: 47, duration: 16, staff: 1, at: 16 },
            { pitch: 50, duration: 16, staff: 1, at: 16 },
            // The tune: beats one and three carry chord tones, the eighths
            // between them do not.
            { pitch: 60, duration: 4, accent: true },
            { pitch: 62, duration: 2 },
            { pitch: 64, duration: 2 },
            { pitch: 67, duration: 4, accent: true },
            { pitch: 65, duration: 2 },
            { pitch: 64, duration: 2 },
            { pitch: 67, duration: 4, accent: true },
            { pitch: 65, duration: 2 },
            { pitch: 64, duration: 2 },
            { pitch: 62, duration: 8, accent: true },
          ],
          harmony: [
            { at: 0, text: "I" },
            { at: 3, text: "V" },
          ],
        },
        callout: {
          kind: "insight",
          text: "If you cannot hear the chords when somebody sings your tune unaccompanied, the strong beats are probably not carrying chord tones.",
        },
      },
    ],
  },

  "phrases-question-answer": {
    summary:
      "You will be able to write melodies that breathe in balanced pairs, and know when to break the symmetry deliberately.",
    estimatedMinutes: 16,
    keyTerms: [
      { term: "Phrase", definition: "A musical thought that ends with a sense of punctuation — usually four bars." },
      { term: "Antecedent", definition: "The opening phrase — the question. Ends unresolved, often on the dominant." },
      { term: "Consequent", definition: "The answering phrase. Usually starts the same and ends resolved." },
      { term: "Period", definition: "An antecedent and consequent taken together as one balanced unit." },
    ],
    commonMistakes: [
      {
        mistake: "Writing an answer that shares nothing with the question.",
        fix: "The answer should begin recognisably like the question and differ at the end. Complete contrast is a new idea, not an answer.",
      },
      {
        mistake: "Making every phrase exactly four bars forever.",
        fix: "Perfect symmetry becomes predictable fast. Extend a phrase to five or six bars at a structural moment and the listener sits up.",
      },
    ],
    listening: [
      {
        piece: "Piano Sonata No. 16 in C, K. 545, opening",
        composer: "W. A. Mozart",
        why: "The clearest question-and-answer period in the repertoire. You can hear the comma and the full stop.",
      },
    ],
    practiceRoutine: [
      "Write a four-bar phrase ending on the dominant.",
      "Answer it with four bars that begin identically and end on the tonic.",
      "Now rewrite the answer as six bars and hear what the extra space does.",
    ],
    extraSections: [
      {
        heading: "The Sentence, and Phrases That Are Not Four Bars",
        body:
          "The period is one way to build eight bars. The other is the sentence, and it is built from a different logic: a two-bar idea, the same idea repeated or transposed, then four bars of continuation that fragment it and drive to a cadence. Two plus two plus four.\n\nThe difference matters when you are writing. A period answers; a sentence accelerates. A period's two halves are roughly equal, while a sentence gets shorter and busier as it goes, which is why it generates momentum rather than symmetry.\n\nAnd four bars is a default, not a law. Phrases can be extended by repeating a cadence, interrupted by a deceptive one, or compressed by overlapping the end of one with the start of the next \u2014 an elision, where the final bar of a phrase is also the first bar of the one after it.",
        example: "Period: 4 + 4, question and answer \u00b7 Sentence: 2 + 2 + 4, idea, echo, drive",
        figure: {
          kind: "form",
          caption: "Two ways to fill eight bars",
          sections: [
            { label: "idea", bars: 2, tone: "a", note: "the basic idea" },
            { label: "idea'", bars: 2, tone: "a", note: "repeated or transposed" },
            { label: "continuation", bars: 4, tone: "b", note: "fragmented, driving to the cadence" },
          ],
        },
        callout: {
          kind: "note",
          text: "Beethoven's Fifth opens with a sentence, not a period. The four-note idea is stated, repeated a step lower, and then fragmented \u2014 which is why the opening drives instead of balancing.",
        },
      },
    ],
  },

  "motifs-repetition-variation": {
    summary:
      "You will be able to build a long piece from a short idea — the single most useful compositional skill there is.",
    estimatedMinutes: 20,
    keyTerms: [
      { term: "Motif", definition: "The smallest recognisable musical idea — often just two to five notes." },
      { term: "Sequence", definition: "Repeating a motif at a different pitch level, usually stepwise up or down." },
      { term: "Inversion", definition: "Flipping a motif's intervals upside down: what rose now falls." },
      { term: "Augmentation / diminution", definition: "Stretching or compressing a motif's rhythm while keeping its shape." },
    ],
    commonMistakes: [
      {
        mistake: "Introducing a new idea whenever the music needs to continue.",
        fix: "Continuation is almost always transformation. A piece with six ideas usually sounds worse than a piece with one idea heard six ways.",
      },
      {
        mistake: "Repeating a motif identically until it wears out.",
        fix: "Change one parameter each time — pitch level, rhythm, direction, harmony underneath. Recognition plus difference is the whole trick.",
      },
    ],
    listening: [
      {
        piece: "Symphony No. 5, first movement",
        composer: "Ludwig van Beethoven",
        why: "Four notes, seven minutes. The definitive proof that material matters less than treatment.",
      },
      {
        piece: "Boléro",
        composer: "Maurice Ravel",
        why: "One melody, one rhythm, fifteen minutes, no development at all — the exception that shows how strong the rule is.",
      },
    ],
    practiceRoutine: [
      "Write a four-note motif, then write it again inverted, in retrograde, and transposed up a third.",
      "Produce six variations: sequence up, sequence down, invert, augment, diminish, reharmonise.",
      "Assemble the best four into sixteen bars that sound intentional.",
    ],
    extraSections: [
      {
        heading: "Recognition Is the Whole Point",
        body: "A listener enjoys music partly by predicting it. A motif gives them something to hold; every transformation is a chance for them to notice 'that's the same idea, changed.' That flash of recognition is a large part of what people mean when they say a piece is satisfying. Too little repetition and there is nothing to recognise; too much and there is nothing to notice.",
      },
    ],
  },

  "cadences-and-accompaniment": {
    summary:
      "You will be able to end a phrase convincingly, and support a melody without burying it.",
    estimatedMinutes: 18,
    keyTerms: [
      { term: "Authentic cadence", definition: "V–I. The full stop of tonal music. Strongest when both chords are in root position and the melody lands on the tonic." },
      { term: "Half cadence", definition: "A phrase ending on V. A comma, not a full stop." },
      { term: "Plagal cadence", definition: "IV–I. Gentler than authentic — the 'Amen' ending." },
      { term: "Deceptive cadence", definition: "V–vi. Sets up a full stop and delivers something else." },
      { term: "Texture", definition: "How accompaniment is arranged — block chords, broken chords, arpeggios, sustained pads." },
    ],
    commonMistakes: [
      {
        mistake: "Using an authentic cadence at the end of every phrase.",
        fix: "Save the strongest cadence for the most important arrival. If everything is a full stop, nothing is.",
      },
      {
        mistake: "Writing accompaniment in the same register as the melody.",
        fix: "Give the melody its own space. Accompaniment that crowds the tune makes both harder to hear.",
      },
    ],
    listening: [
      {
        piece: "Ave Verum Corpus, K. 618",
        composer: "W. A. Mozart",
        why: "Cadence after cadence, each weighted differently. A masterclass in punctuation.",
      },
      {
        piece: "Moonlight Sonata, first movement",
        composer: "Ludwig van Beethoven",
        why: "A single accompaniment figure sustained for an entire movement without ever obscuring the melody.",
      },
    ],
    practiceRoutine: [
      "Write the same four-bar phrase four times, ending with each cadence type.",
      "Take one melody and set it with block chords, then broken chords, then arpeggios.",
      "Play the accompaniment alone. If it is more interesting than the melody, rebalance.",
    ],
    extraSections: [
      {
        heading: "What Makes a Cadence Final",
        body:
          "Not every authentic cadence is equally conclusive, and the difference is the one piece of cadence theory that changes how you write.\n\nA perfect authentic cadence needs three things at once: V to I, both chords in root position, and the melody landing on the tonic. Get all three and the music has stopped. Miss any one of them \u2014 an inversion in either chord, or the melody landing on the third or fifth \u2014 and it is an imperfect authentic cadence, which sounds like an ending that is not quite the ending. That is why a piece can cadence six times in its last minute and still be going.\n\nSo the strength of an ending is something you control precisely. Save the perfect authentic cadence for the places where the music really does stop, and use imperfect ones everywhere a phrase needs to breathe without concluding.",
        example: "PAC: V\u2013I, both root position, melody on the tonic \u00b7 IAC: anything less",
        figure: {
          kind: "staff",
          caption: "A perfect authentic cadence \u2014 root position throughout, melody landing on the tonic",
          key: "C",
          grandStaff: true,
          notes: [
            { pitch: 71, duration: 8 },
            { pitch: 67, duration: 8, stack: true },
            { pitch: 62, duration: 8, stack: true },
            { pitch: 55, duration: 8, staff: 1, at: 0 },
            { pitch: 72, duration: 8, accent: true },
            { pitch: 67, duration: 8, stack: true },
            { pitch: 64, duration: 8, stack: true },
            { pitch: 48, duration: 8, staff: 1, at: 8 },
          ],
          harmony: [
            { at: 0, text: "V" },
            { at: 4, text: "I" },
          ],
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Advanced
  // -------------------------------------------------------------------------
  "circle-of-fifths": {
    summary:
      "You will be able to navigate all twenty-four keys, predict key signatures without memorising them, and modulate to any related key with confidence.",
    estimatedMinutes: 20,
    keyTerms: [
      { term: "Circle of fifths", definition: "The keys arranged by perfect fifth, so that adjacent keys differ by exactly one accidental." },
      { term: "Closely related key", definition: "A key one step around the circle, or the relative major/minor. Shares all but one note." },
      { term: "Enharmonic seam", definition: "The point where sharps become flats — F♯ major and G♭ major are the same sounding key, spelled opposite." },
    ],
    commonMistakes: [
      {
        mistake: "Memorising the circle as a picture rather than as a rule.",
        fix: "Each clockwise step adds a sharp and moves up a fifth. Derive it and you can never forget it.",
      },
      {
        mistake: "Treating the sharp keys and the flat keys as two unrelated lists.",
        fix: "They are one circle met from two directions. Going clockwise adds sharps, anticlockwise adds flats, and the two meet at the enharmonic keys — F♯ major and G♭ major are the same six sounds spelled two ways.",
      },
    ],
    listening: [
      {
        piece: "Prelude in E♭, 'Raindrop' companion sequences",
        composer: "Frédéric Chopin",
        why: "Chopin moves around the circle so smoothly that the modulations feel like changes in weather.",
      },
      {
        piece: "Autumn Leaves",
        composer: "Joseph Kosma",
        why: "A jazz standard built on a chain of descending fifths — the circle turned into a tune.",
      },
    ],
    practiceRoutine: [
      "Recite the circle clockwise from C, naming the number of sharps each time.",
      "Do it anticlockwise with flats.",
      "For three random keys, name their closely related keys in five seconds.",
    ],
    extraSections: [
      {
        heading: "Reading a Key Signature Off the Circle",
        body:
          "The circle is not only a map of relationships. It is also the fastest way to name a key signature you are looking at, and to write one you need.\n\nSharps always appear in the same order \u2014 F C G D A E B \u2014 and flats in exactly the reverse, B E A D G C F. Each is the other read backwards, because each is the circle of fifths walked in one direction or the other. So one sharp is F\u266F, two are F\u266F and C\u266F, and so on; you never have to remember which sharps, only how many.\n\nTwo tricks name the key in a second. For sharps, the last sharp is the leading tone, so go up a half step: three sharps ends on G\u266F, and the key is A major. For flats, the second-to-last flat is the key: four flats are B\u266D E\u266D A\u266D D\u266D, and the key is A\u266D major. The relative minor is three half steps below the major in both cases.",
        example: "3 sharps \u2192 last is G\u266F \u2192 A major \u00b7 4 flats \u2192 second-to-last is A\u266D \u2192 A\u266D major",
        figure: {
          kind: "circle",
          caption: "Clockwise adds a sharp, anticlockwise adds a flat; neighbours share six of seven notes",
          highlight: ["C", "G", "D", "F"],
          arrow: { from: "C", to: "G", text: "one sharp" },
        },
        callout: {
          kind: "note",
          text: "The bottom of the circle is where the two directions meet. F\u266F major and G\u266D major are the same six sounds spelled two ways \u2014 six sharps or six flats \u2014 which is the enharmonic seam.",
        },
      },
    ],
  },

  "chord-functions-inversions": {
    summary:
      "You will be able to control your bass line independently of your harmony, which is the difference between chords and voice leading.",
    estimatedMinutes: 22,
    keyTerms: [
      { term: "Inversion", definition: "Which chord tone is in the bass. Root position, first inversion (third in bass), second inversion (fifth in bass)." },
      { term: "Figured bass", definition: "The numbers — 6, 6/4, 6/5 — that describe inversion by the intervals above the bass." },
      { term: "Voice leading", definition: "How individual lines move from chord to chord. Smooth is usually better; parallel fifths and octaves usually are not." },
      { term: "Passing 6/4", definition: "A second-inversion chord used to smooth a stepwise bass, not as a harmony in its own right." },
    ],
    commonMistakes: [
      {
        mistake: "Writing every chord in root position.",
        fix: "The bass becomes a series of leaps and the texture goes rigid. Inversions let the bass line be a melody too.",
      },
      {
        mistake: "Using a 6/4 chord as a stable harmony.",
        fix: "Second inversion is unstable by nature. Use it as a passing chord, a pedal, or the cadential 6/4 — never as a resting point.",
      },
    ],
    listening: [
      {
        piece: "Air on the G String",
        composer: "J. S. Bach",
        why: "The bass line walks in steady steps because the harmony above it keeps changing inversion.",
      },
    ],
    practiceRoutine: [
      "Take a I–IV–V–I progression and rewrite it so the bass moves only by step.",
      "Label every inversion with figured bass.",
      "Check for parallel fifths between outer voices and fix them.",
    ],
    extraSections: [
      {
        heading: "Figured Bass: How Inversions Are Written",
        body:
          "An inversion needs a name on the page, and the name is a number \u2014 inherited from the seventeenth century, when a keyboard player read a bass line with figures under it and worked the chords out on the spot.\n\nThe numbers are the intervals above the bass. A root-position triad is 5/3 and the figures are left out entirely. First inversion, with the third in the bass, is 6/3 and written just 6. Second inversion, with the fifth in the bass, is 6/4. For seventh chords: root position is 7, first inversion 6/5, second 4/3, third 4/2 or just 2.\n\nIn roman-numeral analysis the figure sits beside the numeral, so V6 is a dominant chord with its third in the bass and I6/4 is a tonic with its fifth there. The one to recognise on sight is the cadential 6/4 \u2014 I6/4 falling to V at a cadence, which sounds like a decorated dominant rather than a tonic, because that is what it is.",
        example: "I = root \u00b7 I6 = third in the bass \u00b7 I6/4 = fifth in the bass \u00b7 V6/5 = dominant seventh, third in the bass",
        figure: {
          kind: "staff",
          caption: "One chord, three bass notes \u2014 same identity, different weight",
          key: "C",
          grandStaff: true,
          hideMeter: true,
          notes: [
            { pitch: 72, duration: 8 },
            { pitch: 67, duration: 8, stack: true },
            { pitch: 64, duration: 8, stack: true },
            { pitch: 48, duration: 8, staff: 1, at: 0 },
            { pitch: 72, duration: 8 },
            { pitch: 67, duration: 8, stack: true },
            { pitch: 64, duration: 8, stack: true },
            { pitch: 52, duration: 8, staff: 1, at: 8 },
            { pitch: 72, duration: 8 },
            { pitch: 67, duration: 8, stack: true },
            { pitch: 64, duration: 8, stack: true },
            { pitch: 55, duration: 8, staff: 1, at: 16 },
          ],
          harmony: [{ at: 0, text: "I" }],
        },
      },
    ],
  },

  "modulation-secondary-dominants": {
    summary:
      "You will be able to leave a key convincingly and arrive somewhere new without the seam showing.",
    estimatedMinutes: 24,
    keyTerms: [
      { term: "Modulation", definition: "Changing key in a way the ear accepts as a new home, not a passing colour." },
      { term: "Pivot chord", definition: "A chord belonging to both the old key and the new one, used as the hinge." },
      { term: "Secondary dominant", definition: "A dominant chord borrowed to target a chord other than the tonic — V/V, V/vi, and so on." },
      { term: "Tonicisation", definition: "Briefly treating a non-tonic chord as a temporary home without fully modulating." },
    ],
    commonMistakes: [
      {
        mistake: "Modulating by simply starting to play in a new key.",
        fix: "Without a pivot or a dominant preparation, the ear hears a mistake rather than a journey. Prepare the arrival.",
      },
      {
        mistake: "Confusing tonicisation with modulation.",
        fix: "One secondary dominant colours a chord. A modulation needs a cadence in the new key to make it stick.",
      },
    ],
    listening: [
      {
        piece: "Piano Sonata in A, K. 331, third movement",
        composer: "W. A. Mozart",
        why: "Clean, textbook modulations you can hear arriving.",
      },
      {
        piece: "God Only Knows",
        composer: "Brian Wilson",
        why: "Constant tonicisation that keeps the key ambiguous — modulation used as an emotional device rather than a structural one.",
      },
    ],
    practiceRoutine: [
      "Modulate from C major to G major using a pivot chord, and label the pivot in both keys.",
      "Write a phrase using V/V and resolve it properly.",
      "Modulate to the relative minor and cadence there so it sticks.",
    ],
    extraSections: [
      {
        heading: "Tonicisation Is Not Modulation",
        body:
          "A secondary dominant points at a chord that is not the tonic and treats it, for one moment, as though it were. In C major, D7 is the dominant of G \u2014 written V/V, said \"five of five\" \u2014 and it makes the G that follows sound briefly like home.\n\nBuilding one is mechanical: take the chord you want to approach, find its own dominant, and play that first. Any major or minor diatonic chord can have one. V/V, V/vi and V/IV are the common three, and each brings exactly one accidental into the key \u2014 the leading tone of the chord being pointed at.\n\nThe distinction worth holding is that this is tonicisation, not modulation. Nothing has changed key: there has been no cadence in the new key and no sustained stay, and the next bar is back in C as though nothing happened. A modulation is what you get when the tonicisation refuses to end.",
        example: "In C: V/V = D7 \u2192 G \u00b7 V/vi = E7 \u2192 Am \u00b7 V/IV = C7 \u2192 F",
        figure: {
          kind: "staff",
          caption: "D7 is not in C major \u2014 the F\u266F is the leading tone of G, borrowed for one chord",
          key: "C",
          grandStaff: true,
          notes: [
            { pitch: 72, duration: 4 },
            { pitch: 67, duration: 4, stack: true },
            { pitch: 64, duration: 4, stack: true },
            { pitch: 48, duration: 4, staff: 1, at: 0 },
            { pitch: 72, duration: 4, accent: true },
            { pitch: 66, duration: 4, spell: 1, stack: true, accent: true },
            { pitch: 62, duration: 4, stack: true },
            { pitch: 50, duration: 4, staff: 1, at: 4 },
            { pitch: 71, duration: 8 },
            { pitch: 67, duration: 8, stack: true },
            { pitch: 62, duration: 8, stack: true },
            { pitch: 55, duration: 8, staff: 1, at: 8 },
          ],
          harmony: [
            { at: 0, text: "I" },
            { at: 8, text: "V" },
          ],
        },
        callout: {
          kind: "warning",
          text: "One accidental is not a key change. Nothing has modulated until the new key gets a cadence of its own.",
        },
      },
    ],
  },

  "binary-ternary-form": {
    summary:
      "You will be able to shape a whole piece rather than a good sixteen bars, using the two structures most Western music is built on.",
    estimatedMinutes: 20,
    keyTerms: [
      { term: "Binary form", definition: "Two sections, AB, usually both repeated. The first typically modulates away; the second returns." },
      { term: "Ternary form", definition: "Three sections, ABA. A contrasting middle framed by a returning opening." },
      { term: "Rounded binary", definition: "AB where the end of B brings back A's opening — the ancestor of sonata form." },
      { term: "Da capo", definition: "'From the head' — an instruction to repeat the A section, creating ABA without rewriting it." },
    ],
    commonMistakes: [
      {
        mistake: "Making the B section so different it sounds like a different piece.",
        fix: "Contrast needs a thread. Keep the meter, the tempo, or a rhythmic figure so the listener stays oriented.",
      },
      {
        mistake: "Returning to A completely unchanged.",
        fix: "A literal return is a missed opportunity. Vary the texture, the register or the ornamentation — the listener has heard it once already.",
      },
    ],
    listening: [
      {
        piece: "Minuet in G, BWV Anh. 114",
        composer: "Christian Petzold (long attributed to Bach)",
        why: "Rounded binary you can hear the seams of on a first listen.",
      },
      {
        piece: "Gymnopédie No. 1",
        composer: "Erik Satie",
        why: "Ternary that barely contrasts at all — proof that the middle section can be a shift in shade rather than a new world.",
      },
    ],
    practiceRoutine: [
      "Write sixteen bars of A that modulate to the dominant.",
      "Write a B section that contrasts in register but keeps the rhythm.",
      "Bring back A, varied — not copied.",
    ],
    extraSections: [
      {
        heading: "Rounded Binary, and the Da Capo",
        body:
          "Between plain binary and full ternary sits the form most minuets and most Baroque dances actually use: rounded binary. The A section goes to the dominant and repeats; the B section develops, and then \u2014 before it ends \u2014 the opening material returns in the tonic.\n\nThat return is what makes it \"rounded\". It is not ternary, because the return is part of the second half rather than a third section of its own, and the repeat signs make the shape ||: A :||: B A :|| rather than A B A. The difference is audible: in ternary the middle section is a genuine departure with its own cadence, while in rounded binary the B material is still on its way back.\n\nThe da capo aria builds ternary at a larger scale. A, then a contrasting B, then the instruction da capo \u2014 from the head \u2014 which sends the performer back to repeat A, traditionally ornamented the second time. The written form is two sections; the heard form is three.",
        example: "Binary ||: A :||: B :|| \u00b7 Rounded binary ||: A :||: B A :|| \u00b7 Ternary A B A",
        figure: {
          kind: "form",
          caption: "Rounded binary: the opening returns inside the second half, not as a third section",
          sections: [
            { label: "A", bars: 8, tone: "a", note: "tonic to dominant" },
            { label: "B", bars: 8, tone: "b", note: "development" },
            { label: "A", bars: 4, tone: "a", note: "returns in the tonic" },
          ],
        },
      },
    ],
  },

  "countermelody-orchestration-basics": {
    summary:
      "You will be able to write a second line that supports the melody instead of competing with it, and place it on an instrument that can actually play it.",
    estimatedMinutes: 24,
    keyTerms: [
      { term: "Countermelody", definition: "An independent melodic line played against the main tune, designed to complement rather than compete." },
      { term: "Register", definition: "The part of an instrument's range being used. The same notes sound completely different high or low on the same instrument." },
      { term: "Doubling", definition: "Two instruments playing the same line, usually to strengthen or recolour it." },
      { term: "Tessitura", definition: "Where a part comfortably sits, as distinct from the extremes it can technically reach." },
    ],
    commonMistakes: [
      {
        mistake: "Writing a countermelody as busy and prominent as the melody.",
        fix: "Move when the melody rests. A countermelody's best material usually lives in the melody's gaps.",
      },
      {
        mistake: "Writing outside an instrument's practical range because the notes fit the harmony.",
        fix: "Check the range and the tessitura. A trumpet can reach a high D; asking for it for sixteen bars is a different request entirely.",
      },
    ],
    listening: [
      {
        piece: "Danny Boy / Londonderry Air, orchestral settings",
        composer: "traditional, arr. various",
        why: "A tune everyone knows, given entirely different character by which instrument carries it.",
      },
      {
        piece: "Symphony No. 9 'From the New World', second movement",
        composer: "Antonín Dvořák",
        why: "Cor anglais melody with strings that support and never crowd.",
      },
    ],
    practiceRoutine: [
      "Take a melody you have written and add a countermelody that only moves during its long notes.",
      "Assign both lines to real instruments and check the ranges.",
      "Swap which instrument has the melody and listen to what changed.",
    ],
    extraSections: [
      {
        heading: "Tessitura, and Where a Line Should Sit",
        body:
          "A range is where an instrument can play. A tessitura is where it sounds like itself, and the two are not the same \u2014 which is the gap most orchestration mistakes fall into.\n\nA clarinet's bottom octave is dark and reedy and carries well at any dynamic; its throat register, just above, is pale and weak and will vanish under anything. A violin's lowest string is warm but will not cut; its top octave is brilliant and tiring to play for long. A horn blends with everything and so disappears if nothing else makes room for it. Writing a countermelody inside an instrument's weak register and marking it forte does not fix it.\n\nSo put a countermelody where it can be heard: in a register the melody is not using, with a rhythm that moves when the melody rests. Separation in space or in time \u2014 ideally both.",
        example: "Melody high and sustained \u2192 countermelody low and moving, or the reverse",
        figure: {
          kind: "staff",
          caption: "The second line moves where the first holds, and sits a register below it",
          key: "C",
          grandStaff: true,
          notes: [
            { pitch: 72, duration: 8 },
            { pitch: 74, duration: 8 },
            { pitch: 76, duration: 16 },
            { pitch: 55, duration: 4, staff: 1, at: 0 },
            { pitch: 57, duration: 4, staff: 1, at: 4 },
            { pitch: 59, duration: 4, staff: 1, at: 8 },
            { pitch: 60, duration: 4, staff: 1, at: 12 },
            { pitch: 62, duration: 4, staff: 1, at: 16 },
            { pitch: 64, duration: 4, staff: 1, at: 20 },
            { pitch: 62, duration: 8, staff: 1, at: 24 },
          ],
        },
        callout: {
          kind: "warning",
          text: "Doubling the melody in parallel octaves is not a countermelody. It is the same line, thicker, and you have spent a player on it.",
        },
      },
    ],
  },

  "chromatic-harmony-modal-writing": {
    summary:
      "You will be able to borrow colour from outside the key without losing the key, and write modally without it sounding like a mistake.",
    estimatedMinutes: 26,
    keyTerms: [
      { term: "Borrowed chord", definition: "A chord taken from the parallel major or minor — iv in a major key, for instance." },
      { term: "Neapolitan sixth", definition: "A major chord built on the flattened second degree, usually in first inversion, heading for the dominant." },
      { term: "Augmented sixth", definition: "Italian, French and German varieties — chromatic chords that expand outward onto the dominant." },
      { term: "Mode", definition: "A scale with a distinct step pattern and character: Dorian, Phrygian, Lydian, Mixolydian, Aeolian." },
    ],
    commonMistakes: [
      {
        mistake: "Adding chromatic chords for spice with no functional destination.",
        fix: "Nearly every chromatic chord is a heightened way of approaching something. Know what it is approaching before you write it.",
      },
      {
        mistake: "Writing 'modal' music that keeps cadencing like tonal music.",
        fix: "A V–I cadence drags the ear back to major or minor. Modal writing needs modal cadences and a drone or pedal to hold the mode in place.",
      },
    ],
    listening: [
      {
        piece: "Scarborough Fair",
        composer: "traditional",
        why: "Dorian mode held steady — the raised sixth against a minor tonic is the entire flavour.",
      },
      {
        piece: "Prelude à l'après-midi d'un faune",
        composer: "Claude Debussy",
        why: "Chromaticism and modality used as colour rather than function, and still perfectly coherent.",
      },
    ],
    practiceRoutine: [
      "Write a major-key phrase and replace IV with borrowed iv.",
      "Approach a dominant with a Neapolitan sixth.",
      "Write eight bars in Dorian over a drone, and resist every urge to cadence V–i.",
    ],
    extraSections: [
      {
        heading: "The Neapolitan and the Augmented Sixth",
        body:
          "Two chromatic chords turn up often enough to be worth knowing by name, and both are predominants \u2014 they exist to deliver the dominant.\n\nThe Neapolitan is a major triad built on the flattened second degree: in C, a D\u266D major chord. It is almost always written in first inversion, where the bass is F, which is why it is usually called the Neapolitan sixth and written \u266DII6. It goes to V, often by way of a cadential 6/4, and it brings a flattened second into a major key \u2014 heavy, dark and old.\n\nThe augmented sixth chords are named after the interval they contain: a minor sixth above the bass raised to an augmented sixth, which is six semitones wide spelled as a sixth rather than as a tritone. Italian, French and German are the three varieties, differing by which note is added in the middle. All three resolve outward \u2014 the two notes of the augmented sixth move apart by half step onto the dominant's root, doubled at the octave.",
        example: "In C: \u266DII6 = D\u266D/F \u00b7 It+6 = A\u266D C F\u266F \u00b7 both go to G",
        figure: {
          kind: "staff",
          caption: "The Neapolitan sixth in C \u2014 a D\u266D triad with F in the bass, leaning on the dominant",
          key: "C",
          grandStaff: true,
          notes: [
            { pitch: 73, duration: 8, spell: -1, accent: true },
            { pitch: 69, duration: 8, stack: true },
            { pitch: 65, duration: 8, stack: true },
            { pitch: 53, duration: 8, staff: 1, at: 0 },
            { pitch: 71, duration: 8 },
            { pitch: 67, duration: 8, stack: true },
            { pitch: 62, duration: 8, stack: true },
            { pitch: 55, duration: 8, staff: 1, at: 8 },
          ],
          harmony: [{ at: 4, text: "V" }],
        },
      },
    ],
  },

  "counterpoint-species": {
    summary:
      "You will be able to write two lines that are each satisfying alone and better together — the discipline underneath every texture you will ever write.",
    estimatedMinutes: 30,
    keyTerms: [
      { term: "Cantus firmus", definition: "The fixed melody against which counterpoint is written." },
      { term: "Contrary motion", definition: "Two lines moving in opposite directions — the strongest way to keep them independent." },
      { term: "Parallel fifths / octaves", definition: "Two voices moving in the same perfect interval, which collapses their independence." },
      { term: "Suspension", definition: "Holding a note as the harmony changes so it becomes a dissonance, then resolving it down by step." },
    ],
    commonMistakes: [
      {
        mistake: "Writing a second line that shadows the first in thirds throughout.",
        fix: "That is harmony, not counterpoint. Independence requires contrary and oblique motion, and rhythmic difference.",
      },
      {
        mistake: "Treating the species rules as arbitrary hoops.",
        fix: "Each rule protects independence. Parallel fifths are forbidden because the ear fuses the two voices into one — the rule is a description of perception.",
      },
    ],
    listening: [
      {
        piece: "Two-Part Invention No. 1 in C, BWV 772",
        composer: "J. S. Bach",
        why: "Two voices, complete equality, one motif. The clearest counterpoint ever written.",
      },
      {
        piece: "Sicut locutus est, Magnificat",
        composer: "J. S. Bach",
        why: "Five voices, each independently singable.",
      },
    ],
    practiceRoutine: [
      "Write first species — note against note — against an eight-note cantus firmus.",
      "Check every vertical interval and every parallel.",
      "Rewrite in second species, two notes against one, and add one suspension.",
    ],
    extraSections: [
      {
        heading: "Why This Still Matters",
        body: "Species counterpoint looks like an antique exercise, but it is really ear training with a pencil. Every rule encodes something about how listeners separate simultaneous lines. Film composers, game composers and arrangers who never write a fugue still rely on it every time they need an inner line to be audible under a melody.",
        callout: {
          kind: "insight",
          text: "If a texture sounds muddy, the problem is almost always counterpoint, not orchestration.",
        },
      },
    ],
  },

  "advanced-rhythm-texture": {
    summary:
      "You will be able to write rhythm that generates energy on its own, and manage density so that busy passages still sound clear.",
    estimatedMinutes: 26,
    keyTerms: [
      { term: "Syncopation", definition: "Accents placed off the expected beat, creating push against the meter." },
      { term: "Hemiola", definition: "Two bars of three heard as three bars of two, or vice versa." },
      { term: "Polyrhythm", definition: "Two conflicting rhythmic groupings sounding at once, such as three against two." },
      { term: "Texture density", definition: "How many independent things are happening at once, and how much space each is given." },
    ],
    commonMistakes: [
      {
        mistake: "Syncopating everything until the pulse disappears.",
        fix: "Syncopation only works against a felt beat. Keep something — a bass, a hi-hat, an inner voice — holding the grid.",
      },
      {
        mistake: "Adding layers to build intensity.",
        fix: "Density is not the same as intensity. Removing a layer at the climax is often more powerful than adding a fifth one.",
      },
    ],
    listening: [
      {
        piece: "The Rite of Spring, 'Augurs of Spring'",
        composer: "Igor Stravinsky",
        why: "One repeated chord, irregular accents, and a century of rhythmic music descended from it.",
      },
      {
        piece: "America (West Side Story)",
        composer: "Leonard Bernstein",
        why: "Hemiola as the actual hook — 6/8 and 3/4 alternating bar by bar.",
      },
    ],
    practiceRoutine: [
      "Write four bars of straight rhythm, then displace every accent by an eighth.",
      "Write three against two and play both hands until it locks.",
      "Take a dense passage and delete one layer. Decide honestly whether it lost anything.",
    ],
    extraSections: [
      {
        heading: "Syncopation and Hemiola",
        body:
          "Irregular metres and polyrhythms are the large-scale tools. Two smaller ones do most of the actual work, and both depend on a pulse the listener is already counting.\n\nSyncopation puts an accent where the metre does not expect one \u2014 on a weak beat, or off the beat entirely, often by tying across the strong beat so it arrives early and then is not there. It only works because the metre is established: syncopate from the first bar and there is nothing to be against, which is why a groove usually states the beat before it starts playing with it.\n\nHemiola regroups the pulse without changing the metre. Six eighth notes can be three groups of two or two groups of three, so a passage in 3/4 can be made to sound like 6/8 for two bars simply by accenting every second eighth. It is everywhere in Baroque cadences and in Bernstein, and it costs nothing but accents.",
        example: "3/4 as 1 2 3 1 2 3 \u00b7 the same six eighths as 1 2 1 2 1 2",
        figure: {
          kind: "rhythm",
          caption: "Two bars of 3/4 regrouped into three groups of two \u2014 a hemiola",
          meter: { beats: 3, unit: 4 },
          row: [
            { duration: 4, label: "1", accent: true },
            { duration: 4 },
            { duration: 4, label: "2", accent: true },
            { duration: 4 },
            { duration: 4, label: "3", accent: true },
            { duration: 4 },
          ],
        },
        callout: {
          kind: "insight",
          text: "Both tricks are parasitic on a pulse the listener is counting. Establish the metre first, or there is nothing for the syncopation to be late against.",
        },
      },
    ],
  },

  "fugue-large-form": {
    summary:
      "You will understand how a single subject can generate a whole movement, and how large forms hold attention over long spans.",
    estimatedMinutes: 30,
    keyTerms: [
      { term: "Subject", definition: "The fugue's main theme, stated alone at the start." },
      { term: "Answer", definition: "The subject restated in the dominant, usually adjusted so it fits the key." },
      { term: "Episode", definition: "A passage between subject entries, usually sequential, that modulates." },
      { term: "Stretto", definition: "Overlapping entries of the subject before the previous one has finished — a device of intensification." },
    ],
    commonMistakes: [
      {
        mistake: "Writing a subject that is too long or too harmonically complete.",
        fix: "A subject must survive being stacked against itself. Short, rhythmically distinctive, harmonically open.",
      },
      {
        mistake: "Filling episodes with new material.",
        fix: "Episodes are built from fragments of the subject or countersubject. New material here breaks the movement's unity.",
      },
    ],
    listening: [
      {
        piece: "Fugue in G minor, BWV 578 'Little'",
        composer: "J. S. Bach",
        why: "A memorable subject and audible structure. The best first fugue to study.",
      },
      {
        piece: "Symphony No. 41 'Jupiter', finale",
        composer: "W. A. Mozart",
        why: "Fugal writing inside sonata form, five subjects combined at the end. Large-scale architecture at its limit.",
      },
    ],
    practiceRoutine: [
      "Write a subject of no more than two bars with a clear rhythmic profile.",
      "Write the tonal answer and check every interval you adjusted.",
      "Build a four-bar episode from a fragment of the subject alone.",
    ],
    extraSections: [
      {
        heading: "Real Answers, Tonal Answers, and Episodes",
        body:
          "The second voice of a fugue enters with the answer \u2014 the subject transposed to the dominant. There are two ways to do that, and the choice is not stylistic.\n\nA real answer transposes every interval exactly. A tonal answer alters one or two notes, usually near the start, so that the answer stays inside the key rather than dragging the music into the dominant before the exposition is finished. The usual trigger is a subject that opens by leaping from tonic to dominant: transposed exactly, that leap would land on the supertonic and pull away, so the answer adjusts it back to the tonic. Bach does this constantly, and it looks like a mistake until you know why it is there.\n\nBetween entries come episodes: passages built from fragments of the subject or countersubject, usually sequential, usually modulating, and carrying the music from one entry to the next. A fugue is not a chain of subject statements \u2014 it is subject entries separated by episodes that do the travelling, and the episodes are where most of the composition actually happens.",
        example: "Subject in the tonic \u2192 answer in the dominant \u2192 episode \u2192 next entry",
        figure: {
          kind: "form",
          caption: "An exposition and what follows: entries separated by episodes that travel",
          sections: [
            { label: "subject", bars: 4, tone: "a", note: "tonic" },
            { label: "answer", bars: 4, tone: "a", note: "dominant" },
            { label: "episode", bars: 3, tone: "b", note: "sequential, modulating" },
            { label: "subject", bars: 4, tone: "a", note: "a new voice" },
            { label: "episode", bars: 3, tone: "b" },
            { label: "stretto", bars: 4, tone: "c", note: "entries overlapping" },
          ],
        },
      },
    ],
  },

  "virtuoso-writing": {
    summary:
      "You will be able to write music that sounds spectacularly difficult and is actually playable — and know the difference between the two.",
    estimatedMinutes: 30,
    keyTerms: [
      { term: "Idiomatic writing", definition: "Passagework shaped by how an instrument actually works, so difficulty lies where the instrument is strong." },
      { term: "Effective difficulty", definition: "Music that sounds harder than it is, because the figuration suits the hand." },
      { term: "Unplayable writing", definition: "Demands that ignore physical reality — impossible stretches, no breath, no time to change position." },
      { term: "Passagework", definition: "Rapid figuration whose function is brilliance and momentum rather than melody." },
    ],
    commonMistakes: [
      {
        mistake: "Equating difficulty with quality.",
        fix: "Notes per second is not a musical value. Virtuosity is only interesting when it is expressive — velocity in service of something.",
      },
      {
        mistake: "Writing a piano part with tenth stretches held at speed.",
        fix: "Most hands cannot. Rewrite as a rolled chord or redistribute between hands — it sounds the same and can actually be performed.",
      },
      {
        mistake: "Giving a wind or brass player no rests.",
        fix: "They have to breathe. Write the breaths in yourself, or a performer will put them somewhere you did not want.",
      },
    ],
    listening: [
      {
        piece: "Étude Op. 10 No. 1",
        composer: "Frédéric Chopin",
        why: "Brutally difficult and perfectly idiomatic — every arpeggio lies exactly as the hand opens.",
      },
      {
        piece: "La Campanella",
        composer: "Franz Liszt",
        why: "Terrifying to hear, precisely engineered for the hand underneath the terror.",
      },
      {
        piece: "Flight of the Bumblebee",
        composer: "Nikolai Rimsky-Korsakov",
        why: "Chromatic runs that sit naturally under the fingers of almost any instrument, which is why everyone plays it.",
      },
    ],
    practiceRoutine: [
      "Write eight bars of passagework, then physically try it — or watch a video of a comparable passage.",
      "Take a difficult chord voicing and find two easier ways to produce the same sound.",
      "Mark every breath and every position change in a wind or string part you have written.",
    ],
    extraSections: [
      {
        heading: "The Three Categories",
        body: "Every difficult passage falls into one of three buckets. Effective difficulty sounds hard and lies well — this is what you want. Genuine virtuosity is hard both to hear and to play, and is worth it when the difficulty is the expression. Unplayable writing is hard for reasons that produce no musical benefit: a stretch nobody has, a breath nobody can take, a page turn nobody can make. The first two make careers. The third makes performers quietly programme something else.",
        callout: {
          kind: "warning",
          text: "If you cannot explain what a difficult passage expresses, it is decoration — and decoration is the first thing a performer cuts.",
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // The twenty-one that had none
  // -------------------------------------------------------------------------
  //
  // An audit of the Academy found two populations of lesson. Twenty-five had a
  // detail layer and around sixty-five words of body; twenty-one had two or
  // three hundred words of body and no detail layer at all. A learner walking
  // the roadmap in order got key terms, mistakes, listening and a routine on
  // lesson two, none of it on lesson one, all of it again on lesson three.
  //
  // These are the twenty-one. The gap fell on the first lesson in the whole
  // Academy, on every orchestration lesson, and on most of harmony.

  "what-sound-is": {
    summary:
      "You will be able to say what pitch, octave, timbre and dynamic each physically are, and explain why two instruments playing the same note are still telling you apart.",
    estimatedMinutes: 10,
    keyTerms: [
      { term: "Frequency", definition: "How many times per second the air vibrates, measured in hertz. Higher frequency, higher pitch." },
      { term: "Octave", definition: "A doubling of frequency. A4 is 440 Hz, A5 is 880 — which is why they sound like the same note." },
      { term: "Timbre", definition: "The quality that distinguishes a piano from a violin at the same pitch. It comes from which overtones are present and how loud each is." },
      { term: "Overtone", definition: "A quieter frequency sounding above the fundamental, at a whole-number multiple of it. The recipe of overtones is the instrument's fingerprint." },
      { term: "Dynamic", definition: "Written loudness, marked with Italian abbreviations from ppp to fff. Always relative — a forte flute is quieter than a piano trombone." },
    ],
    commonMistakes: [
      {
        mistake: "Thinking loudness and pitch are the same dial, so that playing higher means playing louder.",
        fix: "They are independent. A piccolo can whisper at the top of its range and a tuba can roar at the bottom of its. Frequency is pitch; amplitude is loudness.",
      },
      {
        mistake: "Hearing a dynamic as an absolute volume, so that f means one particular loudness everywhere.",
        fix: "A dynamic is an instruction about effort and balance, read relative to the instrument and the texture. One trombone at mf will bury four flutes at ff.",
      },
      {
        mistake: "Assuming the octave is a human convention, like the seven letter names.",
        fix: "The letter names are a convention. The octave is arithmetic — every musical culture that has examined pitch has found the 2:1 ratio, because the ear hears it as sameness.",
      },
    ],
    listening: [
      {
        piece: "The Young Person's Guide to the Orchestra",
        composer: "Benjamin Britten",
        why: "One theme passed around every instrument in turn. Same notes throughout, so what changes between variations is timbre and nothing else — it is the definition, demonstrated.",
      },
      {
        piece: "Bolero",
        composer: "Maurice Ravel",
        why: "One melody and one dynamic plan for fifteen minutes. The piece is almost entirely about timbre and a single enormous crescendo, which makes both audible in isolation.",
      },
    ],
    practiceRoutine: [
      "Play any note, then the note twelve keys above it. Listen until 'the same, higher' stops being a claim and starts being obvious.",
      "Play one note on two different instrument sounds and describe the difference without using the words higher, lower, louder or quieter.",
      "Play one note six times, at pp, p, mp, mf, f and ff, and make each step clearly distinct from the last. Most players manage three.",
    ],
  },

  "the-staff": {
    summary:
      "You will be able to read a note on either clef without counting up from the bottom line, and know where middle C sits on both.",
    estimatedMinutes: 14,
    keyTerms: [
      { term: "Staff", definition: "Five lines and the four spaces between them. Up one line-or-space is up one letter name." },
      { term: "Treble clef", definition: "The G clef: the curl in its middle wraps the line that is G, the second line up." },
      { term: "Bass clef", definition: "The F clef: its two dots sit either side of the line that is F, the fourth line up." },
      { term: "Grand staff", definition: "Treble and bass braced together for keyboard music, with middle C in the gap between them." },
      { term: "Ledger line", definition: "A short line added above or below the staff for notes beyond it — the staff's pattern continuing." },
    ],
    commonMistakes: [
      {
        mistake: "Counting up from the bottom line every time, which works and never gets faster.",
        fix: "Learn three anchors per clef and read by distance from the nearest one. On treble, G on the second line, middle C below the staff, and the top line F. On bass, F on the fourth line, middle C above the staff, and the bottom line G.",
      },
      {
        mistake: "Reading bass clef as though it were treble clef moved down, so every note is named two letters out.",
        fix: "The two clefs put different letters on the same lines, by design. The bottom line is E on treble and G on bass. They are two alphabets, not one shifted.",
      },
      {
        mistake: "Writing a note on the staff and a separate ledger line for it a space away.",
        fix: "Ledger lines are added one at a time, in the same line-and-space pattern, immediately continuing the staff. A gap means the note is not where you think it is.",
      },
    ],
    listening: [
      {
        piece: "Notebook for Anna Magdalena Bach",
        composer: "J. S. Bach",
        why: "Short keyboard pieces written to be read, with both hands staying near middle C — the best possible first grand-staff reading.",
      },
      {
        piece: "Mikrokosmos, Book 1",
        composer: "Béla Bartók",
        why: "Deliberately written for beginners, with the two hands often a mirror of each other, so a misread clef is immediately audible.",
      },
    ],
    practiceRoutine: [
      "Name ten random notes on the treble clef out loud, then ten on the bass, timing yourself. Repeat until both times are the same.",
      "Write middle C on both clefs from memory. If you hesitate, you have found the thing to practise.",
      "Take four bars of any piano music and name every note in the left hand, out loud, before playing it.",
    ],
  },

  transposition: {
    summary:
      "You will be able to move a melody to any key by interval rather than by guesswork, and work out what to write so a B flat trumpet sounds the pitch you meant.",
    estimatedMinutes: 18,
    keyTerms: [
      { term: "Transposition", definition: "Moving every note by the same interval, so the relationships inside the music survive and only its absolute pitch changes." },
      { term: "Concert pitch", definition: "The pitch that actually sounds, as opposed to the pitch a transposing player reads." },
      { term: "Written pitch", definition: "What is on the page in front of the player, which for a transposing instrument is not what you hear." },
      { term: "Transposing instrument", definition: "One whose written C sounds as some other pitch. A B flat trumpet's written C sounds B flat, a major second lower." },
    ],
    commonMistakes: [
      {
        mistake: "Transposing by counting half steps, which moves the sound correctly and spells it wrongly.",
        fix: "Transpose by interval name. Up a minor third from C is E flat, not D sharp — and if the key signature says E flat, writing D sharp forces the reader to work out that they are the same note.",
      },
      {
        mistake: "Transposing the notes but keeping the original key signature.",
        fix: "The key signature moves with the music. Up a major second from C major is D major, which has two sharps, and every F and C in the part is now sharp without an accidental.",
      },
      {
        mistake: "Writing a B flat trumpet part at concert pitch because that is the pitch you want to hear.",
        fix: "Write it a major second higher than it sounds. You want a concert C, so you write a D. Getting the direction backwards is the single most common orchestration error there is.",
      },
    ],
    listening: [
      {
        piece: "Winterreise",
        composer: "Franz Schubert",
        why: "Sung in several different keys depending on the singer's voice. The same song transposed is still unmistakably the same song, which is the whole point.",
      },
      {
        piece: "Rhapsody in Blue",
        composer: "George Gershwin",
        why: "The opening clarinet glissando is written for a B flat instrument, so the famous notes on the page are not the famous notes in the air.",
      },
    ],
    practiceRoutine: [
      "Take a four-bar tune in C and write it in E flat, by interval, with the correct key signature.",
      "Write the same tune for B flat trumpet so that it sounds in the original key, then check one note against a piano.",
      "Name what sounds when a horn in F plays a written G. Then do it in the other direction: what do you write for a sounding G?",
    ],
  },

  "diatonic-harmony": {
    summary:
      "You will be able to build all seven chords of any major or minor key, name each by roman numeral, and say what each one tends to do.",
    estimatedMinutes: 20,
    keyTerms: [
      { term: "Diatonic", definition: "Using only the notes of the key. A diatonic chord needs no accidentals." },
      { term: "Roman numeral", definition: "A chord named by its scale degree rather than its letter, so the analysis transposes. Uppercase is major, lowercase minor, ° diminished." },
      { term: "Tonic, dominant, predominant", definition: "The three functions. Tonic is home (I, vi, iii), dominant pulls back to it (V, vii°), predominant leads to the dominant (IV, ii)." },
      { term: "Leading tone", definition: "The seventh degree of a major scale, a half step below the tonic. Its pull upward is what makes V want to become I." },
    ],
    commonMistakes: [
      {
        mistake: "Reading a roman numeral as a letter name, so that V in E flat major is read as a G chord.",
        fix: "The numeral counts scale degrees of the key you are in. V in E flat major is the chord on the fifth degree, which is B flat.",
      },
      {
        mistake: "Writing vii° as a plain triad and wondering why it sounds weak.",
        fix: "Its diminished fifth needs careful handling: put the tritone's notes in inner voices and resolve them inward. Most of the time a V7 is what you actually wanted.",
      },
      {
        mistake: "Assuming natural minor gives you a usable dominant.",
        fix: "It gives you a minor v, which has no leading tone and so does not pull home. Raise its third — the harmonic minor seventh degree — whenever you want a real dominant in a minor key.",
      },
    ],
    listening: [
      {
        piece: "Prelude in C major, WTC Book I",
        composer: "J. S. Bach",
        why: "Almost nothing but diatonic chords of C major, arpeggiated one per bar. The clearest possible view of a key's own seven chords in use.",
      },
      {
        piece: "Canon in D",
        composer: "Johann Pachelbel",
        why: "Eight bars of diatonic harmony repeated twenty-eight times. If you can hear the numerals anywhere, you can hear them here.",
      },
    ],
    practiceRoutine: [
      "Write out the seven triads of D major and label them I through vii°. Check that the pattern of qualities matches the one in C.",
      "Do the same in A minor, then raise the seventh degree and write the chord that results.",
      "Play I-IV-V-I in three different keys without writing anything down.",
    ],
  },

  "seventh-chords": {
    summary:
      "You will be able to spell all five seventh-chord qualities on any root, and resolve a dominant seventh's tritone the way the ear expects.",
    estimatedMinutes: 22,
    keyTerms: [
      { term: "Seventh chord", definition: "A triad with one more third stacked on top — four notes, named for the interval from the root to that top note." },
      { term: "Dominant seventh", definition: "Major triad, minor seventh. Contains a tritone, and is the engine of tonal motion." },
      { term: "Half-diminished", definition: "Diminished triad with a minor seventh, written m7♭5 or ø7. The ii chord of a minor key." },
      { term: "Fully diminished", definition: "Three stacked minor thirds. Symmetrical, so it has four possible roots and can lead almost anywhere." },
      { term: "Tritone resolution", definition: "The third rises to the tonic and the seventh falls by step. Doing both is what makes V7 to I sound inevitable." },
    ],
    commonMistakes: [
      {
        mistake: "Calling any chord with a seventh in it a dominant seventh.",
        fix: "Five qualities, and they are not interchangeable. Cmaj7 is C E G B; C7 is C E G B flat. One is a resting place and the other is a question.",
      },
      {
        mistake: "Resolving V7 to I and leaving the seventh where it is.",
        fix: "The seventh is the dissonance. Let it fall by step — in G7 to C, the F must go to E, and if it does not, the chord has not resolved, it has merely been followed.",
      },
      {
        mistake: "Doubling the root of a four-note chord in four voices and dropping the fifth without noticing.",
        fix: "Dropping the fifth is usually right. Dropping the third or the seventh is not: those two are the chord's identity, and without them it is no longer the chord you wrote.",
      },
    ],
    listening: [
      {
        piece: "Tristan und Isolde, Prelude",
        composer: "Richard Wagner",
        why: "Opens on a half-diminished seventh that never properly resolves for four hours. The most famous chord in music history is a seventh chord used as a question.",
      },
      {
        piece: "Clair de Lune",
        composer: "Claude Debussy",
        why: "Sevenths and ninths used as colours to sit inside rather than tensions to resolve, which is the other half of what these chords are for.",
      },
    ],
    practiceRoutine: [
      "Spell all five seventh qualities on C, then on E flat, then on F sharp. Write them; do not play them until they are written.",
      "Play G7 and resolve it to C with the F falling to E and the B rising to C. Then play it resolving wrongly and listen to what is lost.",
      "Find the tritone inside three different dominant sevenths and name the two keys each could resolve to.",
    ],
  },

  "voice-leading": {
    summary:
      "You will be able to write four parts that each sound like a line worth singing, and spot the parallels that collapse four voices into two.",
    estimatedMinutes: 26,
    keyTerms: [
      { term: "Voice leading", definition: "How each individual part moves from one chord to the next, considered as a melody rather than as a slice of harmony." },
      { term: "Parallel fifths and octaves", definition: "Two voices a fifth or octave apart moving in the same direction. They fuse into one sound, so a voice is lost." },
      { term: "Contrary motion", definition: "Two voices moving in opposite directions. The strongest way to keep them sounding independent." },
      { term: "Common tone", definition: "A note shared by two consecutive chords. Holding it still is usually the smoothest available move." },
      { term: "Voice crossing", definition: "A lower voice written above a higher one. Almost always a mistake, and almost always a sign the spacing went wrong earlier." },
    ],
    commonMistakes: [
      {
        mistake: "Writing the chords first as blocks, then trying to make lines out of them afterwards.",
        fix: "Write the bass and the soprano as two real melodies in contrary motion, then fill the inner voices with whatever is left. The texture comes out right the first time.",
      },
      {
        mistake: "Leaping every voice to the nearest spelling of the next chord.",
        fix: "Hold common tones, move the rest by step where you can. If a voice must leap, give it the only leap in the bar.",
      },
      {
        mistake: "Checking only soprano against bass for parallels.",
        fix: "Parallels are illegal between any two of the four voices, including alto against tenor. Those are the ones that survive a first proofread.",
      },
    ],
    listening: [
      {
        piece: "371 Harmonised Chorales",
        composer: "J. S. Bach",
        why: "The reference text, and the reason the rules exist. Sing the tenor line of any one of them: it is a melody, not a filler part.",
      },
      {
        piece: "Requiem, Introit",
        composer: "Gabriel Fauré",
        why: "Four-part writing where the inner voices are plainly doing their own expressive work rather than supporting the top one.",
      },
    ],
    practiceRoutine: [
      "Harmonise a four-note bass line in four voices, then sing the tenor part alone and judge whether it is music.",
      "Take any four-part passage you have written and check all six pairs of voices for parallels. Six, not one.",
      "Rewrite one progression using only contrary and oblique motion, and compare the result with your first attempt.",
    ],
  },

  "non-chord-tones": {
    summary:
      "You will be able to name every category of decoration by how it arrives and how it leaves, and write a line that is mostly decoration without it sounding wrong.",
    estimatedMinutes: 20,
    keyTerms: [
      { term: "Passing tone", definition: "Steps between two chord tones in the same direction, filling a third." },
      { term: "Neighbour tone", definition: "Steps away from a chord tone and immediately back to it." },
      { term: "Suspension", definition: "A note held over from the previous chord, now dissonant, resolving down by step. Three stages: preparation, suspension, resolution." },
      { term: "Appoggiatura", definition: "Arrives by leap, leaves by step. The leap is what makes it sting." },
      { term: "Escape tone", definition: "Arrives by step, leaves by leap — the mirror of an appoggiatura, and much rarer." },
      { term: "Anticipation", definition: "A note of the next chord sounded early, over the one still playing." },
    ],
    commonMistakes: [
      {
        mistake: "Naming a decoration by which note it is rather than by how it behaves.",
        fix: "The same pitch can be a passing tone, a suspension or an appoggiatura depending entirely on what happens either side of it. Look at the approach and the departure, never the note alone.",
      },
      {
        mistake: "Writing a suspension with no preparation, so a dissonance simply appears.",
        fix: "It has to be a consonance first, in the previous harmony, in the same voice. Without the preparation it is an appoggiatura, which is a different effect.",
      },
      {
        mistake: "Resolving a suspension upward.",
        fix: "Suspensions fall. A dissonance that rises to resolve is a retardation, which exists but is rare and sounds quite different.",
      },
    ],
    listening: [
      {
        piece: "Miserere",
        composer: "Gregorio Allegri",
        why: "Built from suspensions. The famous high passage is a chain of them — the piece is a catalogue of preparation, dissonance and resolution.",
      },
      {
        piece: "Air on the G String",
        composer: "J. S. Bach",
        why: "The melody is almost entirely non-chord tones over a walking bass. Strip the decoration and nothing is left, which is the lesson.",
      },
    ],
    practiceRoutine: [
      "Take eight bars of any melody with chord symbols and label every non-chord tone by category.",
      "Write a four-bar melody over I-IV-V-I using one chord tone per bar and filling the rest with passing and neighbour tones.",
      "Write the same progression twice: once with a suspension in every bar, once with none. Play both.",
    ],
  },

  modes: {
    summary:
      "You will be able to name each mode by the single degree that distinguishes it, and write a passage that actually sounds modal instead of sounding like major with a strange start.",
    estimatedMinutes: 24,
    keyTerms: [
      { term: "Mode", definition: "A scale got by starting the same seven notes from a different degree. Same pitches, different tonic, different character." },
      { term: "Ionian and Aeolian", definition: "The major scale and the natural minor scale, under their modal names." },
      { term: "Dorian", definition: "Minor with a raised sixth. The brighter minor." },
      { term: "Phrygian", definition: "Minor with a flattened second. That half step above the tonic is the whole colour." },
      { term: "Lydian", definition: "Major with a raised fourth. Floating, unresolved, and the hardest to keep from collapsing into the major a fifth below." },
      { term: "Mixolydian", definition: "Major with a flattened seventh. No leading tone, so no dominant pull." },
      { term: "Locrian", definition: "Flattened second and fifth. Its tonic triad is diminished, which is why it is almost never a key." },
    ],
    commonMistakes: [
      {
        mistake: "Writing the right notes and letting the music cadence onto the parent major's tonic.",
        fix: "A mode is established by emphasis, not by pitch content. In D Dorian, land on D, start phrases on D, and avoid the C major cadence that will otherwise reassert itself immediately.",
      },
      {
        mistake: "Using a V-I cadence in a mode that has no major dominant.",
        fix: "Mixolydian's dominant is minor and Dorian's is minor. Reaching for a major V and raising the seventh to get it does not make a modal cadence — it leaves the mode. Use the flattened seventh chord, or a plagal cadence, instead.",
      },
      {
        mistake: "Learning the modes as seven unrelated scales to memorise.",
        fix: "Learn them as major or minor with one alteration. That is four facts instead of forty-nine, and it is also how you hear them.",
      },
    ],
    listening: [
      {
        piece: "So What",
        composer: "Miles Davis",
        why: "Sixteen bars of D Dorian, then eight of E flat Dorian, then eight back. Modal jazz reduced to its clearest statement.",
      },
      {
        piece: "Scarborough Fair",
        composer: "Traditional",
        why: "Dorian, and the raised sixth is audible every time the tune reaches for it.",
      },
      {
        piece: "Symphony No. 9, second movement",
        composer: "Ralph Vaughan Williams",
        why: "A composer who thought in modes rather than borrowing them. The modal colour is structural, not decorative.",
      },
    ],
    practiceRoutine: [
      "Play the white keys from D to D, then E to E, then F to F, naming the one degree that differs from major or minor each time.",
      "Write eight bars in Mixolydian that never use a major V chord.",
      "Take one melody you have already written and rewrite it in Phrygian by flattening the second. Judge what it does to the character.",
    ],
  },

  "modulation-techniques": {
    summary:
      "You will be able to leave a key by pivot, by direct statement, by sequence or by chromatic mediant, and choose which of the four the moment calls for.",
    estimatedMinutes: 28,
    keyTerms: [
      { term: "Modulation", definition: "Changing key, which means persuading the listener that home has moved — not merely using notes from elsewhere." },
      { term: "Pivot chord", definition: "A chord belonging to both keys, read as part of the old key on arrival and the new one on departure." },
      { term: "Direct modulation", definition: "Simply beginning the new key, usually at a phrase boundary. Abrupt, and effective because of it." },
      { term: "Sequential modulation", definition: "Repeating a figure at a new transposition until the new key has been established by repetition." },
      { term: "Chromatic mediant", definition: "A key a third away sharing one note, reached without dominant preparation. The sound of film music lifting." },
      { term: "Closely related key", definition: "One differing by a single accidental — the dominant, the subdominant, the relative minor and their neighbours." },
    ],
    commonMistakes: [
      {
        mistake: "Treating a passing accidental as a modulation.",
        fix: "A secondary dominant is a colour inside the key. Nothing has modulated until the new key gets a cadence of its own.",
      },
      {
        mistake: "Arriving in the new key without cadencing, so the ear hears a wrong note rather than a new home.",
        fix: "Establish it: a V-I in the new key, or a long enough stay that nothing else is plausible. A modulation is finished by a cadence, not by an accidental.",
      },
      {
        mistake: "Modulating to a distant key early and finding there is nowhere left to go.",
        fix: "Spend the easy keys first. If the second phrase has already reached the flattened submediant, the climax has nothing further out to reach for.",
      },
    ],
    listening: [
      {
        piece: "Sonata in C major, K. 545, first movement",
        composer: "W. A. Mozart",
        why: "A textbook modulation to the dominant, prepared and cadenced so plainly it can be followed on first hearing.",
      },
      {
        piece: "Piano Sonata No. 21 (Waldstein), first movement",
        composer: "Ludwig van Beethoven",
        why: "A second subject in the chromatic mediant rather than the expected dominant, which is the whole reason the movement feels as it does.",
      },
      {
        piece: "Nimrod, from the Enigma Variations",
        composer: "Edward Elgar",
        why: "The lift near the end is a key change used as the emotional event, not as a structural one.",
      },
    ],
    practiceRoutine: [
      "Find every chord shared by C major and G major, then write a four-bar pivot modulation using one of them.",
      "Modulate from C to E major twice: once by pivot, once directly at a phrase boundary. Decide which you would keep.",
      "Write a two-bar figure and sequence it up by thirds until you have arrived somewhere unexpected, then cadence there.",
    ],
  },

  "borrowed-chords": {
    summary:
      "You will be able to take a chord from the parallel mode for colour without losing the key, and know which borrowings are worth the trouble.",
    estimatedMinutes: 22,
    keyTerms: [
      { term: "Modal mixture", definition: "Using chords of the parallel minor in a major key, or the reverse. The tonic does not move; the colour changes." },
      { term: "Parallel mode", definition: "The major and minor sharing a tonic — C major and C minor. Not the relative minor, which shares a key signature instead." },
      { term: "Minor subdominant (iv)", definition: "The commonest borrowing. Where IV is open, iv has a flattened sixth and aches." },
      { term: "Neapolitan (♭II)", definition: "A major chord on the flattened second, usually in first inversion. A borrowed predominant with a strong pull to the dominant." },
      { term: "Picardy third", definition: "Ending a minor-key piece on a major tonic. The oldest borrowing there is, and it still works." },
    ],
    commonMistakes: [
      {
        mistake: "Confusing the parallel minor with the relative minor.",
        fix: "C major borrows from C minor, not from A minor. The shared thing is the tonic, which is exactly why the key survives the borrowing.",
      },
      {
        mistake: "Calling a borrowed chord a modulation.",
        fix: "Nothing has modulated. The tonic has not moved and no new key has cadenced — one chord has changed quality for colour, and the key is still the key.",
      },
      {
        mistake: "Borrowing so freely that the mode stops meaning anything.",
        fix: "A borrowed chord works by contrast with the diatonic chords around it. Use iv once in a phrase and it aches; use it constantly and the piece is simply in minor.",
      },
    ],
    listening: [
      {
        piece: "In the Hall of the Mountain King",
        composer: "Edvard Grieg",
        why: "Mixture used as menace, with major and minor versions of the same chords alternating as the thing closes in.",
      },
      {
        piece: "Blackbird",
        composer: "Lennon and McCartney",
        why: "Borrowed chords inside an otherwise plain major key, which is most of why the harmony is memorable.",
      },
      {
        piece: "Dido's Lament",
        composer: "Henry Purcell",
        why: "A minor-key piece whose final cadence turns major. The Picardy third doing exactly what it is for.",
      },
    ],
    practiceRoutine: [
      "Write I-IV-V-I in C major, then replace IV with iv and play both. Name what changed in one sentence.",
      "Write a four-chord progression in C major using exactly one chord from C minor.",
      "Take a minor-key phrase you have written and end it with a Picardy third. Decide whether you prefer it.",
    ],
  },

  "extended-altered-chords": {
    summary:
      "You will be able to voice a thirteenth chord that is playable by two hands, and alter a dominant so the tension points where you want it to go.",
    estimatedMinutes: 26,
    keyTerms: [
      { term: "Extension", definition: "A ninth, eleventh or thirteenth — thirds stacked above the seventh. By the thirteenth every note of the scale is present." },
      { term: "Altered tension", definition: "An extension sharpened or flattened: ♭9, ♯9, ♯11, ♭13. Almost always applied to dominants." },
      { term: "Omission", definition: "Leaving notes out of a large chord on purpose. The third and seventh stay; the fifth and eleventh usually go." },
      { term: "Suspended chord", definition: "The third replaced by the second or fourth, so the chord is neither major nor minor." },
      { term: "Slash chord", definition: "A chord with a specified bass note that is not its root, written C/G. The bass is an instruction, not a guess." },
    ],
    commonMistakes: [
      {
        mistake: "Writing every note of a thirteenth chord and producing a seven-note cluster nobody can play.",
        fix: "Voice the identity and drop the rest: root, third, seventh and the extension that matters. Three or four notes in the right register say more than seven in the wrong one.",
      },
      {
        mistake: "Writing an eleventh over a major third and wondering why it sounds wrong.",
        fix: "The natural eleventh is a half step above the major third, and the clash is not a colour, it is mud. Either sharpen the eleventh or omit the third — which is what 7sus4 is.",
      },
      {
        mistake: "Adding a ninth to a chord with no seventh and calling it a ninth chord.",
        fix: "That is an added ninth, written add9. A ninth chord contains the seventh; the seventh is what makes the ninth an extension rather than an addition.",
      },
    ],
    listening: [
      {
        piece: "Take Five",
        composer: "Paul Desmond",
        why: "Extended minor harmony holding still for an entire tune, which lets you hear the colour of the chord rather than its function.",
      },
      {
        piece: "Rhapsody in Blue",
        composer: "George Gershwin",
        why: "Altered dominants used as the harmonic language rather than as special effects.",
      },
      {
        piece: "Prélude à l'après-midi d'un faune",
        composer: "Claude Debussy",
        why: "Ninths and elevenths used as sonorities with no obligation to resolve. The other reason to write them.",
      },
    ],
    practiceRoutine: [
      "Voice C13 in four notes for two hands, then justify each note you left out.",
      "Write G7 four times, altering one tension each time: ♭9, ♯9, ♯11, ♭13. Resolve each to C and compare.",
      "Play C/G, C/E and C/B flat in turn and describe what changing the bass did to a chord that otherwise did not change at all.",
    ],
  },

  "jazz-harmony": {
    summary:
      "You will be able to play ii-V-I through the circle of fifths, substitute a tritone dominant without breaking the voice leading, and voice a chord in fourths.",
    estimatedMinutes: 30,
    keyTerms: [
      { term: "ii-V-I", definition: "Predominant, dominant, tonic — the sentence almost all jazz harmony is built from, with sevenths throughout." },
      { term: "Tritone substitution", definition: "Replacing a dominant with the dominant a tritone away. They share the same tritone, so the resolution still works and the bass moves by half step instead." },
      { term: "Guide tones", definition: "The third and seventh. Follow those two voices through a progression and the harmony is accounted for." },
      { term: "Modal jazz", definition: "Slowing the harmony drastically — one mode for many bars — so the interest moves from the changes to the line." },
      { term: "Quartal voicing", definition: "Stacking fourths rather than thirds, which removes the chord's major or minor quality and leaves it open." },
      { term: "Reharmonisation", definition: "Keeping a melody and replacing the chords under it, which is the standard way a standard becomes somebody's own." },
    ],
    commonMistakes: [
      {
        mistake: "Playing root-position seventh chords up and down the keyboard for every change.",
        fix: "Voice-lead the guide tones. In Dm7-G7-Cmaj7 the third and seventh of each chord are a half step or a common tone away from the next — that is the smooth sound, and roots in parallel is not.",
      },
      {
        mistake: "Substituting a tritone dominant and keeping the original bass note.",
        fix: "The substitution is mostly a bass event. D flat 7 to C moves the bass down a half step, which is the point; keeping G in the bass throws away what you substituted for.",
      },
      {
        mistake: "Treating modal jazz as an excuse to play fewer chords and nothing else.",
        fix: "With the harmony still, everything else has to carry the music — the line, the register, the rhythm, the space. Fewer chords is harder, not easier.",
      },
    ],
    listening: [
      {
        piece: "Giant Steps",
        composer: "John Coltrane",
        why: "ii-V-I in three keys a major third apart, cycling fast. The sentence under pressure.",
      },
      {
        piece: "Kind of Blue",
        composer: "Miles Davis",
        why: "The modal jazz record. Hear how much happens with how little harmonic movement.",
      },
      {
        piece: "Maiden Voyage",
        composer: "Herbie Hancock",
        why: "Quartal and suspended voicings as the whole harmonic identity of a tune.",
      },
    ],
    practiceRoutine: [
      "Play ii-V-I in all twelve keys, voicing only the guide tones in your right hand.",
      "Take a ii-V-I and substitute the dominant. Play both versions and listen to the bass.",
      "Voice one chord three ways — in thirds, in fourths, and with the third omitted — and name what each voicing is good for.",
    ],
  },

  "post-tonal-theory": {
    summary:
      "You will be able to reduce a chord to its prime form, build and transform a twelve-tone row, and say what minimalism, spectralism and chance each put in the place tonality used to occupy.",
    estimatedMinutes: 32,
    keyTerms: [
      { term: "Atonality", definition: "Music that avoids establishing any pitch as home. Harder than it sounds, because the ear nominates a tonic at the slightest excuse." },
      { term: "Pitch class", definition: "A note with octave and spelling ignored. C, B sharp and the C three octaves up are all pitch class 0." },
      { term: "Prime form", definition: "A set reduced to its most compact ordering from zero, so that transpositions and inversions of the same shape are recognisable as one thing." },
      { term: "Row", definition: "All twelve pitch classes in a fixed order, from which a serial piece is derived." },
      { term: "Prime, inversion, retrograde, retrograde inversion", definition: "The four forms of a row, each available at twelve transpositions — forty-eight in all." },
      { term: "Process", definition: "A rule the music follows audibly: phasing, additive rhythm, a gradual transformation. Minimalism's substitute for development." },
      { term: "Spectralism", definition: "Harmony derived from the overtone analysis of a real sound rather than from a scale." },
    ],
    commonMistakes: [
      {
        mistake: "Writing 'atonal' music by avoiding the notes of one key, which produces another key.",
        fix: "Avoiding C major's notes leaves you leaning on the rest. Atonality needs all twelve used evenly, and octave doublings and repeated pitches are what give a tonic away.",
      },
      {
        mistake: "Treating a twelve-tone row as a melody to be stated and restated.",
        fix: "The row is material, not a tune. It can be split between instruments, stacked into chords, or run in several forms at once — Schoenberg's own music does all three.",
      },
      {
        mistake: "Assuming set theory will tell you whether music is good.",
        fix: "It is a descriptive tool. It names what is there and groups related sonorities; it has no opinion, and an analysis that stops at the prime form has not said anything yet.",
      },
    ],
    listening: [
      {
        piece: "Pierrot Lunaire",
        composer: "Arnold Schoenberg",
        why: "Freely atonal rather than serial, and the clearest demonstration that abandoning a tonic need not mean abandoning expression.",
      },
      {
        piece: "Variations for Orchestra, Op. 31",
        composer: "Arnold Schoenberg",
        why: "Twelve-tone writing for full orchestra, with the row's forms audible as the variations proceed.",
      },
      {
        piece: "Music for 18 Musicians",
        composer: "Steve Reich",
        why: "Process as structure. You can hear the rule being followed, which is the point of it.",
      },
      {
        piece: "Partiels",
        composer: "Gérard Grisey",
        why: "An orchestra tuned to the overtone spectrum of a trombone note. Spectralism stated as plainly as it ever is.",
      },
    ],
    practiceRoutine: [
      "Write a twelve-tone row, then write out its inversion, retrograde and retrograde inversion. Check that each uses all twelve pitches exactly once.",
      "Reduce three chords you have written to prime form and see whether any two are the same shape.",
      "Write eight bars governed by one audible process, and state the rule in a sentence before you begin.",
    ],
  },

  "advanced-analysis": {
    summary:
      "You will be able to reduce a phrase to its structural line, name a Neo-Riemannian transformation between two chords, and ask a better question of a sonata than which section it is in.",
    estimatedMinutes: 32,
    keyTerms: [
      { term: "Foreground, middleground, background", definition: "Schenker's three layers: the notes as written, the structure under the decoration, and the fundamental line that spans the piece." },
      { term: "Urlinie", definition: "The fundamental descending line — commonly 3-2-1 or 5-4-3-2-1 — that a tonal work is understood to prolong." },
      { term: "Prolongation", definition: "Keeping a harmony in force across a passage that moves away from it and returns. What the middleground is made of." },
      { term: "Parallel, relative, leading-tone (P, R, L)", definition: "The three Neo-Riemannian moves between triads, each changing one note: major to parallel minor, to relative, and to the triad a third above sharing two notes." },
      { term: "Sonata Theory", definition: "Hepokoski and Darcy's account of sonata form as a set of expectations a movement meets, delays or refuses, rather than a shape it fills in." },
    ],
    commonMistakes: [
      {
        mistake: "Reducing a phrase by deleting the notes you find less interesting.",
        fix: "Reduction follows the harmony. A note is structural because it is a chord tone at a strong metrical position that the voice leading depends on — not because it is the one you liked.",
      },
      {
        mistake: "Using Neo-Riemannian labels on music that functional harmony explains perfectly well.",
        fix: "P, R and L earn their keep where roman numerals do not: chromatic third relations with no dominant preparation. On a plain ii-V-I they add nothing but vocabulary.",
      },
      {
        mistake: "Deciding where the development begins and calling that an analysis.",
        fix: "Labelling the sections is the first five minutes. The question worth asking is what the movement does with the expectation — where it arrives late, or wrong, or not at all.",
      },
    ],
    listening: [
      {
        piece: "Symphony No. 5, first movement",
        composer: "Ludwig van Beethoven",
        why: "The most analysed movement there is, and the one where a reduction most obviously reveals something: four notes prolonged across seven minutes.",
      },
      {
        piece: "Symphony No. 9, second movement",
        composer: "Franz Schubert",
        why: "Chromatic third relations throughout, which is where the Neo-Riemannian tools start to be the right ones.",
      },
      {
        piece: "Tristan und Isolde, Prelude",
        composer: "Richard Wagner",
        why: "Harmony that functional analysis can label and cannot explain. The test case for every theory that came after.",
      },
    ],
    practiceRoutine: [
      "Reduce an eight-bar phrase to one note per bar, then to one note per two bars, and see whether a line emerges.",
      "Take two chords a third apart and name the single-note move that connects them.",
      "Pick a sonata movement and write one sentence about what it does that the textbook shape does not predict.",
    ],
  },

  "ear-training-fluency": {
    summary:
      "You will have a daily routine that turns what you know into what you can hear, and a way to measure whether it is working.",
    estimatedMinutes: 30,
    keyTerms: [
      { term: "Movable-do solfège", definition: "Do is the tonic of whatever key you are in, so the syllables name scale-degree function rather than absolute pitch." },
      { term: "Fixed-do solfège", definition: "Do is always C. Useful for reading, less useful for hearing function." },
      { term: "Dictation", definition: "Hearing something and writing it down. The only unambiguous test of whether you heard it." },
      { term: "Relative pitch", definition: "Identifying notes by their distance from a reference. Trainable, and what the work in this lesson builds." },
      { term: "Audiation", definition: "Hearing music in your head without it sounding. What score reading actually is." },
    ],
    commonMistakes: [
      {
        mistake: "Practising intervals in isolation and never in a key.",
        fix: "Most listening is functional. A minor third from the tonic sounds different from the same interval between the fourth and sixth degrees, and only the first is what you usually need.",
      },
      {
        mistake: "Doing an hour of ear training once a week.",
        fix: "Ten minutes a day beats seventy minutes on Sunday, every time. This is one of the few things in music where that is not a platitude but a measurable effect.",
      },
      {
        mistake: "Checking an answer at the keyboard before committing to it.",
        fix: "Write it down first, then check. Checking first trains recognition of your own guesses, which is not a skill anybody needs.",
      },
    ],
    listening: [
      {
        piece: "Two-Part Inventions",
        composer: "J. S. Bach",
        why: "Two lines only, so dictation is possible in full. Start here rather than with anything orchestral.",
      },
      {
        piece: "Lieder ohne Worte",
        composer: "Felix Mendelssohn",
        why: "Melody and accompaniment plainly separated, which makes taking down the tune a reasonable thing to attempt.",
      },
    ],
    practiceRoutine: [
      "Ten intervals a day, named before checking. Keep the score and watch it move.",
      "Sing a major scale in movable-do, then sing the degrees in a random order against a held tonic.",
      "Take four bars of a two-part piece and write both lines from hearing before you look.",
      "Read one page of a score away from any instrument, then play it and find out what you missed.",
    ],
  },

  "full-score-layout": {
    summary:
      "You will be able to lay out a full score in the order every player expects, and bracket, brace and bar it so that nothing has to be explained.",
    estimatedMinutes: 26,
    keyTerms: [
      { term: "Score order", definition: "Woodwind, brass, percussion, harp and keyboard, voices, strings — top to bottom, highest instrument first within each family." },
      { term: "Bracket", definition: "The straight line joining a whole family of instruments at the left edge." },
      { term: "Brace", definition: "The curly line joining two staves played by one player, such as harp or piano." },
      { term: "Divisi", definition: "One section split across two staves or two lines of one staff, marked div. and cancelled with unis." },
      { term: "Transposed score", definition: "One where each part appears as its player reads it. A score in C — concert pitch — shows what sounds instead." },
    ],
    commonMistakes: [
      {
        mistake: "Inventing an order that suits the piece.",
        fix: "The order is a convention worth more than any local convenience. A conductor finds the second horn by looking where the second horn always is, and a score that rearranges things costs rehearsal time.",
      },
      {
        mistake: "Running barlines through the entire system.",
        fix: "Barlines run through a family and break between families, so the eye can find a staff. Through-barring everything makes twenty staves into one grey block.",
      },
      {
        mistake: "Leaving a reader to guess whether the score is transposed.",
        fix: "Say so on the first page. Both conventions are in use, and the difference is a major second on a dozen staves.",
      },
    ],
    listening: [
      {
        piece: "Symphony No. 4, first movement",
        composer: "Johannes Brahms",
        why: "A standard late-romantic orchestra laid out the standard way. The score to learn the shape from.",
      },
      {
        piece: "The Rite of Spring",
        composer: "Igor Stravinsky",
        why: "A very large orchestra in the same order, which is how you can read it at all.",
      },
    ],
    practiceRoutine: [
      "Write the staff order for a standard orchestra from memory, then check it against any published score.",
      "Take a four-part chorale and lay it out as a woodwind quartet score, with the right brackets.",
      "Find a divisi passage in a published score and copy its marking exactly — including how it is cancelled.",
    ],
  },

  "transposing-instruments": {
    summary:
      "You will be able to write the note a player reads so that the pitch you intended is the pitch the room hears, in both directions, without checking a table.",
    estimatedMinutes: 28,
    keyTerms: [
      { term: "Sounding pitch", definition: "What is heard. Also called concert pitch." },
      { term: "Written pitch", definition: "What is on the player's page." },
      { term: "Interval of transposition", definition: "Sounding minus written. For a B flat trumpet it is a major second down." },
      { term: "Octave transposition", definition: "Piccolo and celesta sound an octave above the written note; double bass and contrabassoon an octave below." },
      { term: "Horn convention", definition: "Horn in F sounds a perfect fifth below the written note, and its parts are traditionally written without a key signature, with accidentals as needed." },
    ],
    commonMistakes: [
      {
        mistake: "Transposing the wrong way, so a B flat trumpet part sounds a major second below what was intended.",
        fix: "The written note is higher than the sounding note for every instrument that transposes downward. Want a concert C from a B flat trumpet: write D. If in doubt, work one note out slowly and let the rest follow.",
      },
      {
        mistake: "Forgetting that the key signature transposes too.",
        fix: "A B flat clarinet playing in concert E flat major reads F major. Writing the concert key signature over transposed notes gives the player a part full of accidentals contradicting it.",
      },
      {
        mistake: "Overlooking the octave transposers because they are not 'really' transposing.",
        fix: "A piccolo part written where you want it to sound will come out an octave too high, which is just as wrong as a trumpet a second out — and much more audible.",
      },
    ],
    listening: [
      {
        piece: "Boléro",
        composer: "Maurice Ravel",
        why: "The same melody passed through almost every transposing instrument in the orchestra, so the written parts differ wildly while the tune does not.",
      },
      {
        piece: "Symphony No. 5, third movement",
        composer: "Dmitri Shostakovich",
        why: "Exposed writing for clarinets in A and B flat, where the choice of instrument is itself an orchestration decision.",
      },
    ],
    practiceRoutine: [
      "Write a concert C for B flat trumpet, A clarinet, F horn, E flat alto saxophone and piccolo. Five answers, all different.",
      "Go the other way: name what sounds when each of those plays a written G.",
      "Transpose a four-bar chorale soprano line for horn in F, with no key signature, and check one note at a keyboard.",
    ],
  },

  "string-section-writing": {
    summary:
      "You will be able to tell a divisi from a double stop, judge whether a double stop is reachable, and write bow instructions that get you the tone you imagined.",
    estimatedMinutes: 28,
    keyTerms: [
      { term: "Divisi", definition: "The section splits: half the players take each line, one bow each. Marked div., cancelled with unis." },
      { term: "Double stop", definition: "One player bows two strings at once. Every player in the section plays both notes." },
      { term: "Natural harmonic", definition: "A node on an open string, touched not pressed. Written with a small circle, or as a diamond at the touched point." },
      { term: "Artificial harmonic", definition: "A stopped note with a harmonic above it, notated as a stopped notehead plus a diamond a fourth higher." },
      { term: "Sul ponticello / sul tasto", definition: "Bowing at the bridge for a glassy hiss; over the fingerboard for a flutey, hollow softness." },
      { term: "Con sordino", definition: "With the mute on. Takes the edge off rather than simply reducing volume, and takes a moment to fit." },
    ],
    commonMistakes: [
      {
        mistake: "Writing a chord on one staff and expecting the section to divide itself.",
        fix: "Say which. Two notes on a violin staff is a double stop unless marked div., and the two readings sound entirely different — one bow per note against one bow for both.",
      },
      {
        mistake: "Writing double stops that no hand can reach.",
        fix: "Thirds, sixths and octaves on adjacent strings are comfortable. Anything needing one finger on two distant frets is not, and a double stop containing an open string is always easier.",
      },
      {
        mistake: "Asking for a mute and giving no time to fit it.",
        fix: "Con sordino and senza sordino need a bar or two of rest. A mute change on the last quarter of a bar will be missed or audible.",
      },
    ],
    listening: [
      {
        piece: "Metamorphosen",
        composer: "Richard Strauss",
        why: "Twenty-three solo strings, each with its own line. Divisi writing taken as far as it goes.",
      },
      {
        piece: "Fantasia on a Theme by Thomas Tallis",
        composer: "Ralph Vaughan Williams",
        why: "A divided string orchestra used for spatial depth rather than thickness.",
      },
      {
        piece: "Threnody for the Victims of Hiroshima",
        composer: "Krzysztof Penderecki",
        why: "Fifty-two separate string parts, and most of the bow techniques in the lesson, used structurally.",
      },
    ],
    practiceRoutine: [
      "Write five double stops for violin and mark which are easy, which are awkward and which are impossible.",
      "Take one chord and write it twice: once div. across the first violins, once as double stops. Name the difference.",
      "Write four bars of one melody with a bow instruction change every bar, and say in words what each one is for.",
    ],
  },

  "extended-techniques": {
    summary:
      "You will be able to ask for an unusual sound in a way a player can execute on the first reading, and judge whether the sound will survive the texture around it.",
    estimatedMinutes: 30,
    keyTerms: [
      { term: "Flutter-tongue", definition: "A rolled tongue or throat while playing. A dry rattle, available on flutes and brass at any dynamic." },
      { term: "Key click", definition: "The pads alone, no breath. Pitched percussion at a whisper — it will not carry over anything." },
      { term: "Bartók pizzicato", definition: "The string snapped against the fingerboard. Written with a circled vertical stroke. Loud, and hard on the instrument." },
      { term: "Col legno", definition: "Struck or drawn with the wood of the bow. Battuto is struck, tratto is drawn." },
      { term: "Multiphonic", definition: "More than one pitch at once from a single wind instrument, got from a specific unconventional fingering." },
      { term: "Legend", definition: "The page at the front of the score that defines every unusual symbol used. Not optional." },
    ],
    commonMistakes: [
      {
        mistake: "Inventing a symbol and trusting it to be obvious.",
        fix: "Name the technique in words the first time, give an abbreviation for later appearances, and put every symbol in a legend at the front. A player meeting your notation for the first time in a rehearsal will stop.",
      },
      {
        mistake: "Writing a quiet technique underneath a loud texture.",
        fix: "Most of these are soft. A key click under a brass chord does not exist, and a sul ponticello whisper dies inside a tutti. Thin the texture around the effect, or do not write it.",
      },
      {
        mistake: "Using every technique available because they are interesting.",
        fix: "An unusual sound works by departing from a norm you have established. Twenty pages of departures is a new norm, and nothing in it can be strange any more.",
      },
    ],
    listening: [
      {
        piece: "Threnody for the Victims of Hiroshima",
        composer: "Krzysztof Penderecki",
        why: "Extended string technique as the entire language of a piece, with its own notation and its own legend.",
      },
      {
        piece: "Density 21.5",
        composer: "Edgard Varèse",
        why: "Solo flute, with key clicks and extremes of register used structurally. Audible because there is nothing to cover them.",
      },
      {
        piece: "Sequenza V",
        composer: "Luciano Berio",
        why: "Trombone technique pushed past the conventional and notated precisely enough to be repeatable.",
      },
    ],
    practiceRoutine: [
      "Write a legend for four techniques, each defined in one sentence a player could act on.",
      "Write eight bars that establish an ordinary sound, depart into one extended technique, and return.",
      "Take a quiet technique and write the texture that would let it be heard.",
    ],
  },

  "orchestral-balance-colour": {
    summary:
      "You will be able to space a chord so it sounds solid, double a line for colour rather than volume, and write dynamics that produce the balance you intended.",
    estimatedMinutes: 30,
    keyTerms: [
      { term: "Dynamic weight", definition: "How loud an instrument is at a given marking relative to the others. One trombone at forte covers a flute section." },
      { term: "The pyramid", definition: "Spacing a chord like the harmonic series: wide intervals low down, closer ones higher, weight underneath." },
      { term: "Unison doubling", definition: "Two instruments on the same line at the same pitch. Produces a new colour rather than a louder one." },
      { term: "Octave doubling", definition: "Doubling a line an octave away, which brightens or weights it depending on direction." },
      { term: "Tutti", definition: "Everyone playing. Worth saving, because once everyone is in there is nowhere louder to go." },
    ],
    commonMistakes: [
      {
        mistake: "Writing the same dynamic on every staff and expecting balance.",
        fix: "A dynamic is an instruction about effort, not an outcome. For a flute solo over brass, the brass need to be two or three marks quieter than the flute, written down.",
      },
      {
        mistake: "Spacing a chord evenly from bottom to top.",
        fix: "Close intervals low down are mud. Spread the bottom, tighten as you rise, and put more weight below than above — the chord will sound both fuller and clearer.",
      },
      {
        mistake: "Reaching full orchestra in the first minute.",
        fix: "Hold something back. A climax is a comparison, and if the texture has been complete throughout there is nothing left for it to be louder or fuller than.",
      },
    ],
    listening: [
      {
        piece: "Pictures at an Exhibition",
        composer: "Mussorgsky, orchestrated by Ravel",
        why: "A known piano piece orchestrated by a master of colour. Compare the two and every choice is visible.",
      },
      {
        piece: "Symphony No. 1, fourth movement",
        composer: "Johannes Brahms",
        why: "A long approach to a tutti that is held back until it means something.",
      },
      {
        piece: "Daphnis et Chloé",
        composer: "Maurice Ravel",
        why: "Orchestral colour as the subject of the music rather than the clothing of it.",
      },
    ],
    practiceRoutine: [
      "Orchestrate one four-bar phrase three ways, for the same ensemble, and write a sentence on what each version is for.",
      "Voice one chord as a pyramid and again evenly spaced. Play both and judge which sounds like one chord.",
      "Take something you have written at full orchestra and cut it to half the players without losing the line.",
    ],
  },

  "large-form-architecture": {
    summary:
      "You will be able to plan twenty minutes in minutes rather than bars, place a climax on purpose, and get between two sections without the seam showing.",
    estimatedMinutes: 34,
    keyTerms: [
      { term: "Thematic transformation", definition: "Returning material recognisably changed — in rhythm, harmony, tempo, register or orchestration — rather than merely repeated." },
      { term: "Proportion", definition: "Where things happen as a fraction of the whole. The principal climax around two thirds of the way through is a default worth knowing before departing from it." },
      { term: "Long-range harmonic plan", definition: "Which keys the piece visits and in what order, decided before the bars are written." },
      { term: "Transition", definition: "The passage joining two sections. The hardest writing in the piece, and the first place a long form fails." },
      { term: "Climax", definition: "The loudest, highest or densest point, which works only in comparison with everything around it." },
    ],
    commonMistakes: [
      {
        mistake: "Writing good sections and assuming the piece will hold together.",
        fix: "Sections are craft; joining them is architecture. Plan the transitions before writing the sections, and the sections will be shaped to be joinable.",
      },
      {
        mistake: "Planning the piece in bars.",
        fix: "Plan in minutes. Twenty bars at one tempo and twenty at another are not comparable spans, and a listener experiences time rather than bar numbers.",
      },
      {
        mistake: "Repeating returning material unchanged after ten minutes.",
        fix: "A listener who has travelled ten minutes has changed, and material that returns identical sounds like an error. Transform it — the recognition is the point, the sameness is not.",
      },
      {
        mistake: "Placing several climaxes of equal weight.",
        fix: "Then there is no climax. Rank them, and let the smaller ones be audibly smaller.",
      },
    ],
    listening: [
      {
        piece: "Symphony No. 9, first movement",
        composer: "Ludwig van Beethoven",
        why: "Fifteen minutes built from a figure stated at the very opening, transformed throughout. The reference for large-scale coherence.",
      },
      {
        piece: "Symphony No. 2, fourth movement",
        composer: "Jean Sibelius",
        why: "A long approach to a single climax, with the whole movement audibly aimed at it.",
      },
      {
        piece: "Symphony No. 5, fourth movement",
        composer: "Gustav Mahler",
        why: "Thematic transformation across a very long span, in a movement that is almost entirely about one idea changing.",
      },
    ],
    practiceRoutine: [
      "Draw a timeline of a twenty-minute piece in minutes, marking each section and the principal climax.",
      "Take one four-bar theme and write five transformations of it, each changing exactly one thing.",
      "Write two transitions between the same pair of sections — one that pivots on a shared chord, one that dissolves the texture — and choose.",
    ],
  },
};
