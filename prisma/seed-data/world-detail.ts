/**
 * Atmosphere and guidance layered onto the dungeon by key.
 *
 * Areas get lore and survival tips; bosses get their story and the tactics a
 * player actually needs. Kept apart from world.ts so the structural data stays
 * readable while the writing can grow.
 */

export interface AreaDetail {
  lore: string;
  dangerRating: number; // 1..5
  survivalTips: string[];
}

export interface BossDetail {
  lore: string;
  tactics: string[];
}

export const areaDetail: Record<string, AreaDetail> = {
  "hall-of-melody": {
    dangerRating: 1,
    lore: "The first hall is warm, and that is its trick. Torchlight, dry stone, a distant hum that resolves into a tune you half recognise. Every composer who ever descended started here, and the walls carry their attempts — some scratched in a shaking hand, some carved with terrible confidence. The Hall does not test your knowledge. It tests whether you can make one line of music worth hearing twice.",
    survivalTips: [
      "Decide where your highest note goes before you write anything.",
      "Sing everything you write. If it will not sing, the Hall will not accept it.",
      "Steps hold a line together; leaps give it character. You need mostly the first.",
    ],
  },
  "crypt-of-harmony": {
    dangerRating: 2,
    lore: "Below the Hall the air cools and thickens. The Crypt is where single lines learn they were never alone: every note you played above was standing on something. Chords lie in the alcoves like sleeping things, and disturbing one wakes the three around it. Composers who rush through here write harmony that is correct and dead. The Crypt rewards those who listen to what a chord wants to do next.",
    survivalTips: [
      "Give every progression a job: home, departure, tension, return.",
      "A phrase that ends on the dominant leaves a question. Leave some questions.",
      "When a progression sounds aimless, check whether anything is acting as a dominant. Usually nothing is.",
    ],
  },
  "tower-of-rhythm": {
    dangerRating: 2,
    lore: "The Tower is the only part of the dungeon that moves. Its stairs are not evenly spaced, and the interval between them is the point. Somewhere far above, something enormous keeps perfect time, and the whole structure answers it. Climb carelessly and the Tower will find the beat you were not expecting and put a stair there.",
    survivalTips: [
      "Keep something holding the pulse or your syncopation has nothing to push against.",
      "Count 6/8 in two, not six, unless you want it to plod.",
      "Removing a layer at the climax usually beats adding one.",
    ],
  },
  "hall-of-the-virtuoso": {
    dangerRating: 4,
    lore: "Portraits line this corridor, all of performers, all of them looking slightly past you. The Hall of the Virtuoso is where composers discover the difference between music that is difficult and music that is merely impossible. Written on the far arch, in a hand that clearly belonged to someone who had learned the hard way: THEY HAVE TO BREATHE.",
    survivalTips: [
      "Effective difficulty sounds hard and lies well under the hand. Aim there first.",
      "If you cannot say what a difficult passage expresses, it is decoration.",
      "Write the breaths in yourself, or a performer will put them where you did not want them.",
    ],
  },
  "ancient-conservatory": {
    dangerRating: 3,
    lore: "A ruin of a school, its roof long gone, its rules entirely intact. Desks face a lectern that no one has stood at in centuries, and the exercises chalked on the board are still, annoyingly, correct. The Conservatory teaches counterpoint the way it has always been taught: by making you write two lines that survive each other.",
    survivalTips: [
      "Contrary motion is how two lines stay two lines.",
      "Parallel fifths are forbidden because the ear fuses the voices — the rule is a fact about listening.",
      "Muddy texture is nearly always a counterpoint problem, not an orchestration one.",
    ],
  },
  "impressionist-gardens": {
    dangerRating: 3,
    lore: "The dungeon opens without warning into weather. Light comes from no particular direction, the walls are further away than they look, and nothing resolves — not the paths, not the harmony, not the sense that you have been here before. The Gardens punish composers who need a cadence to feel safe.",
    survivalTips: [
      "Colour can carry a passage that function would only interrupt.",
      "Modal writing needs modal cadences; a V–i drags you back to common practice.",
      "A drone or pedal will hold a mode in place while you decorate above it.",
    ],
  },
  "frozen-conservatory": {
    dangerRating: 4,
    lore: "The same school, a few centuries colder. Sound behaves oddly here — attacks are sharp, decays are long, and silence has weight. Composers report that ideas arrive fully formed and refuse to be revised. The Frozen Conservatory is for those who have learned the rules well enough to hold still inside them.",
    survivalTips: [
      "Space is material. A rest on a strong beat is one of the loudest things you can write.",
      "Sustained textures expose intonation and voice leading. Check both.",
      "Restraint reads as confidence. Do not fill every bar because you can.",
    ],
  },
  "inferno-of-virtuosity": {
    dangerRating: 5,
    lore: "Heat, noise, and an unreasonable number of notes. Everything here is played at the edge of possibility by things that never tire, and the temptation is to compete. Composers who try to out-run the Inferno write pages nobody performs. Those who survive it discovered that velocity means nothing without a reason.",
    survivalTips: [
      "Notes per second is not a musical value.",
      "Shape the passagework the way the instrument opens, not the way the harmony spells.",
      "One well-placed silence will cut through more than another sixteen bars of demisemiquavers.",
    ],
  },
  "cathedral-of-composition": {
    dangerRating: 5,
    lore: "Everything in the dungeon has been preparation for a room this size. The Cathedral is where melody, harmony, rhythm, counterpoint and orchestration are expected to arrive together and behave. The acoustics forgive nothing. At the far end, beneath a window with no glass left in it, something has been waiting a very long time for someone to finish what it started.",
    survivalTips: [
      "Large forms hold attention through return, not through novelty.",
      "One idea heard six ways beats six ideas heard once.",
      "Save your strongest cadence for the arrival that deserves it.",
    ],
  },

  /* ---------------------------------------------------------------------- */
  /* The six that had none                                                   */
  /* ---------------------------------------------------------------------- */
  //
  // An audit found the same split here as in the Academy: the nine areas of
  // the original descent each had lore, a danger rating and survival tips,
  // and the six expansion areas — which are the later and harder ones — had
  // none of it. The area page renders each of those only when present, so a
  // player going deeper than the Cathedral found the writing simply stopping.

  "instrument-menagerie": {
    dangerRating: 3,
    lore: "The cages are not cruelty, whatever it looks like. Each one is a set of rules with a voice inside it: a thing that can only sing the way it is built to sing, and that will tell you — immediately, and in front of everyone — when you have asked it for something it does not have. Composers arrive here able to write any note they like. They leave able to write the notes a particular body can reach, which is a smaller skill and a far more useful one.",
    survivalTips: [
      "Find the bottom and the top of an instrument before you write a line for it, and then stay well inside both.",
      "A player has to breathe, and a bow has to turn round. Write the rests in or they will be taken anyway.",
      "A transposing instrument is not lying to you. Write what the player reads, and work out the sound afterwards.",
    ],
  },

  "orchestral-abyss": {
    dangerRating: 4,
    lore: "A hundred players and no conductor, in a pit deep enough that the sound arrives from everywhere at once. Nothing here is quiet and nothing here is clear, and the composers who try to solve it by writing louder are the ones still down there. The Abyss has exactly one exit, and it opens for anybody who can make a single line matter more than the ninety-nine around it.",
    survivalTips: [
      "Give the melody a register nothing else is using. That beats any dynamic marking.",
      "Mark the accompaniment two or three levels quieter than the tune, in writing. A shared dynamic is not balance.",
      "A doubling changes the colour of a line as much as its volume. Choose it; do not let it happen to you.",
    ],
  },

  "loom-of-variations": {
    dangerRating: 3,
    lore: "The tapestry on the far wall is one thread, and nobody can agree where it starts. The Loom's demand sounds gentle and is not: change everything, keep the thing. Composers who change too little produce repetition and are sent back; composers who change too much produce a second piece and are sent back for a different reason. Somewhere between those is a variation, and the Loom knows exactly where.",
    survivalTips: [
      "Decide what the theme IS before varying it — the rhythm, the shape, or the harmony. Keep that, and the rest is yours.",
      "One clear idea per variation. Two ideas at once reads as neither.",
      "Order them so each is further from the theme than the last, and the set will feel like a journey rather than a list.",
    ],
  },

  "whispering-catacombs": {
    dangerRating: 4,
    lore: "Everything said here is answered a bar later, a fifth higher, and very slightly wrong. There is no silence to compose into: the walls are already busy, and anything you write immediately acquires a second voice with opinions of its own. The old hands say the Catacombs are not a place where counterpoint is tested so much as a place where it is the weather, and that the only way through is to write a line that was expecting company.",
    survivalTips: [
      "Write the second voice as you write the first. Harmonising afterwards is how parallels get in.",
      "Contrary motion is your footing. Two voices moving the same way are one voice with a thick coat on.",
      "Check all six pairs of voices, not just the outer two. The alto and tenor are where the fifths hide.",
    ],
  },

  "clockwork-bazaar": {
    dangerRating: 3,
    lore: "A market built on a clock nobody can read. Stalls open on the seventh beat and shut on the fifth; the beggar by the fountain is in four and has been for years, and somehow the whole street still dances. The Bazaar does not punish you for failing to find the pulse. It punishes you for pretending there is not one — everything here is counted, and anyone who cannot say what they are counting gets short-changed.",
    survivalTips: [
      "Commit to a grouping and articulate it. 7/8 as 2+2+3 is a dance; 7/8 as seven is a stumble.",
      "Keep something holding the plain pulse or your syncopation has nothing to be late against.",
      "Three against two is two players who are both right. Write both parts as though each were the only one.",
    ],
  },

  "forking-cadences": {
    dangerRating: 4,
    lore: "A garden where every path ends in a cadence and every cadence opens two more. The paths are real and the map is not: composers have walked in here in C major, taken four reasonable turns, and come out somewhere they could not name. The way through is not to avoid the forks. It is to know, at every one, exactly how final the ending you just wrote was — because that is the thing that decides which door opens.",
    survivalTips: [
      "Grade your endings. A perfect authentic cadence stops the music; anything less leaves a door ajar on purpose.",
      "A pivot chord belongs to both keys. Find one before you leave, and the join will not show.",
      "One accidental is colour, not a journey. Nothing has changed key until the new key has cadenced.",
    ],
  },
};

