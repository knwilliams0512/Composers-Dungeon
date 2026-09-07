/**
 * The houses a composer can join.
 *
 * Each one stands for a way of working rather than a difficulty tier — a
 * player picks the company whose craft they want to keep, not the one that
 * matches their level. Players may found their own alongside these.
 */

export interface SeedGuild {
  key: string;
  name: string;
  tagline: string;
  description: string;
  emblem: string;
  accent: string;
  /** A SkillKey the house is known for, or "" for a general company. */
  focus: string;
  order: number;
}

export const guilds: SeedGuild[] = [
  {
    key: "the-singing-line",
    name: "The Singing Line",
    tagline: "A melody you can carry home.",
    description:
      "The oldest house, and the plainest in its aims: write a line worth humming. Members trade tunes rather than techniques, and hold that anything you cannot sing back after one hearing was not finished.",
    emblem: "♪",
    accent: "#d4557f",
    focus: "MELODY",
    order: 1,
  },
  {
    key: "the-stacked-hand",
    name: "The Stacked Hand",
    tagline: "Every note leans on another.",
    description:
      "Harmonists. They argue about voice leading the way other people argue about politics, and they will show you why your progression collapses in the third bar — usually before you have noticed it yourself.",
    emblem: "⚏",
    accent: "#4f7fd4",
    focus: "HARMONY",
    order: 2,
  },
  {
    key: "the-iron-pulse",
    name: "The Iron Pulse",
    tagline: "Time is the instrument.",
    description:
      "Rhythmists who treat metre as material. Expect displaced accents, meters that will not sit still, and a standing dare to write something in seven that still feels like dancing.",
    emblem: "◈",
    accent: "#2fb3a7",
    focus: "RHYTHM",
    order: 3,
  },
  {
    key: "the-long-arch",
    name: "The Long Arch",
    tagline: "Build something that holds.",
    description:
      "Formalists. Where others polish bars, this house draws the whole shape first — where the piece climbs, where it rests, and where it has earned the right to end.",
    emblem: "◲",
    accent: "#9358c9",
    focus: "FORM",
    order: 4,
  },
  {
    key: "the-quiet-room",
    name: "The Quiet Room",
    tagline: "Say less. Mean more.",
    description:
      "A house for expression and restraint. Its members write slowly, cut hard, and believe most pieces are one repeat and two ideas away from being good.",
    emblem: "☾",
    accent: "#c08adf",
    focus: "EXPRESSION",
    order: 5,
  },
  {
    key: "the-open-bench",
    name: "The Open Bench",
    tagline: "Everyone starts somewhere.",
    description:
      "No specialism and no entry standard — a general company for composers who would rather write widely than deeply, and for anyone not yet sure which craft is theirs. Newcomers are expected, not tolerated.",
    emblem: "♬",
    accent: "#c9a84c",
    focus: "",
    order: 6,
  },
];
