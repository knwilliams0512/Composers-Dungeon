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
  content: { heading: string; body: string; example?: string }[];
  quiz: SeedQuizQuestion[];
  exercises: SeedExercise[];
  skillRewards: Record<string, number>;
  prerequisiteSlug?: string;
}
