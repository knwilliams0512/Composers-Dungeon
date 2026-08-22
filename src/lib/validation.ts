import { z } from "zod";
import {
  AVATARS,
  EXPERIENCE_TIERS,
  GOALS,
  INTERESTS,
  PROFILE_VISIBILITIES,
} from "@/lib/enums";

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  displayName: z.string().trim().min(2, "Name too short").max(40, "Name too long"),
});

export const onboardingSchema = z.object({
  experienceTier: z.enum(EXPERIENCE_TIERS),
  goals: z.array(z.enum(GOALS)).min(1, "Pick at least one goal").max(10),
  interests: z.array(z.enum(INTERESTS)).min(1, "Pick at least one interest").max(6),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(2).max(40),
  bio: z.string().trim().max(500),
  avatar: z.enum(AVATARS),
  visibility: z.enum(PROFILE_VISIBILITIES),
});

export const compositionSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(120),
  description: z.string().trim().max(2000).default(""),
  reflection: z.string().trim().max(2000).default(""),
  scoreLink: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Score link must be a URL")
    .default(""),
  visibility: z.enum(PROFILE_VISIBILITIES).default("PRIVATE"),
});

export const guildPostSchema = z.object({
  content: z.string().trim().min(1, "Say something").max(2000),
  compositionId: z.string().trim().optional(),
});

export const commentSchema = z.object({
  postId: z.string(),
  content: z.string().trim().min(1).max(1000),
});

export const quizSubmissionSchema = z.object({
  lessonSlug: z.string(),
  answers: z.array(
    z.object({ questionId: z.string(), choiceIndex: z.number().int().min(0).max(10) })
  ),
});

export const placementSubmissionSchema = z.object({
  answers: z
    .array(
      z.object({ questionId: z.string(), choiceIndex: z.number().int().min(0).max(10) })
    )
    .min(1)
    .max(30),
});
