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
      { term: "Whole step (tone)", definition: "Two half steps." },
      { term: "Step pattern", definition: "The ordered sequence of whole and half steps that defines a scale's character." },
    ],
    commonMistakes: [
      {
        mistake: "Assuming a whole step always means 'skip the black key'.",
        fix: "Between E and F, and between B and C, there is no black key at all — those are natural half steps. E to F♯ is the whole step.",
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
      "Write a four-note motif.",
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
};
