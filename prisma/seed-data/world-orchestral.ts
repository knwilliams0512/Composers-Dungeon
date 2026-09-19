import type { SeedRoom } from "./world";

/**
 * The Hall of a Hundred Staves — the deepest area in the game.
 *
 * Everything above it tests whether you can write music. This tests whether
 * you can write a *score*: whether the page is laid out the way a conductor
 * reads it, whether the parts are in the keys the players need, whether the
 * thing you imagined survives a hundred people playing it at once, and whether
 * you can hold twenty minutes together.
 *
 * It sits above the Cathedral of Composition and requires Level 6 of the
 * Academy. A composer arriving here is writing pages, not phrases.
 */

export const orchestralArtifacts = [
  {
    key: "master-copyists-pen",
    name: "The Master Copyist's Pen",
    description:
      "It has written out every part of every symphony that ever reached a stand, and it refuses to write a transposition wrongly. Held over a score, the errors glow.",
    rarity: "LEGENDARY",
    icon: "🖋️",
    effect: "REVEAL_CHALLENGE",
    unlockMethod: "Taken from the copyist's desk in the Hall of a Hundred Staves.",
  },
  {
    key: "tuning-fork-of-the-ninety-nine",
    name: "Tuning Fork of the Ninety-Nine",
    description:
      "Struck once, it sounds the A that ninety-nine players tune to — and holds it until every one of them agrees. It teaches an ear what balance is by refusing to let it settle for less.",
    rarity: "EPIC",
    icon: "🔱",
    effect: "BONUS_XP",
    unlockMethod: "Found in the Vault of Unplayable Things.",
  },
  {
    key: "unfinished-final-page",
    name: "The Unfinished Final Page",
    description:
      "The last page of a symphony nobody completed. The staves are ruled, the clefs are drawn, the barlines are waiting. It is the most frightening object in the dungeon.",
    rarity: "LEGENDARY",
    icon: "📜",
    effect: "UNLOCK_VIRTUOSO",
    unlockMethod: "Left behind by the Silent Orchestra.",
  },
];

export const orchestralBosses = [
  {
    key: "silent-orchestra",
    name: "The Silent Orchestra",
    title: "Ninety-Nine Players and No Conductor",
    description:
      "They are all here. Every stand is filled, every instrument is tuned, every eye is up and waiting. They have been waiting a long time. They will play exactly what is on the page in front of them — no more, no less, and nothing you meant but did not write. The Silent Orchestra cannot be beaten by inspiration. It is beaten by a score that says what you mean.",
    artwork: "🎻",
    totalHp: 28000,
    difficulty: 10,
    levelRequirement: 25,
    xpReward: 3000,
    rewardArtifactKey: "unfinished-final-page",
    phases: [
      {
        order: 1,
        name: "The Tuning",
        description: "Ninety-nine instruments find an A. Lay out a score they can read: right order, right clefs, right transpositions.",
        hpThresholdPercent: 100,
      },
      {
        order: 2,
        name: "The Sections Answer",
        description: "At 75% HP the families begin to play separately. Write for each on its own terms — strings, winds, brass, percussion.",
        hpThresholdPercent: 75,
      },
      {
        order: 3,
        name: "The Weight",
        description: "At 50% HP everything plays at once. Make one line audible through a full tutti without asking anyone to force.",
        hpThresholdPercent: 50,
      },
      {
        order: 4,
        name: "The Long Silence",
        description: "At 25% HP the orchestra stops and waits. Whatever you write next has to be worth ninety-nine people's attention.",
        hpThresholdPercent: 25,
      },
    ],
    objectives: [
      {
        name: "Lay out a readable score",
        description: "Correct staff order, brackets and braces, dynamics on every staff, techniques above and expression below.",
        damage: 4000,
        bonus: false,
        finalBlow: false,
        order: 1,
      },
      {
        name: "Transpose every part correctly",
        description: "Clarinets, horns, trumpets and cor anglais all reading the notes that produce the harmony you intended.",
        damage: 4000,
        bonus: false,
        finalBlow: false,
        order: 2,
      },
      {
        name: "Write idiomatically for each family",
        description: "Strings that can be bowed, winds that can be breathed, brass that can rest, percussion that has time to change sticks.",
        damage: 4000,
        bonus: false,
        finalBlow: false,
        order: 3,
      },
      {
        name: "Carry one line through a tutti",
        description: "Register and colour, not dynamics — the melody stays audible with everyone playing.",
        damage: 3000,
        bonus: false,
        finalBlow: false,
        order: 4,
      },
      {
        name: "Hold something in reserve",
        description: "One colour that does not appear until the final climax.",
        damage: 2000,
        bonus: true,
        finalBlow: false,
        order: 5,
      },
      {
        name: "Complete the final page",
        description: "Deliver the finished movement. The orchestra will play exactly what you wrote.",
        damage: 12000,
        bonus: false,
        finalBlow: true,
        order: 6,
      },
    ],
  },
];

