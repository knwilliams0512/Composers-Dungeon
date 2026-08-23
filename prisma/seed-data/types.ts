export interface SeedQuizQuestion {
  subject: string;
  difficulty: number;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
}

export interface SeedExercise {
  type: "PRACTICE" | "COMPOSITION";
  title: string;
  prompt: string;
  hint?: string;
}

export interface SeedLesson {
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  tierRequirement: string;
  levelRequirement?: number;
  order: number;
  xpReward: number;
  content: {
    heading: string;
    body: string;
    example?: string;
    /** Highlighted aside: a warning, an aside, or a "why this matters". */
    callout?: { kind: "note" | "warning" | "insight"; text: string };
  }[];
  quiz: SeedQuizQuestion[];
  exercises: SeedExercise[];
  skillRewards: Record<string, number>;
  prerequisiteSlug?: string;
}

/**
 * Optional depth layered onto a lesson by slug (prisma/seed-data/lesson-detail.ts).
 * Kept separate so the core lessons stay readable and detail can grow without
 * touching them.
 */
export interface SeedLessonDetail {
  summary?: string;
  estimatedMinutes?: number;
  keyTerms?: { term: string; definition: string }[];
  commonMistakes?: { mistake: string; fix: string }[];
  listening?: { piece: string; composer: string; why: string }[];
  practiceRoutine?: string[];
  /** Extra content sections appended after the lesson's own. */
  extraSections?: {
    heading: string;
    body: string;
    example?: string;
    callout?: { kind: "note" | "warning" | "insight"; text: string };
  }[];
}
