import type { SeedLesson } from "./types";

/**
 * Level 6 — The Full Score.
 *
 * Everything before this teaches how music works and how to write a line, a
 * progression, a form. This level is about the page itself: twenty-odd staves
 * that have to be laid out in the right order, written in the right keys for
 * the players reading them, balanced so the thing you hear in your head is the
 * thing the room hears, and sustained over a span long enough to need
 * architecture rather than a shape.
 *
 * It is deliberately the last level. None of it is useful until you can
 * already write the music that goes on the page.
 */
export const orchestralLessons: SeedLesson[] = [
  {
    slug: "full-score-layout",
    title: "Reading and Building a Full Score",
    description: "Twenty staves in the order every player expects to find them.",
    category: "ORCHESTRATION",
    difficulty: 9,
    tierRequirement: "VIRTUOSO_REPERTOIRE",
    order: 26,
    xpReward: 190,
    // The last unit of Level 5, not the craft lesson "virtuoso-writing" —
    // craft lessons sit alongside the roadmap rather than inside it, so
    // chaining a roadmap lesson to one puts Level 6 behind an optional detour.
    prerequisiteSlug: "ear-training-fluency",
    content: [
      {
        heading: "The Order Is Not Negotiable",
        body: "A full score runs top to bottom in families: woodwind, brass, percussion, harp and keyboard, voices, strings. Inside each family, highest instrument first. Woodwind: piccolo, flutes, oboes, cor anglais, clarinets, bass clarinet, bassoons, contrabassoon. Brass: horns, trumpets, trombones, tuba. Then timpani, then the rest of the percussion, then harp and keyboards, then any voices, then first violins, second violins, violas, cellos, double basses. A conductor's eye goes to a place on the page before it reads a name — put an instrument somewhere else and you have cost them the bar.",
        example: "Top to bottom: Picc · Fl 1.2 · Ob 1.2 · C.A. · Cl 1.2 · B.Cl · Bsn 1.2 · Cbsn ‖ Hn 1-4 · Tpt 1-3 · Tbn 1-3 · Tuba ‖ Timp · Perc ‖ Hp · Pno ‖ Vn I · Vn II · Va · Vc · Cb",
        callout: {
          kind: "note",
          text: "Horns sit above trumpets even though they usually sound lower. It is a four-hundred-year-old convention and nobody is going to change it for your piece.",
        },
      },
      {
        heading: "Braces, Brackets and Barlines",
        body: "A bracket joins a family; a brace joins two staves played by one player, such as harp or piano. Barlines run through a whole family and break between families, so the eye can find the woodwind block without counting staves. Two players sharing one stave are marked a2 when they play the same notes, and 1./2. when they split. Strings are the exception: the whole string group is barred through as one block.",
      },
      {
        heading: "What Goes Above and Below",
        body: "Tempo, metronome marks and rehearsal letters go above the top staff of the score, and are repeated above the strings so the lower half of the page has them too. Dynamics and articulation belong to each individual staff — a hairpin on the flute says nothing about the cellos. Techniques that change how an instrument is played (con sordino, pizz., a2) go above the staff; expressive dynamics go below it, except for vocal staves, where everything goes above so the words can sit underneath.",
        callout: {
          kind: "warning",
          text: "One dynamic marking at the top of the page is the single most common amateur score error. Every staff carries its own.",
        },
      },
    ],
    quiz: [
      {
        subject: "SCORE_ORDER",
        difficulty: 9,
        prompt: "In a standard full score, which instrument appears highest on the page?",
        choices: ["First violins", "Horns", "Piccolo", "Timpani"],
        answerIndex: 2,
        explanation:
          "Woodwind is the top family and the piccolo is its highest instrument, so it takes the top staff.",
      },
      {
        subject: "SCORE_ORDER",
        difficulty: 9,
        prompt: "Where do horns sit relative to trumpets in a full score?",
        choices: [
          "Below trumpets, because they sound lower",
          "Above trumpets, by convention",
          "Between trombones and tuba",
          "With the woodwind, because they blend with it",
        ],
        answerIndex: 1,
        explanation:
          "Horns head the brass family above the trumpets. The convention is older than the modern valve horn and is universal.",
      },
      {
        subject: "SCORE_ORDER",
        difficulty: 9,
        prompt: "Two flutes share a stave and play the same line. What marking says so?",
        choices: ["div.", "a2", "unis.", "solo"],
        answerIndex: 1,
        explanation:
          "a2 means both players on that stave play the written notes. div. is for a string section splitting into parts.",
      },
      {
        subject: "SCORE_ORDER",
        difficulty: 9,
        prompt: "A bracket down the left edge of several staves indicates:",
        choices: [
          "One player using two staves",
          "An instrumental family",
          "A repeated section",
          "Music that is optional",
        ],
        answerIndex: 1,
        explanation:
          "A bracket groups a family; a curly brace groups the staves of a single player, like a harpist's two staves.",
      },
    ],
    exercises: [
      {
        type: "PRACTICE",
        title: "Lay Out the Page",
        prompt:
          "Write out, from memory, the full staff order for a standard orchestra with triple woodwind, four horns, three trumpets, three trombones, tuba, timpani, two percussion, harp and strings. Then check it against a published score and note every difference.",
      },
      {
        type: "COMPOSITION",
        title: "Eight Bars, Correctly Laid Out",
        prompt:
          "Write eight bars for at least eight instruments across three families. The music matters less than the page: correct order, correct brackets, dynamics on every staff, techniques above and expression below.",
      },
    ],
    skillRewards: { ORCHESTRATION: 45, INSTRUMENTATION: 25, TECHNIQUE: 10 },
  },
  {
    slug: "transposing-instruments",
    title: "Transposing Instruments",
    description: "Writing the note the player reads, not the note you hear.",
    category: "ORCHESTRATION",
    difficulty: 9,
    tierRequirement: "VIRTUOSO_REPERTOIRE",
    order: 27,
    xpReward: 190,
    prerequisiteSlug: "full-score-layout",
    content: [
      {
        heading: "Why Anyone Would Do This",
        body: "A clarinettist who learns one set of fingerings can pick up a clarinet in A, or a bass clarinet, and play it with the same hands — because the part is written so that the same written note gives the same fingering on every size of the instrument. The cost is that the written note is no longer the sounding note. An instrument 'in B♭' sounds a B♭ when its player reads a C.",
        callout: {
          kind: "insight",
          text: "The rule is one sentence: an instrument in X sounds X when it reads C. Everything below follows from it.",
        },
      },
      {
        heading: "The Ones You Will Actually Write For",
        body: "Clarinet in B♭ and trumpet in B♭ sound a major second below the written note — write a D, hear a C. Clarinet in A sounds a minor third below. Horn in F and cor anglais in F sound a perfect fifth below — write a G, hear a C. Alto saxophone in E♭ sounds a major sixth below; tenor saxophone in B♭ sounds a major ninth below. Bass clarinet in B♭, written in treble clef, sounds a major ninth below.",
        example: "To sound a concert C: write D for B♭ clarinet · E♭ for A clarinet · G for horn in F · A for alto sax",
      },
      {
        heading: "Octaves Count Too",
        body: "Some instruments transpose only by an octave and are easy to forget. Piccolo and celesta sound an octave above the written note; double bass and contrabassoon sound an octave below; glockenspiel sounds two octaves above. Writing a double bass part at sounding pitch buries it under the cellos, and a piccolo part at sounding pitch drowns in ledger lines nobody can read.",
        callout: {
          kind: "warning",
          text: "Transposing the wrong way is the classic error, and it is always by twice the interval. Sing the sounding pitch, then ask which written note produces it.",
        },
      },
      {
        heading: "Key Signatures and Accidentals",
        body: "A transposed part carries its own key signature: for horn in F in concert C major, the part is in G major with one sharp. Horn parts are a partial exception — much orchestral horn writing is notated without a key signature, with every accidental written in, a habit inherited from the valveless natural horn. Whatever you choose, be consistent across the whole score, and never mix transposed and sounding parts in one movement.",
      },
    ],
    quiz: [
      {
        subject: "TRANSPOSITION",
        difficulty: 9,
        prompt: "You want a B♭ clarinet to sound a concert F. What do you write?",
        choices: ["E♭", "F", "G", "A"],
        answerIndex: 2,
        explanation:
          "A B♭ instrument sounds a major second below what it reads, so the written note is a major second above the sounding one: G sounds F.",
      },
      {
        subject: "TRANSPOSITION",
        difficulty: 9,
        prompt: "A horn in F reads a written A. What pitch sounds?",
        choices: ["A", "D", "E", "B"],
        answerIndex: 1,
        explanation:
          "Horn in F sounds a perfect fifth below the written note. Written A sounds D.",
      },
      {
        subject: "TRANSPOSITION",
        difficulty: 9,
        prompt: "Which instrument sounds an octave LOWER than written?",
        choices: ["Piccolo", "Celesta", "Double bass", "Glockenspiel"],
        answerIndex: 2,
        explanation:
          "The double bass sounds an octave below the notated pitch, which is why it can share a stave with the cellos and still sound beneath them.",
      },
      {
        subject: "TRANSPOSITION",
        difficulty: 9,
        prompt: "The concert key is C major. What key signature does the horn in F part carry, when one is used?",
        choices: ["F major", "G major", "B♭ major", "D major"],
        answerIndex: 1,
        explanation:
          "Horn in F is written a perfect fifth above sounding pitch, so concert C major becomes G major — one sharp.",
      },
    ],
    exercises: [
      {
        type: "PRACTICE",
        title: "Both Directions",
        prompt:
          "Take a four-bar melody in concert pitch. Write it out for B♭ clarinet, horn in F and alto saxophone with correct key signatures. Then reverse the exercise: given those three parts, write the concert-pitch melody back out and check it matches.",
      },
      {
        type: "COMPOSITION",
        title: "The Transposed Chorale",
        prompt:
          "Write a sixteen-bar chorale for a transposing quartet — B♭ clarinet, horn in F, B♭ trumpet and bassoon. Every part correctly transposed, and a concert-pitch sketch that proves the harmony you intended is the harmony that sounds.",
      },
    ],
    skillRewards: { ORCHESTRATION: 40, INSTRUMENTATION: 35, HARMONY: 10 },
  },
  {
    slug: "string-section-writing",
    title: "Writing for the String Section",
    description: "Divisi, double stops, harmonics, and sixty players on five staves.",
    category: "ORCHESTRATION",
    difficulty: 9,
    tierRequirement: "VIRTUOSO_REPERTOIRE",
    order: 28,
    xpReward: 190,
    prerequisiteSlug: "transposing-instruments",
    content: [
      {
        heading: "Divisi Is Not a Double Stop",
        body: "div. splits a section: half the first violins take the upper note, half the lower, and each player uses one bow on one line. A double stop asks every player to sound both notes at once. They sound different — divisi is thinner and cleaner, double stops are rougher and louder — and they are not interchangeable. If a chord is not reachable by one hand, divisi is not a stylistic choice, it is the only option. Mark the return with unis.",
        callout: {
          kind: "note",
          text: "div. a 3 splits a section three ways and costs you two thirds of the volume on each line. Deep divisi makes a section quiet, not rich.",
        },
      },
      {
        heading: "What a Hand Can Reach",
        body: "Violin and viola double stops sit naturally in thirds, sixths and octaves on adjacent strings. Any double stop containing an open string is easier and louder. Perfect fifths are awkward — one finger must stop two strings. Cellos span smaller intervals than violins because the instrument is larger: a tenth is a stretch. Three- and four-note chords on any bowed string instrument cannot be sustained; the bow rolls across them, so write them where a spread is musically wanted.",
        example: "Idiomatic: Vn 3rds and 6ths, or anything over an open G, D, A or E · Awkward: sustained perfect fifths, or a cello tenth held under a moving line",
      },
      {
        heading: "Harmonics",
        body: "A natural harmonic touches an open string at a node and is written as a small circle over the sounding pitch, or as a diamond notehead at the touched point. Artificial harmonics are written with a solid notehead for the stopped pitch and a diamond a perfect fourth above it, and sound two octaves above the solid note. Both are quiet, glassy and slightly unreliable in fast passages — write them exposed, where the colour is the point, and never in a tutti where nobody will hear them.",
      },
      {
        heading: "The Bow Is the Dynamic",
        body: "Everything a string section can do to its tone is a bow instruction: sul ponticello at the bridge for a glassy, metallic hiss; sul tasto over the fingerboard for a breathy, colourless hush; col legno tratto drawn with the wood; col legno battuto struck with it. Add con sordino for mutes, which take time to fit — give at least a bar of rest before and after. Mark the cancellation every time: ord., senza sordino, naturale.",
        callout: {
          kind: "warning",
          text: "A technique with no cancellation runs to the end of the movement. Players will do exactly what the part says.",
        },
      },
    ],
    quiz: [
      {
        subject: "STRINGS",
        difficulty: 9,
        prompt: "You need a four-note sustained chord from the first violins. What do you write?",
        choices: [
          "A four-note double stop",
          "div. a 4",
          "Tremolo across all four notes",
          "It cannot be done at all",
        ],
        answerIndex: 1,
        explanation:
          "Bowed instruments cannot sustain four notes at once — the bow rolls across them. Dividing the section gives each player one line to sustain.",
      },
      {
        subject: "STRINGS",
        difficulty: 9,
        prompt: "Which double stop is most idiomatic on the violin?",
        choices: [
          "A sustained perfect fifth",
          "A sixth on adjacent strings",
          "A minor ninth",
          "A perfect fourth requiring two shifts",
        ],
        answerIndex: 1,
        explanation:
          "Thirds, sixths and octaves on adjacent strings lie under the hand. A fifth makes one finger stop two strings at once.",
      },
      {
        subject: "STRINGS",
        difficulty: 9,
        prompt: "An artificial harmonic is notated with a stopped note and a diamond a perfect fourth above. What sounds?",
        choices: [
          "The stopped note",
          "The diamond pitch",
          "Two octaves above the stopped note",
          "One octave above the diamond",
        ],
        answerIndex: 2,
        explanation:
          "Touching a fourth above a stopped note produces the fourth partial, two octaves above the stopped pitch.",
      },
      {
        subject: "STRINGS",
        difficulty: 9,
        prompt: "Which instruction produces a glassy, metallic sound near the bridge?",
        choices: ["sul tasto", "sul ponticello", "col legno", "con sordino"],
        answerIndex: 1,
        explanation:
          "Sul ponticello is bowed at the bridge. Sul tasto is over the fingerboard and is the opposite: soft and colourless.",
      },
    ],
    exercises: [
      {
        type: "PRACTICE",
        title: "Playable or Not",
        prompt:
          "Write down ten string chords of your own invention. For each, decide whether it is a double stop, needs divisi, or is unplayable — and say why. Check the hand span for cello and violin separately.",
      },
      {
        type: "COMPOSITION",
        title: "Strings Alone",
        prompt:
          "Write twenty-four bars for string orchestra using at least three different bow techniques, one passage of divisi with a marked return to unis., and one exposed harmonic. Every technique cancelled where it ends.",
      },
    ],
    skillRewards: { ORCHESTRATION: 40, INSTRUMENTATION: 30, TECHNIQUE: 15 },
  },
  {
    slug: "extended-techniques",
    title: "Extended Techniques",
    description: "The sounds an instrument makes when you stop asking it for notes.",
    category: "ORCHESTRATION",
    difficulty: 10,
    tierRequirement: "VIRTUOSO_REPERTOIRE",
    order: 29,
    xpReward: 200,
    prerequisiteSlug: "string-section-writing",
    content: [
      {
        heading: "Winds and Brass",
        body: "Flutter-tonguing rolls the tongue or throat while playing, and works on flutes and brass — a dry rattle at any dynamic. Key clicks are the pads alone, pitchless and percussive. Multiphonics sound two or more pitches at once on a single wind instrument, and depend on specific fingerings rather than on what you would like to hear, so they must be taken from a fingering chart. Brass add mutes — straight for a hard nasal edge, cup for something softer and covered, harmon for the thin buzzing voice — and hand-stopping on the horn, written with a + and cancelled with an o.",
        callout: {
          kind: "warning",
          text: "Multiphonics are not chosen freely. Write the fingering above the staff and take the sounding pitches from a chart for that instrument, or you have written a wish rather than a note.",
        },
      },
      {
        heading: "Strings, Beyond the Bow",
        body: "Bartók pizzicato snaps the string against the fingerboard and is written with a circle and a vertical stroke — loud, percussive, and hard on the instrument, so use it sparingly. Left-hand pizzicato, marked with a +, plucks while the bow continues elsewhere. Behind-the-bridge bowing gives unpitched squeaks. Scordatura retunes a string entirely, which changes every fingering on that string and must be notated as the player will read it, not as it sounds.",
      },
      {
        heading: "Notate It So It Can Be Played",
        body: "An extended technique is only as good as its instruction. Name the technique in words the first time it appears, add a staff text abbreviation for repeats, and put a legend at the front of the score explaining every symbol you have invented. Give the player time to prepare: fitting a mute, retuning a string, or picking up a beater takes bars, not beats. And cancel everything — ord. brings the instrument back to normal playing.",
        callout: {
          kind: "insight",
          text: "If a performer has to email you to ask what a symbol means, the symbol has failed, however beautiful the sound in your head.",
        },
      },
      {
        heading: "Use, Not Decoration",
        body: "Extended techniques are quiet, most of them — a flute key click will not carry over a brass chord, and a sul ponticello whisper dies inside a tutti. They earn their place when they are exposed, when the colour is the musical event rather than an ornament on one, and when the piece has established a normal sound for them to depart from. A score made entirely of special effects has no special effects in it.",
      },
    ],
    quiz: [
      {
        subject: "EXTENDED",
        difficulty: 10,
        prompt: "A + above a horn note, later cancelled by o, indicates:",
        choices: [
          "Left-hand pizzicato",
          "Hand-stopping",
          "Flutter-tonguing",
          "A multiphonic",
        ],
        answerIndex: 1,
        explanation:
          "On the horn, + is hand-stopping and o returns it to open. The same pair of symbols means left-hand pizzicato on strings — context decides.",
      },
      {
        subject: "EXTENDED",
        difficulty: 10,
        prompt: "Which technique snaps the string against the fingerboard?",
        choices: [
          "Sul ponticello",
          "Col legno tratto",
          "Bartók pizzicato",
          "Left-hand pizzicato",
        ],
        answerIndex: 2,
        explanation:
          "Bartók (snap) pizzicato pulls the string away from the instrument so it rebounds off the fingerboard, with a percussive crack.",
      },
      {
        subject: "EXTENDED",
        difficulty: 10,
        prompt: "Why must a wind multiphonic be written with its fingering?",
        choices: [
          "To help the player tune it",
          "Because the sounding pitches depend on the specific fingering, not on choice",
          "Because it is traditional",
          "To show which hand to use",
        ],
        answerIndex: 1,
        explanation:
          "Multiphonics arise from particular fingerings that produce particular sets of pitches. Without the fingering, the notated chord may be unobtainable.",
      },
      {
        subject: "EXTENDED",
        difficulty: 10,
        prompt: "A flute key click is placed inside a full brass tutti. The likely result is:",
        choices: [
          "A striking new colour",
          "Nothing audible",
          "An intonation problem",
          "A balance improvement",
        ],
        answerIndex: 1,
        explanation:
          "Most extended techniques are very quiet. They need exposure to be heard at all, and are wasted inside a loud tutti.",
      },
    ],
    exercises: [
      {
        type: "PRACTICE",
        title: "Write the Legend",
        prompt:
          "Choose five extended techniques across three instrument families. For each, write the notation you would use, the words you would put in the score the first time it appears, and the legend entry. Then say how many bars of preparation the player needs.",
      },
      {
        type: "COMPOSITION",
        title: "Departure and Return",
        prompt:
          "Write sixteen bars that establish an ordinary sound, depart into at least three extended techniques where each is exposed enough to be heard, and return. Every technique named, notated and cancelled.",
      },
    ],
    skillRewards: { ORCHESTRATION: 35, INSTRUMENTATION: 35, EXPRESSION: 20 },
  },
  {
    slug: "orchestral-balance-colour",
    title: "Balance, Blend and Orchestral Colour",
    description: "Making the room hear what you heard.",
    category: "ORCHESTRATION",
    difficulty: 10,
    tierRequirement: "VIRTUOSO_REPERTOIRE",
    order: 30,
    xpReward: 200,
    prerequisiteSlug: "extended-techniques",
    content: [
      {
        heading: "Instruments Are Not Equal",
        body: "One trombone at forte will cover a whole flute section. One oboe will cut through material that swallows four horns. Dynamics are relative to the instrument, not absolute: a trumpet's piano and a flute's piano are nowhere near each other. To make a line audible, the question is never 'how loud did I mark it' but 'what else is sounding in that register at that moment'.",
        callout: {
          kind: "insight",
          text: "Balance is a register problem before it is a dynamic problem. Two instruments a tenth apart do not fight; two in the same octave do.",
        },
      },
      {
        heading: "The Pyramid",
        body: "A chord sounds solid when it is spaced like the harmonic series: wide intervals at the bottom, closer ones as you go up, and weight underneath. Put a close-position triad low in the bass register and it turns to mud; the same chord spread with a fifth or an octave at the bottom rings. Give the bass more players than the top — the pyramid is about numbers as well as spacing.",
        example: "Muddy: Vc and Cb a third apart below the staff · Clear: Cb on the root, Vc a fifth or octave above, upper voices close",
      },
      {
        heading: "Doubling Changes Colour, Not Just Volume",
        body: "Doubling a line at the unison with a different instrument makes a new colour rather than a louder one — flute and clarinet at the unison sound like neither. Doubling at the octave adds brilliance above or weight below. Doubling everything all the time is the surest way to a grey orchestra: the moments that matter are the ones where the doubling changes. Keep a colour in reserve so that its first entry is an event.",
      },
      {
        heading: "Texture as Structure",
        body: "Melody and accompaniment, homophony, polyphony, unison writing, and pure colour-chords are different textures, and an orchestral movement gets much of its shape from moving between them. A tutti that never thins out stops meaning anything after a minute. Plan where the full orchestra plays, and protect it — if everyone has played on every page, the climax has nowhere left to go.",
        callout: {
          kind: "warning",
          text: "The most common fault in a first orchestral score is that everybody plays all the time. Silence in a part is an orchestration decision, not a gap.",
        },
      },
    ],
    quiz: [
      {
        subject: "BALANCE",
        difficulty: 10,
        prompt: "A flute melody is being covered by the horns in the same octave. The best first fix is to:",
        choices: [
          "Mark the flute fortissimo",
          "Move the horns to a different register",
          "Add more flutes",
          "Mute the flute",
        ],
        answerIndex: 1,
        explanation:
          "Balance is first a question of register. Separating them clears the melody without asking anyone to force their tone.",
      },
      {
        subject: "BALANCE",
        difficulty: 10,
        prompt: "Why does a close-position triad low in the bass register sound muddy?",
        choices: [
          "The players are out of tune down there",
          "Low close intervals beat against each other, unlike the wide spacing of the harmonic series",
          "Basses cannot play quietly",
          "It is always written in the wrong clef",
        ],
        answerIndex: 1,
        explanation:
          "The harmonic series is widely spaced at the bottom. Crowding low intervals fights the way the overtones actually lie.",
      },
      {
        subject: "BALANCE",
        difficulty: 10,
        prompt: "Doubling a melody with flute and clarinet at the unison primarily:",
        choices: [
          "Doubles the volume",
          "Creates a composite colour belonging to neither",
          "Improves intonation",
          "Adds brilliance an octave up",
        ],
        answerIndex: 1,
        explanation:
          "Unison doubling of unlike timbres blends into a new colour. Octave doubling is what adds brilliance or weight.",
      },
      {
        subject: "BALANCE",
        difficulty: 10,
        prompt: "A ten-minute movement scored tutti throughout will most likely:",
        choices: [
          "Sound powerful the whole way",
          "Lose its climax, having nowhere louder or fuller to go",
          "Balance itself naturally",
          "Be easier to conduct",
        ],
        answerIndex: 1,
        explanation:
          "A climax is relative. Spending the full orchestra continuously leaves nothing in reserve for the moment that needs it.",
      },
    ],
    exercises: [
      {
        type: "PRACTICE",
        title: "Three Orchestrations",
        prompt:
          "Take one eight-bar melody and orchestrate it three ways: strings alone, woodwind alone, and a mixed tutti. For each, write down which instrument carries the melody, what supports it, and what you deliberately left silent.",
      },
      {
        type: "COMPOSITION",
        title: "Hold Something Back",
        prompt:
          "Write thirty-two bars for full orchestra with a clear climax in the last eight. At least one colour must not appear until that climax, and at least one passage must use fewer than half the players.",
      },
    ],
    skillRewards: { ORCHESTRATION: 45, INSTRUMENTATION: 25, EXPRESSION: 15 },
  },
  {
    slug: "large-form-architecture",
    title: "Large-Form Architecture",
    description: "Holding twenty minutes together on purpose.",
    category: "FORM",
    difficulty: 10,
    tierRequirement: "VIRTUOSO_REPERTOIRE",
    order: 31,
    xpReward: 220,
    prerequisiteSlug: "orchestral-balance-colour",
    content: [
      {
        heading: "Long Music Needs a Different Kind of Plan",
        body: "A two-minute piece holds together because a listener can remember its opening when it ends. A twenty-minute movement cannot rely on that. It needs landmarks that are recognisable after several minutes away, a rate of change slow enough that the ear can follow it, and a sense that the distance travelled was necessary. Sketch the whole span before writing a bar of it: where the peaks are, how long each section lasts in minutes, and what is different at the end.",
      },
      {
        heading: "Thematic Transformation",
        body: "The material that returns after ten minutes should be recognisable but changed. Transformation alters a theme's rhythm, harmony, tempo, register or orchestration while keeping its contour — the same shape in a new light. This is how a single idea can carry a symphony: the theme that opened as a quiet oboe line comes back as a brass chorale, and the listener hears both the identity and the journey at once.",
        example: "Same contour, new light: a lyrical 4/4 theme returning in 3/4 as a slow chorale, then compressed into a driving ostinato",
      },
      {
        heading: "Pacing and Proportion",
        body: "Plan the piece in minutes, not bars. Decide the location of the principal climax as a fraction of the whole — a high point around two thirds of the way through is a durable default, because it leaves room to resolve without hurrying. Give every large section a job: state, develop, destabilise, resolve. The slowest and quietest passage should be placed deliberately, usually just before the biggest one, because contrast makes scale.",
        callout: {
          kind: "insight",
          text: "If you cannot say in one sentence what each section is for, the listener will not be able to hear it either.",
        },
      },
      {
        heading: "Transitions Are the Hard Part",
        body: "Writing good sections is craft; joining them is architecture. A transition can pivot on a shared chord, dissolve the texture until only one element survives and grow the next section from it, or simply stop and start again — but the choice has to be deliberate, and it has to be prepared. The most common failure in a long movement is not a bad theme, it is two good passages bolted together with nothing in between.",
        callout: {
          kind: "warning",
          text: "If a section change only works because the tempo marking says so, it does not work.",
        },
      },
    ],
    quiz: [
      {
        subject: "FORM",
        difficulty: 10,
        prompt: "Thematic transformation keeps which element most recognisable?",
        choices: [
          "The exact rhythm",
          "The orchestration",
          "The melodic contour",
          "The key",
        ],
        answerIndex: 2,
        explanation:
          "Contour is what survives changes of rhythm, harmony, tempo and colour, which is why a transformed theme is still heard as the same theme.",
      },
      {
        subject: "FORM",
        difficulty: 10,
        prompt: "A durable default position for the principal climax of a long movement is:",
        choices: [
          "In the first minute",
          "Exactly halfway",
          "Around two thirds of the way through",
          "In the final bar",
        ],
        answerIndex: 2,
        explanation:
          "Roughly two thirds in leaves enough music afterwards to resolve the climax without rushing, and enough before it to earn it.",
      },
      {
        subject: "FORM",
        difficulty: 10,
        prompt: "Two strong sections joined with no preparation most often produces:",
        choices: [
          "A welcome surprise",
          "A seam the listener hears as a mistake",
          "A modulation",
          "A climax",
        ],
        answerIndex: 1,
        explanation:
          "Unprepared joins read as edits rather than events. A deliberate stop can work — but it must be deliberate and set up.",
      },
      {
        subject: "FORM",
        difficulty: 10,
        prompt: "Why plan a long movement in minutes rather than bars?",
        choices: [
          "Bars are hard to count",
          "Because duration, not bar count, is what a listener experiences as proportion",
          "Because tempo never changes",
          "Publishers require it",
        ],
        answerIndex: 1,
        explanation:
          "Twenty bars of slow 4/4 and twenty bars of fast 2/4 are wildly different spans. Proportion is heard in time.",
      },
    ],
    exercises: [
      {
        type: "PRACTICE",
        title: "The Timeline",
        prompt:
          "Plan a fifteen-minute orchestral movement on one page: each section with a duration in minutes, a one-sentence job, its dynamic and textural level, and the location of the principal climax. Mark every transition and say how each one is made.",
      },
      {
        type: "COMPOSITION",
        title: "Theme and Transformation",
        prompt:
          "Write a theme, then three transformations of it that change rhythm, harmony and orchestration while keeping the contour recognisable. Then write the transition that leads from the first to the second.",
      },
    ],
    skillRewards: { FORM: 50, ORCHESTRATION: 25, MELODY: 15 },
  },
];