const rooms: SeedRoom[] = [
  {
    name: "The Copyist's Desk",
    description:
      "A desk the length of the room, and on it a score in twenty-two staves, half-copied. The copyist is not here. The parts that were finished are immaculate; the parts that were not are blank. Somebody has to finish it, and the orchestra is tuning.",
    type: "CHALLENGE",
    order: 1,
  },
  {
    name: "The Transposing Gate",
    description:
      "Four doors, each marked with a written note, and above them a single sounding pitch carved into the stone. Only one door is in the right key. The others open onto the same corridor a semitone out of tune, and you will not notice until you are lost.",
    type: "PUZZLE",
    order: 2,
    puzzleData: {
      kind: "MULTIPLE_CHOICE",
      prompt:
        "A horn in F must sound a concert D. Which written note opens the gate?",
      choices: ["D", "G", "A", "B♭"],
      answerIndex: 2,
      explanation:
        "Horn in F sounds a perfect fifth below what it reads, so the written note lies a perfect fifth above the sounding one. Written A sounds D.",
    },
  },
  {
    name: "The Divided Choir",
    description:
      "Sixteen violinists stand in a circle, bows raised. They will play any chord you write — but each of them has one bow, and one bow draws one line. Ask for four notes from one player and you will hear the bow roll and the chord break.",
    type: "CHALLENGE",
    order: 3,
  },
  {
    name: "The Instrument That Lies",
    description:
      "Something in this room is written at sounding pitch when it should be transposed, and the harmony is a semitone wrong in a place you cannot hear until it is too late. The room will not tell you which instrument. It only tells you that one of them is lying.",
    type: "CURSE",
    order: 4,
  },
  {
    name: "The Vault of Unplayable Things",
    description:
      "Shelf after shelf of passages that cannot be played: twelfths for one hand, sustained four-note chords for one bow, a flute line with no breath in it for two minutes. Each is labelled with the name of the composer who wrote it and the date the orchestra refused it.",
    type: "TREASURE",
    order: 5,
    artifactKey: "tuning-fork-of-the-ninety-nine",
  },
  {
    name: "The Balance Scales",
    description:
      "A set of scales with a flute on one pan and a trombone on the other, and the trombone does not move. Every dynamic you have ever written is weighed here against what else was sounding at the time.",
    type: "CHALLENGE",
    order: 6,
  },
  {
    name: "The Score Order Trial",
    description:
      "Twenty-two staves, unlabelled, in the wrong order. The conductor is already beating. Put the families where the eye expects to find them, or the downbeat arrives and nobody comes in.",
    type: "PUZZLE",
    order: 7,
    puzzleData: {
      kind: "ARRANGE",
      prompt:
        "Order these instrumental families from the top of a full score to the bottom.",
      pieces: [
        { id: "woodwind", label: "Woodwind" },
        { id: "brass", label: "Brass" },
        { id: "percussion", label: "Percussion" },
        { id: "harp", label: "Harp & Keyboard" },
        { id: "strings", label: "Strings" },
      ],
      solution: ["woodwind", "brass", "percussion", "harp", "strings"],
      explanation:
        "Woodwind, brass, percussion, harp and keyboard, then strings at the bottom — the order a conductor's eye is trained on.",
    },
  },
  {
    name: "The Long Room",
    description:
      "It takes twenty minutes to walk from one end to the other, and the room remembers what you played at the start. Something you wrote in the first minute has to come back changed in the last, or the far door does not open.",
    type: "CHALLENGE",
    order: 8,
  },
  {
    name: "The Copyist's Own Drawer",
    description:
      "The desk at the entrance had a drawer nobody opened, because nobody finishes the first room and then goes back to it. Inside is the pen.",
    type: "TREASURE",
    order: 9,
    artifactKey: "master-copyists-pen",
    secret: true,
    secretRule: { kind: "AREA_CLEARED" },
    secretHint:
      "The Hall gave up the drawer once every other door in it had been opened.",
  },
  {
    name: "The Rest Before the Podium",
    description:
      "A single chair in an empty room, facing a closed door. Beyond it, ninety-nine people are waiting. Nobody has ever regretted sitting down here first.",
    type: "REST",
    order: 10,
  },
  {
    name: "The Podium",
    description:
      "The score is open. The orchestra is silent. Every player is looking at you, and they will play precisely what is written on the page in front of them.",
    type: "BOSS",
    order: 11,
    bossKey: "silent-orchestra",
  },
];

export const orchestralArea: {
  key: string;
  name: string;
  description: string;
  theme: string;
  icon: string;
  levelRequirement: number;
  tierRequirement: string;
  skillKey: string | null;
  order: number;
  special?: boolean;
  rooms: SeedRoom[];
} = {
  key: "hall-of-the-hundred-staves",
  name: "The Hall of a Hundred Staves",
  description:
    "The deepest room in the dungeon is a room full of paper. A hundred staves ruled across a page the size of a door, and every one of them is somebody's hands. Down here nothing is tested except whether the thing in your head can be written down accurately enough that a hundred strangers can play it back to you.",
  theme: "A score is a set of instructions a hundred people will follow exactly.",
  icon: "🎼",
  levelRequirement: 25,
  tierRequirement: "VIRTUOSO_REPERTOIRE",
  skillKey: "ORCHESTRATION",
  order: 16,
  rooms,
};

export const orchestralAreaDetail = {
  "hall-of-the-hundred-staves": {
    dangerRating: 5,
    lore: "There is a story that the Hall was built by a copyist rather than a composer — someone who spent forty years writing out other people's symphonies into parts, and came to understand that the difference between a great score and a worthless one is not the ideas in it but whether the ideas survive the journey onto ninety-nine music stands. Every other area in the dungeon asks what you can imagine. This one asks what you can transmit. Composers who arrive here with brilliant ideas and careless pages do not get past the second room, and the Hall is not being cruel: the orchestra genuinely cannot play what you did not write.",
    survivalTips: [
      "Write the score order out from memory before you start. Everything else depends on the conductor finding the instrument.",
      "Sing the sounding pitch, then work out the written note. Transposing from the written note is how you end up wrong by twice the interval.",
      "Before asking for a louder dynamic, ask what else is in that register. Balance is a spacing problem first.",
      "Leave somebody silent. If everyone plays on every page, the climax has nowhere to go.",
      "Plan the whole span in minutes before you write a bar of it.",
    ],
  },
};
