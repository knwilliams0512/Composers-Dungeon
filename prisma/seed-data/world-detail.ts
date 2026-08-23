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
};
