/**
 * The dungeon's second half.
 *
 * Three things live here, kept apart from world.ts so the original nine areas
 * stay readable and so a mistake in new content cannot quietly rewrite old
 * content:
 *
 *  1. `expansionAreas` — six new areas, chosen to cover the skills the
 *     original map never trained. Instrumentation and Orchestration had no
 *     room at all; Counterpoint had one; the rest of the map leaned hard on
 *     Melody and Technique.
 *  2. `expansionBosses` / `expansionArtifacts` — what those areas end on and
 *     hand out.
 *  3. `secretRoomsByArea` — the hidden rooms, gathered in one place rather
 *     than scattered through the area definitions. A secret is defined by the
 *     rule that reveals it, and a rule that is wrong either hides a room
 *     forever or gives it away for free; both are much easier to catch when
 *     every rule in the game is on one screen.
 */

import type { SeedRoom } from "./world";

export const expansionArtifacts = [
  {
    key: "reed-of-the-first-breath",
    name: "Reed of the First Breath",
    description:
      "Cut from the marsh where the first wind instrument was made. It knows what a player can and cannot do in one breath.",
    rarity: "RARE",
    icon: "🎋",
    effect: "REVEAL_CHALLENGE",
    unlockMethod: "Found in the Instrument Menagerie.",
  },
  {
    key: "conductors-baton",
    name: "The Conductor's Baton",
    description:
      "Weightless, and heavier than any score. It divides an orchestra into voices that can still hear each other.",
    rarity: "EPIC",
    icon: "🪄",
    effect: "BONUS_XP",
    unlockMethod: "Taken from the podium at the bottom of the Orchestral Abyss.",
  },
  {
    key: "thread-of-the-loom",
    name: "Thread of the Loom",
    description:
      "One thread from a tapestry of a thousand variations, each the same thread.",
    rarity: "RARE",
    icon: "🧵",
    effect: "REROLL",
    unlockMethod: "Drawn from the Loom of Variations.",
  },
  {
    key: "echo-stone",
    name: "Echo Stone",
    description:
      "Hum into it and it answers a bar later, a fifth higher, and perfectly in time.",
    rarity: "RARE",
    icon: "🪨",
    effect: "REVEAL_CHALLENGE",
    unlockMethod: "Prised from the wall of the Whispering Catacombs.",
  },
  {
    key: "broken-gear",
    name: "The Broken Gear",
    description:
      "It will not turn in any meter that divides evenly. The Bazaar runs on it anyway.",
    rarity: "UNCOMMON",
    icon: "⚙️",
    effect: "REST_DAY",
    unlockMethod: "Salvaged from the Clockwork Bazaar.",
  },
  {
    key: "pivot-key",
    name: "The Pivot Key",
    description:
      "A key cut to fit two locks at once. Turn it and you are somewhere else, and you did not hear yourself leave.",
    rarity: "EPIC",
    icon: "🗝️",
    effect: "UNLOCK_HARMONY",
    unlockMethod: "Found where the cadences fork.",
  },
  {
    key: "unsigned-score",
    name: "The Unsigned Score",
    description:
      "Finished, masterful, and no one put their name on it. It is waiting for you to decide whether that matters.",
    rarity: "LEGENDARY",
    icon: "📃",
    effect: "BONUS_XP",
    unlockMethod: "Found in a room that is not on any map.",
  },
  {
    key: "tuning-fork-of-the-deep",
    name: "Tuning Fork of the Deep",
    description:
      "Struck once, centuries ago. It has not stopped, and everything in the dungeon is slightly in tune with it.",
    rarity: "LEGENDARY",
    icon: "🔱",
    effect: "COSMETIC",
    unlockMethod: "Given to those who found the dungeon's deepest secrets.",
  },
  {
    key: "students-eraser",
    name: "The Student's Eraser",
    description:
      "Worn down to a stub. Whoever owned it rewrote the same eight bars four hundred times, and the four hundred and first is why you have heard of them.",
    rarity: "UNCOMMON",
    icon: "🧽",
    effect: "REROLL",
    unlockMethod: "Found by anyone patient enough to keep coming back.",
  },
  {
    key: "silent-metronome",
    name: "The Silent Metronome",
    description:
      "It keeps perfect time and makes no sound at all. You have to know where the beat is.",
    rarity: "EPIC",
    icon: "🕰️",
    effect: "REVEAL_CHALLENGE",
    unlockMethod: "Earned by those who stopped needing to be told.",
  },
];

