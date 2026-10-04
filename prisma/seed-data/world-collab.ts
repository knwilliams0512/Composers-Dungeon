/**
 * The collaboration bosses: encounters a guild fights, not a composer.
 *
 * Every other boss in the game is a duel. These three are not, and the
 * difference is structural rather than decorative. A collaboration boss holds
 * one pool of HP for the whole guild, each member may land each objective
 * once, and the numbers are set so that the minimum guild size has to turn up
 * in full before the final blow is even unlocked. Writing the best piece in
 * the house eight times over will not finish one.
 *
 * They are also about something. A boss that merely required four people to
 * press the same button would be a chore with a story bolted on. Each of these
 * asks for the thing that genuinely cannot be done alone:
 *
 *   - The Two Galleries wants antiphony — music written across a space, where
 *     one half has to leave room for an answer it did not write.
 *   - The Grand Dispute wants reconciliation — several composers' own subjects,
 *     argued into one development without any of them being thrown away.
 *   - The Work of Many Lifetimes wants a piece longer than one person's
 *     attention, handed on in movements the way the real ones were.
 *
 * Level requirements start above the Silent Orchestra's 25, because these are
 * meant to be what a guild does after its members have run out of things to
 * beat on their own.
 */

export const collabBosses = [
  {
    key: "two-galleries",
    name: "The Two Galleries",
    title: "The Cathedral That Answers Itself",
    description:
      "Two stone balconies face each other across the nave, and a choir stands in each. They have been waiting for a piece written for both. Everything brought to them so far was written for one and copied to the other, which is not antiphony — it is an echo, and an echo is what a building does without being asked. The Galleries want music where each side leaves a shape the other has to fill, and neither half makes complete sense alone.",
    artwork: "⛪",
    totalHp: 22000,
    difficulty: 8,
    levelRequirement: 28,
    xpReward: 2600,
    collab: true,
    minMembers: 2,
    rewardArtifactKey: null as string | null,
    phases: [
      {
        order: 1,
        name: "The Near Gallery",
        description:
          "One side sings first. Write a phrase that is plainly unfinished — that asks something — without being merely short.",
        hpThresholdPercent: 100,
      },
      {
        order: 2,
        name: "The Far Gallery",
        description:
          "At 70% HP the opposite balcony answers. The answer must belong to someone else's phrase and still sound inevitable.",
        hpThresholdPercent: 70,
      },
      {
        order: 3,
        name: "Both At Once",
        description:
          "At 35% HP the two choirs stop taking turns. Now the halves must work sounding together, which is a different problem and the one the building was built for.",
        hpThresholdPercent: 35,
      },
    ],
    objectives: [
      {
        name: "Leave a door open",
        description:
          "Write an eight-bar phrase that ends on the dominant — an unmistakable question. Half-finished is the requirement, not an excuse.",
        damage: 2200,
        bonus: false,
        finalBlow: false,
        order: 1,
      },
      {
        name: "Answer a guildmate",
        description:
          "Take a phrase another member posted to the guild and write its reply. It has to use their shape, not yours.",
        damage: 2500,
        bonus: false,
        finalBlow: false,
        order: 2,
      },
      {
        name: "Write for distance",
        description:
          "Across a nave, fast detail turns to soup. Write a line that survives a long reverberation: slower, wider, built of intervals a listener can still hear apart.",
        damage: 2800,
        bonus: false,
        finalBlow: false,
        order: 3,
      },
      {
        name: "Make the silence structural",
        description:
          "In antiphonal writing the rests are where the other choir lives. Write a part whose silences are as deliberate as its notes.",
        damage: 3000,
        bonus: false,
        finalBlow: false,
        order: 4,
      },
      {
        name: "The third voice",
        description:
          "Bonus. Some Venetian pieces hid a third group in the organ loft. Add a line that belongs to neither gallery and makes both sound larger.",
        damage: 1800,
        bonus: true,
        finalBlow: false,
        order: 5,
      },
      {
        name: "The Tutti",
        description:
          "Both galleries, one piece. Write the passage where the answering stops and the whole building sings at once — and make it the arrival everything before it was asking for.",
        damage: 6000,
        bonus: false,
        finalBlow: true,
        order: 6,
      },
    ],
  },

  {
    key: "grand-dispute",
    name: "The Grand Dispute",
    title: "Four Composers Who Will Not Yield",
    description:
      "They have been arguing for two hundred years and each of them is right. One brought a subject that rises; one brought a subject that falls; one brought a subject with no leaps in it at all; one brought four notes and a silence. Every composer who has tried to settle this chose a side, and choosing a side is how you lose — the Dispute is not won by proving one subject best. It is won by a development section in which all of them are still recognisably themselves, and none of them is winning.",
    artwork: "⚖️",
    totalHp: 42000,
    difficulty: 9,
    levelRequirement: 32,
    xpReward: 3400,
    collab: true,
    minMembers: 3,
    rewardArtifactKey: null as string | null,
    phases: [
      {
        order: 1,
        name: "The Statements",
        description:
          "Each composer puts their subject on the table. They are not yet speaking to one another, and they do not have to.",
        hpThresholdPercent: 100,
      },
      {
        order: 2,
        name: "The Interruptions",
        description:
          "At 65% HP they stop waiting their turn. Subjects must now be made to fit against subjects they were not written for.",
        hpThresholdPercent: 65,
      },
      {
        order: 3,
        name: "The Reconciliation",
        description:
          "At 30% HP the argument has to resolve without a loser. Every subject must survive into the final page, altered but not dismissed.",
        hpThresholdPercent: 30,
      },
    ],
    objectives: [
      {
        name: "Bring a subject",
        description:
          "Write a theme of your own that is strong enough to be argued with: distinct in rhythm, clear in shape, and short enough to be recognised when someone else deforms it.",
        damage: 3000,
        bonus: false,
        finalBlow: false,
        order: 1,
      },
      {
        name: "Argue with someone else's",
        description:
          "Take a guildmate's subject and write a counter-statement — not a copy, not a dismissal. Invert it, augment it, or answer it in a key it did not expect.",
        damage: 3200,
        bonus: false,
        finalBlow: false,
        order: 2,
      },
      {
        name: "Two subjects at once",
        description:
          "Write a passage where your subject and another member's sound together and neither is accompaniment. This is the hard one, and it is the whole encounter in miniature.",
        damage: 3500,
        bonus: false,
        finalBlow: false,
        order: 3,
      },
      {
        name: "Concede something",
        description:
          "Rewrite your own subject so it fits the guild's piece better than it fit your own. The Dispute can tell the difference between a concession and a surrender.",
        damage: 3800,
        bonus: false,
        finalBlow: false,
        order: 4,
      },
      {
        name: "The stretto",
        description:
          "Bonus. Pile the entries on top of one another faster than they can comfortably fit. Chaos that is still countable.",
        damage: 2200,
        bonus: true,
        finalBlow: false,
        order: 5,
      },
      {
        name: "The Settlement",
        description:
          "One development section in which every subject brought by the guild is still audible and still itself. Nobody wins. That is the win.",
        damage: 9000,
        bonus: false,
        finalBlow: true,
        order: 6,
      },
    ],
  },

  {
    key: "many-lifetimes",
    name: "The Work of Many Lifetimes",
    title: "Begun By Someone Who Did Not Finish",
    description:
      "The manuscript is on a stand in the middle of the room and it is enormous. Four hands have already written in it, in four inks, across four generations, and every one of them stopped. The hardest thing about it is not any single page — it is that no one has ever held the whole shape in their head at once, and the piece knows. It will not accept a movement that ignores the movements before it, and it will not accept a last page written by someone who did not read the first.",
    artwork: "📜",
    totalHp: 72000,
    difficulty: 10,
    levelRequirement: 36,
    xpReward: 4500,
    collab: true,
    minMembers: 4,
    rewardArtifactKey: null as string | null,
    phases: [
      {
        order: 1,
        name: "Reading What Is There",
        description:
          "Before a note is added, the hands already in the manuscript have to be understood. The piece opens only to a guild that has read it.",
        hpThresholdPercent: 100,
      },
      {
        order: 2,
        name: "The Middle Generations",
        description:
          "At 60% HP the inner movements are written. Each belongs to one composer and must still sound like the same work.",
        hpThresholdPercent: 60,
      },
      {
        order: 3,
        name: "The Return",
        description:
          "At 25% HP the opening material comes back, changed by everything that has happened to it. This is what makes it one piece rather than four.",
        hpThresholdPercent: 25,
      },
    ],
    objectives: [
      {
        name: "Read the earlier hands",
        description:
          "Study what the guild has already written into this work and post what holds it together — the interval, the rhythm, the habit that every movement shares.",
        damage: 4000,
        bonus: false,
        finalBlow: false,
        order: 1,
      },
      {
        name: "Write your movement",
        description:
          "One movement, yours, complete. It must be unmistakably your hand and unmistakably the same piece, which is the oldest problem in collaborative writing.",
        damage: 4200,
        bonus: false,
        finalBlow: false,
        order: 2,
      },
      {
        name: "Carry something forward",
        description:
          "Take a figure from the movement written before yours and let it reappear in yours, transformed. Nothing in this manuscript is allowed to be new twice.",
        damage: 4500,
        bonus: false,
        finalBlow: false,
        order: 3,
      },
      {
        name: "Hand it on",
        description:
          "End your movement so the next composer has somewhere to begin. Finish too completely and the work stops here, as it has four times already.",
        damage: 4800,
        bonus: false,
        finalBlow: false,
        order: 4,
      },
      {
        name: "The erased page",
        description:
          "Bonus. One page was scraped clean and rewritten by somebody who then crossed it out. Write what you think was there.",
        damage: 2600,
        bonus: true,
        finalBlow: false,
        order: 5,
      },
      {
        name: "The Last Page",
        description:
          "The ending four generations did not reach. Sixteen bars that answer the opening, use what every member brought, and close a work older than any of you.",
        damage: 14000,
        bonus: false,
        finalBlow: true,
        order: 6,
      },
    ],
  },
];