export const bossDetail: Record<string, BossDetail> = {
  "pale-soprano": {
    lore: "She was the finest voice the Conservatory ever produced, and she was given nothing worth singing. Aria after aria arrived on her stand — technically flawless, emotionally empty — until she stopped waiting for a composer good enough and began collecting them instead. She does not want to defeat you. She wants a melody she can finally sing.",
    tactics: [
      "Her phrases arrive in question-and-answer pairs. Answer them properly or she repeats the question.",
      "Melodic shape damages her more than complexity. One clear climax beats a shower of notes.",
      "She is immune to anything that cannot be sung. Test your line with your own voice first.",
    ],
  },
  "iron-metronome": {
    lore: "Built to keep a student honest, it kept going after the student left, and after the school fell, and after the century turned. It has never once been wrong. That is the problem: it has never once been musical either. It measures your writing the way it measures everything — exactly — and it has no category for rubato.",
    tactics: [
      "It cannot be out-played on steadiness. Do not try.",
      "Syncopation lands hardest when the pulse underneath stays intact — keep the grid alive.",
      "Hemiola and metric displacement hurt it. Perfect regularity does not.",
    ],
  },
  "chromatic-serpent": {
    lore: "It has no key of its own and never has. It moves through all twelve, shedding one as it takes the next, and composers who chase it into its own territory find that they no longer remember where home was. Older maps mark its den simply: DO NOT FOLLOW IT DOWN.",
    tactics: [
      "It sheds its key at 70%. Follow the modulation or your material stops connecting.",
      "Pivot chords are your footing. Prepare arrivals rather than jumping.",
      "Tonicisation is not enough here — you need a real cadence in the new key to make ground stick.",
    ],
  },
  "forgotten-composer": {
    lore: "There is no name on the manuscripts, and there is no record of the commission. Whoever it was wrote five movements of something enormous and never finished the last, and the incompleteness is what kept them here — a piece that cannot end will not let its composer leave. They have spent a very long time in a cathedral with perfect acoustics and nothing to play. Now someone has finally come down who might be able to finish it.",
    tactics: [
      "Five movements, five demands: melody, harmony, rhythm, counterpoint and orchestration are each tested in turn.",
      "Material carries across movements. Bring a motif in, and transform it rather than replacing it.",
      "The final blow is a complete piece, not a passage. Nothing else ends this.",
    ],
  },

  /* ---------------------------------------------------------------------- */
  /* The six that had none                                                   */
  /* ---------------------------------------------------------------------- */
  //
  // The four bosses of the original descent each had lore and tactics. The
  // six added since — every expansion, orchestral and guild boss — had
  // neither, so the hardest fights in the game were also the ones that told a
  // player least about how to win them.

  "hundred-handed-organist": {
    lore: "It was built into the cathedral wall and it has never left, which is the only reason anybody survives meeting it. Every rank, every coupler, every stop drawn at once, because it can — and because for three hundred years nobody has given it a reason to do anything else. It is not loud out of malice. It is loud because nothing has ever been worth being quiet for.",
    tactics: [
      "You cannot out-volume it. Do not try — the fight is won in register and colour, not in dynamics.",
      "Put the tune where nothing else is playing. An empty octave carries further than any marking.",
      "Its weakest moment is the three-voice reduction. Keep the material intact with ninety-seven ranks taken away and it has nothing left to answer with.",
    ],
  },

  "canon-that-eats-itself": {
    lore: "It follows one bar behind, exactly, and it has been doing so long enough that there is no longer any way to tell which voice began. It does not attack; it simply repeats what you have just done, perfectly, for as long as you keep doing things. Composers who panic and write faster feed it. The only line that hurts it is one that was built, from the first note, to be heard against itself.",
    tactics: [
      "Write both voices at once, offset by a bar, and check every vertical interval as you go.",
      "At the fifth, the answer lands a step away from where the octave put it — recheck the dissonances rather than assuming they transposed.",
      "An inverted subject that still sounds deliberate is what ends this. Inversion that sounds like an accident does nothing.",
    ],
  },

  "silent-orchestra": {
    lore: "Every stand is filled, every instrument tuned, every eye up and waiting. They have been waiting a long time, and they are entirely willing. What they will not do is guess. They will play exactly what is written in front of them — no more, no less, and nothing at all of what you meant but did not put on the page. The Silent Orchestra cannot be beaten by having a good idea. It is beaten by a score.",
    tactics: [
      "It is immune to intention. Anything you did not write is not in the room: mark every dynamic, on every staff.",
      "Transpose every part correctly before anything else. One clarinet a tone out and the harmony you wrote is not the harmony they play.",
      "Hold one colour back until the end. An orchestra that has already played everything has nowhere to go when you need it.",
    ],
  },

  "two-galleries": {
    lore: "Two stone balconies facing each other across the nave, a choir standing in each, and two hundred years of waiting for a piece written for both of them. Everything brought here so far was written for one gallery and copied to the other, which is not antiphony — it is an echo, and a building does that by itself. They are not interested in being answered. They want to be needed.",
    tactics: [
      "End a phrase on the dominant and leave it there. A question that is also an answer gives the other gallery nothing to do.",
      "Write for the distance: across a nave, fast detail turns to soup. Slower, wider, and built on long notes carries.",
      "The rests are where the other choir lives. Compose the silences as deliberately as the notes.",
    ],
  },

  "grand-dispute": {
    lore: "Four composers, two hundred years, and every one of them right. One brought a subject that rises, one a subject that falls, one a subject with no leaps in it at all, and one brought four notes and a silence. Everybody who has tried to settle it has chosen a side, and choosing a side is how the Dispute is lost — it does not want a winner. It wants a development section in which all four are still themselves and none of them is winning.",
    tactics: [
      "Bring a subject distinct enough to be argued with: clear in rhythm, clear in shape, short enough to be recognised in fragments.",
      "Combine rather than alternate. Four subjects taking turns is a queue, not a dispute.",
      "Keep each one recognisable under transformation. A subject nobody can identify has conceded.",
    ],
  },

  "many-lifetimes": {
    lore: "It is not one thing and never was. Each movement of it was written by somebody else, in a different century, for a different reason, and it has been accumulating ever since — a piece that no single composer could have finished and that no single composer can end. It is the last thing in the dungeon because it is the only one that requires more than one person to beat.",
    tactics: [
      "This is not a solo fight. Material from other members of your guild is the weapon; bring theirs in and transform it.",
      "Carry one idea across every movement. The thing it cannot survive is coherence.",
      "Finish it. It has outlasted everyone who left a movement unresolved, and an incomplete piece is how it recruits.",
    ],
  },
};