export const expansionBosses = [
  {
    key: "hundred-handed-organist",
    name: "The Hundred-Handed Organist",
    title: "Warden of the Orchestral Abyss",
    description:
      "It plays every rank at once because it can. Beating it does not mean playing louder — it means proving that one line, properly placed, can be heard over a hundred.",
    artwork: "🎹",
    totalHp: 14000,
    difficulty: 7,
    levelRequirement: 14,
    xpReward: 1400,
    rewardArtifactKey: "conductors-baton",
    phases: [
      { order: 1, name: "Full Organ", description: "Everything sounds at once. Write a melody that survives the texture.", hpThresholdPercent: 100 },
      { order: 2, name: "The Thinning", description: "At 65% HP it removes ranks one by one. Re-orchestrate your material for a smaller force.", hpThresholdPercent: 65 },
      { order: 3, name: "One Rank", description: "At 30% HP a single stop remains. Your idea has to work naked.", hpThresholdPercent: 30 },
    ],
    objectives: [
      { name: "Place a melody above a dense texture", description: "Give the tune a register and a colour nothing else occupies.", damage: 2500, bonus: false, finalBlow: false, order: 1 },
      { name: "Re-orchestrate for three voices", description: "Take the same material down to three parts without losing it.", damage: 3000, bonus: false, finalBlow: false, order: 2 },
      { name: "Balance a doubling", description: "Double a line at the octave without letting it swallow the inner parts.", damage: 2000, bonus: false, finalBlow: false, order: 3 },
      { name: "Write one line that needs no accompaniment", description: "A melody that is complete alone.", damage: 1000, bonus: true, finalBlow: false, order: 4 },
      { name: "Complete the final composition", description: "Deliver the finished orchestral study.", damage: 6000, bonus: false, finalBlow: true, order: 5 },
    ],
  },
  {
    key: "canon-that-eats-itself",
    name: "The Canon That Eats Itself",
    title: "The Thing in the Catacombs",
    description:
      "It follows you exactly, one bar behind, and it has been doing so for long enough that no one remembers which voice started. To kill it you must write a line that sounds right against itself.",
    artwork: "🐛",
    totalHp: 12000,
    difficulty: 6,
    levelRequirement: 11,
    xpReward: 1100,
    rewardArtifactKey: "echo-stone",
    phases: [
      { order: 1, name: "At the Octave", description: "It answers you an octave up, one bar late. Write a line that works against its own shadow.", hpThresholdPercent: 100 },
      { order: 2, name: "At the Fifth", description: "At 60% HP the answer moves to the fifth. Your intervals have to hold.", hpThresholdPercent: 60 },
      { order: 3, name: "Inverted", description: "At 25% HP it answers upside down. Every rise becomes a fall.", hpThresholdPercent: 25 },
    ],
    objectives: [
      { name: "Write a canon at the octave", description: "Two voices, one melody, one bar apart, no collisions.", damage: 2500, bonus: false, finalBlow: false, order: 1 },
      { name: "Hold a canon at the fifth", description: "Same trick, harder interval.", damage: 3000, bonus: false, finalBlow: false, order: 2 },
      { name: "Avoid parallel fifths and octaves", description: "Between every pair of voices, throughout.", damage: 1500, bonus: false, finalBlow: false, order: 3 },
      { name: "Invert the subject", description: "State your theme upside down and make it sound deliberate.", damage: 1000, bonus: true, finalBlow: false, order: 4 },
      { name: "Complete the final composition", description: "Deliver the finished canon.", damage: 5000, bonus: false, finalBlow: true, order: 5 },
    ],
  },
];

export const expansionAreas: {
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
}[] = [
  {
    key: "instrument-menagerie",
    name: "The Instrument Menagerie",
    description:
      "Cages of brass and gut and reed, each holding something that can only sing the way it is built to sing. Write against an instrument's nature here and it will tell you.",
    theme: "Every instrument is a set of rules with a voice.",
    icon: "🎺",
    levelRequirement: 6,
    tierRequirement: "KNOW_A_LITTLE",
    skillKey: "INSTRUMENTATION",
    order: 10,
    rooms: [
      { name: "The Breathing Hall", description: "A room of winds. Nothing here can play forever — write a line someone can survive.", type: "CHALLENGE", order: 1 },
      {
        name: "The Range Cages",
        description: "Four instruments, four ranges, and a melody that only fits one of them.",
        type: "PUZZLE",
        order: 2,
        puzzleData: {
          kind: "ARRANGE",
          prompt:
            "Order these four instruments from lowest sounding range to highest.",
          pieces: [
            { id: "tuba", label: "Tuba" },
            { id: "cello", label: "Cello" },
            { id: "clarinet", label: "Clarinet" },
            { id: "piccolo", label: "Piccolo" },
          ],
          solution: ["tuba", "cello", "clarinet", "piccolo"],
          explanation:
            "Tuba sits lowest, then cello, then clarinet, with piccolo highest — a full octave above the written note.",
        },
      },
      { name: "Vault of the First Reed", description: "Something older than notation rests on damp stone.", type: "TREASURE", order: 3, levelRequirement: 7, artifactKey: "reed-of-the-first-breath" },
      { name: "The Unplayable Chamber", description: "A curse: every chord you write must be physically reachable by one pair of hands.", type: "CURSE", order: 4, levelRequirement: 7 },
      { name: "The Transposing Gallery", description: "Half the instruments here lie about what note they are playing. Write for them anyway.", type: "CHALLENGE", order: 5, levelRequirement: 8 },
      { name: "The Warm Room", description: "Rosin, valve oil, and quiet. Nothing is asked of you here.", type: "REST", order: 6 },
    ],
  },
  {
    key: "orchestral-abyss",
    name: "The Orchestral Abyss",
    description:
      "A pit with a hundred players in it and no conductor. Sound arrives from every direction at once, and the only way out is to make one line matter more than the rest.",
    theme: "Loud is not the same as heard.",
    icon: "🎻",
    levelRequirement: 12,
    tierRequirement: "DECENT_COMPOSER",
    skillKey: "ORCHESTRATION",
    order: 11,
    rooms: [
      { name: "The Tutti Floor", description: "Everyone is playing. Make one thing stand out.", type: "CHALLENGE", order: 1 },
      {
        name: "The Seating Riddle",
        description: "The sections have been scattered. Put the score back in order.",
        type: "PUZZLE",
        order: 2,
        puzzleData: {
          kind: "ARRANGE",
          prompt:
            "Arrange these families in the order they appear, top to bottom, on a standard orchestral score.",
          pieces: [
            { id: "ww", label: "Woodwinds" },
            { id: "br", label: "Brass" },
            { id: "pe", label: "Percussion" },
            { id: "st", label: "Strings" },
          ],
          solution: ["ww", "br", "pe", "st"],
          explanation:
            "Standard score order runs woodwinds, brass, percussion, then strings at the bottom — with any harp or keyboard between percussion and strings.",
        },
      },
      { name: "The Doubling Pit", description: "A curse: every line you write is doubled somewhere you did not choose.", type: "CURSE", order: 3, levelRequirement: 13 },
      { name: "The Empty Podium", description: "A baton rests where a conductor should be standing.", type: "TREASURE", order: 4, levelRequirement: 13, artifactKey: "conductors-baton" },
      { name: "The Hundred Hands", description: "Something at the bottom is playing all of it at once.", type: "BOSS", order: 5, levelRequirement: 14, bossKey: "hundred-handed-organist" },
    ],
  },
  {
    key: "loom-of-variations",
    name: "The Loom of Variations",
    description:
      "One theme, woven a thousand ways, and every thread still the same thread. The Loom will not let you leave until you can change something without losing it.",
    theme: "Change everything. Keep the thing.",
    icon: "🧵",
    levelRequirement: 8,
    tierRequirement: "BASIC_COMPOSER",
    skillKey: "FORM",
    order: 12,
    rooms: [
      { name: "The Plain Statement", description: "Write the theme. Nothing clever. That comes later.", type: "CHALLENGE", order: 1 },
      {
        name: "The Unravelling",
        description: "Four variations of one theme, shuffled. Put them back in the order that builds.",
        type: "PUZZLE",
        order: 2,
        puzzleData: {
          kind: "ARRANGE",
          prompt:
            "Order these variations the way a set of variations usually travels.",
          pieces: [
            { id: "theme", label: "The theme, plainly stated" },
            { id: "orn", label: "The same theme, ornamented" },
            { id: "minor", label: "The theme turned to the minor mode" },
            { id: "finale", label: "The theme in augmentation, as a finale" },
          ],
          solution: ["theme", "orn", "minor", "finale"],
          explanation:
            "Statement, then decoration, then a change of mode for contrast, then a broadened final statement — the shape behind most variation sets.",
        },
      },
      { name: "The Room of One Rhythm", description: "A curse: you may change any note, but not one rhythmic value.", type: "CURSE", order: 3, levelRequirement: 9 },
      { name: "The Thread Vault", description: "A single thread hangs where a tapestry used to be.", type: "TREASURE", order: 4, levelRequirement: 9, artifactKey: "thread-of-the-loom" },
      { name: "The Augmentation Stair", description: "Each step is twice as long as the one before it. So is your theme.", type: "CHALLENGE", order: 5, levelRequirement: 10 },
      { name: "The Weaver's Chair", description: "Worn smooth. Sit a while.", type: "REST", order: 6 },
    ],
  },
  {
    key: "whispering-catacombs",
    name: "The Whispering Catacombs",
    description:
      "Say anything here and it comes back a bar later, a fifth higher, and slightly wrong. Counterpoint is not a style in this place. It is the weather.",
    theme: "Everything you write will be answered.",
    icon: "🕯️",
    levelRequirement: 10,
    tierRequirement: "BASIC_COMPOSER",
    skillKey: "COUNTERPOINT",
    order: 13,
    rooms: [
      { name: "The Answering Corridor", description: "Write a line. Something repeats it. Make that a good thing.", type: "CHALLENGE", order: 1 },
      {
        name: "The Species Stair",
        description: "Five steps, five disciplines, and they only go in one order.",
        type: "PUZZLE",
        order: 2,
        puzzleData: {
          kind: "ARRANGE",
          prompt: "Order the five species of counterpoint as they are taught.",
          pieces: [
            { id: "1", label: "Note against note" },
            { id: "2", label: "Two notes against one" },
            { id: "3", label: "Four notes against one" },
            { id: "4", label: "Suspensions" },
            { id: "5", label: "Florid — all of the above together" },
          ],
          solution: ["1", "2", "3", "4", "5"],
          explanation:
            "Fux's five species add one freedom at a time, ending with florid counterpoint where all of them are available at once.",
        },
      },
      { name: "The Parallel Crypt", description: "A curse: one parallel fifth and the walls move closer.", type: "CURSE", order: 3, levelRequirement: 10 },
      { name: "The Stone That Answers", description: "A smooth grey stone, still faintly humming.", type: "TREASURE", order: 4, levelRequirement: 11, artifactKey: "echo-stone" },
      { name: "The Thing One Bar Behind", description: "It has been following you since the entrance.", type: "BOSS", order: 5, levelRequirement: 11, bossKey: "canon-that-eats-itself" },
    ],
  },
  {
    key: "clockwork-bazaar",
    name: "The Clockwork Bazaar",
    description:
      "A market that runs on a clock nobody can read. Stalls open on the seventh beat, close on the fifth, and the whole street is somehow still dancing.",
    theme: "The beat is there. You just have not found it yet.",
    icon: "⚙️",
    levelRequirement: 7,
    tierRequirement: "KNOW_A_LITTLE",
    skillKey: "RHYTHM",
    order: 14,
    rooms: [
      { name: "The Five Street", description: "Everything here moves in five. Join in.", type: "CHALLENGE", order: 1 },
      {
        name: "The Grouping Stall",
        description: "A merchant will not sell to you until you count his meter correctly.",
        type: "PUZZLE",
        order: 2,
        puzzleData: {
          kind: "ARRANGE",
          prompt:
            "A bar of 7/8 is grouped 2+2+3. Arrange these beats into that grouping, in order.",
          pieces: [
            { id: "a", label: "Two eighths" },
            { id: "b", label: "Two eighths" },
            { id: "c", label: "Three eighths" },
            { id: "d", label: "Bar line" },
          ],
          solution: ["a", "b", "c", "d"],
          explanation:
            "2+2+3 puts the long group last, which is what gives 7/8 its characteristic limp into the next bar.",
        },
      },
      { name: "The Gear Pile", description: "Something bent and useful in a heap of scrap.", type: "TREASURE", order: 3, levelRequirement: 8, artifactKey: "broken-gear" },
      { name: "The Downbeat Curse", description: "A curse: no accent may fall on beat one.", type: "CURSE", order: 4, levelRequirement: 8 },
      { name: "The Three-Against-Two Alley", description: "Two drummers, neither of them wrong.", type: "CHALLENGE", order: 5, levelRequirement: 9 },
      { name: "The Tea Stall", description: "The only stall that keeps ordinary time.", type: "REST", order: 6 },
    ],
  },
  {
    key: "forking-cadences",
    name: "The Garden of Forking Cadences",
    description:
      "Every path ends in a cadence, and every cadence opens two more paths. Composers have walked in here in C major and come out somewhere they cannot name.",
    theme: "Every ending is also a door.",
    icon: "🌿",
    levelRequirement: 9,
    tierRequirement: "BASIC_COMPOSER",
    skillKey: "HARMONY",
    order: 15,
    rooms: [
      { name: "The Perfect Path", description: "Begin where everyone begins: a cadence that closes properly.", type: "CHALLENGE", order: 1 },
      {
        name: "The Fork",
        description: "Four cadences, four different amounts of finality. Order them.",
        type: "PUZZLE",
        order: 2,
        puzzleData: {
          kind: "ARRANGE",
          prompt:
            "Order these cadences from least final to most final.",
          pieces: [
            { id: "half", label: "Half cadence (ends on V)" },
            { id: "decep", label: "Deceptive cadence (V–vi)" },
            { id: "plagal", label: "Plagal cadence (IV–I)" },
            { id: "pac", label: "Perfect authentic cadence (V–I, both in root position, melody on the tonic)" },
          ],
          solution: ["half", "decep", "plagal", "pac"],
          explanation:
            "A half cadence leaves the door wide open; a deceptive one promises closure and withholds it; a plagal cadence closes gently; a perfect authentic cadence shuts the door.",
        },
      },
      { name: "The Borrowed Path", description: "A curse: every phrase must borrow one chord from the parallel mode.", type: "CURSE", order: 3, levelRequirement: 10 },
      { name: "The Locked Gate", description: "A key sits in the lock from the other side.", type: "TREASURE", order: 4, levelRequirement: 10, artifactKey: "pivot-key" },
      { name: "The Long Way Round", description: "Leave this garden in a different key than you entered it, without anyone hearing you go.", type: "CHALLENGE", order: 5, levelRequirement: 11 },
      { name: "The Bench by the Tonic", description: "Home, briefly.", type: "REST", order: 6 },
    ],
  },
];

/**
 * Hidden rooms, by the key of the area they belong to.
 *
 * Every rule is checked server-side and an unfound room is never sent to the
 * client, so these can be read here without spoiling them in the product.
 * Orders start at 90 so a secret always sorts after the ordinary rooms of its
 * area, whatever that area does with its own numbering.
 */
export const secretRoomsByArea: Record<string, SeedRoom[]> = {
  "hall-of-melody": [
    {
      name: "The Room Behind the Echo",
      description:
        "The echo in the first corridor was always a half-beat late. There was a reason.",
      type: "CHALLENGE",
      order: 90,
      secret: true,
      secretRule: { kind: "AREA_CLEARED" },
      secretHint: "The Hall gave this up once every other door in it had been opened.",
    },
  ],
  "crypt-of-harmony": [
    {
      name: "The Ninth Vault",
      description:
        "Eight vaults are marked on the crypt's plan. The masons built nine.",
      type: "TREASURE",
      order: 90,
      artifactKey: "students-eraser",
      secret: true,
      secretRule: { kind: "LESSONS_COMPLETED", count: 12 },
      secretHint: "Twelve lessons in, the mason's marks on the wall finally meant something.",
    },
  ],
  "tower-of-rhythm": [
    {
      name: "The Silent Floor",
      description:
        "Between the fourth and fifth floors there is a landing with no clock on it.",
      type: "TREASURE",
      order: 90,
      artifactKey: "silent-metronome",
      secret: true,
      secretRule: { kind: "BOSS_DEFEATED", bossKey: "iron-metronome" },
      secretHint: "With the Metronome stopped, you could hear the floor that never ticked.",
    },
  ],
  "hall-of-the-virtuoso": [
    {
      name: "The Practice Room",
      description:
        "Small, windowless, and the only room in the Hall with no audience. Someone spent years in here.",
      type: "REST",
      order: 90,
      secret: true,
      secretRule: { kind: "SKILL_LEVEL", skillKey: "TECHNIQUE", level: 8 },
      secretHint: "Only players who had put the hours in noticed the unmarked door.",
    },
  ],
  "ancient-conservatory": [
    {
      name: "The Masters' Annex",
      description:
        "A reading room for people who had finished the syllabus. The syllabus was long.",
      type: "CHALLENGE",
      order: 90,
      secret: true,
      secretRule: { kind: "PUZZLES_SOLVED", count: 6 },
      secretHint: "Six solved puzzles was the old entrance requirement, and the door still honours it.",
    },
  ],
  "impressionist-gardens": [
    {
      name: "The Pool That Is Not There in Winter",
      description:
        "It only holds water for people who keep coming back.",
      type: "REST",
      order: 90,
      secret: true,
      secretRule: { kind: "STREAK", days: 7 },
      secretHint: "Seven days of the Creative Flame, and the water was there.",
    },
  ],
  "frozen-conservatory": [
    {
      name: "The Thawing Room",
      description:
        "Warm, impossibly, in the middle of the ice. Something in here has been writing for a very long time.",
      type: "TREASURE",
      order: 90,
      artifactKey: "unsigned-score",
      secret: true,
      secretRule: { kind: "COMPOSITIONS", count: 10 },
      secretHint: "Ten pieces of your own, and the ice gave way to whoever had been writing in there.",
    },
  ],
  "inferno-of-virtuosity": [
    {
      name: "The Cold Centre",
      description:
        "The hottest room in the dungeon has a still point in the middle of it.",
      type: "CHALLENGE",
      order: 90,
      secret: true,
      secretRule: { kind: "AREA_CLEARED" },
      secretHint: "With the Inferno emptied, the still point in its middle became a door.",
    },
  ],
  "cathedral-of-composition": [
    {
      name: "The Crypt Beneath the Nave",
      description:
        "Under the floor of the largest room in the dungeon is the smallest one.",
      type: "TREASURE",
      order: 90,
      artifactKey: "tuning-fork-of-the-deep",
      secret: true,
      secretRule: { kind: "SECRETS_FOUND", count: 5 },
      secretHint:
        "Five secrets deep, the floor of the nave sounded hollow — and it was.",
    },
  ],
  "instrument-menagerie": [
    {
      name: "The Empty Cage",
      description:
        "Labelled, hinged, and holding nothing. The label reads: whatever you write for next.",
      type: "CHALLENGE",
      order: 90,
      secret: true,
      secretRule: { kind: "AREA_CLEARED" },
      secretHint: "With every other cage opened, the empty one was obvious.",
    },
  ],
  "orchestral-abyss": [
    {
      name: "The Rehearsal Letter Z",
      description:
        "The score runs to letter Y. Someone has pencilled a Z in the margin and drawn an arrow off the page.",
      type: "CHALLENGE",
      order: 90,
      secret: true,
      secretRule: { kind: "SKILL_LEVEL", skillKey: "ORCHESTRATION", level: 6 },
      secretHint: "You had to be able to read the score before you could see what was written past the end of it.",
    },
  ],
  "loom-of-variations": [
    {
      name: "The Thread That Goes Back",
      description:
        "Follow one thread far enough back and it arrives at the theme before the theme.",
      type: "CHALLENGE",
      order: 90,
      secret: true,
      secretRule: { kind: "AREA_CLEARED" },
      secretHint: "Only with the whole tapestry unwoven could one thread be followed all the way back.",
    },
  ],
  "whispering-catacombs": [
    {
      name: "The Voice That Started It",
      description:
        "Every echo down here is an answer. Somewhere there is the thing that spoke first.",
      type: "CHALLENGE",
      order: 90,
      secret: true,
      secretRule: { kind: "BOSS_DEFEATED", bossKey: "canon-that-eats-itself" },
      secretHint: "With the canon silenced, one voice was still going, and it could be followed.",
    },
  ],
  "clockwork-bazaar": [
    {
      name: "The Stall That Opens on Nothing",
      description:
        "It opens on a beat that does not exist in any meter the Bazaar keeps.",
      type: "TREASURE",
      order: 90,
      artifactKey: "students-eraser",
      secret: true,
      secretRule: { kind: "PUZZLES_SOLVED", count: 4 },
      secretHint: "Four puzzles in, you could count the beat the stall opened on.",
    },
  ],
  "forking-cadences": [
    {
      name: "The Path With No Cadence",
      description:
        "One path in the garden does not end. It has been going for four hundred years and it has not repeated itself.",
      type: "CHALLENGE",
      order: 90,
      secret: true,
      secretRule: { kind: "AREA_CLEARED" },
      secretHint: "Every other path in the garden closed. This one never did.",
    },
  ],
};
