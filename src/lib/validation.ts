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

/**
 * The in-app score. Bounded deliberately: this is user input that the server
 * runs music analysis over, so every array and number has a ceiling.
 */
export const scoreSchema = z.object({
  version: z.literal(1),
  key: z.string().trim().max(3),
  mode: z.enum(["major", "minor"]),
  meter: z.object({
    beats: z.number().int().min(1).max(12),
    unit: z.union([z.literal(2), z.literal(4), z.literal(8), z.literal(16)]),
  }),
  tempo: z.number().int().min(30).max(240),
  bars: z.number().int().min(1).max(64),
  instrument: z.string().trim().max(40),
  melody: z
    .array(
      z.object({
        start: z.number().int().min(0).max(4096),
        duration: z.number().int().min(1).max(256),
        pitch: z.number().int().min(21).max(108),
        // How the writer spelled the note, so a saved piece is re-engraved on
        // the lines it was written on. Zod strips unknown keys, so leaving
        // this out would quietly discard it at the moment of saving.
        spell: z.union([z.literal(-1), z.literal(0), z.literal(1)]).optional(),
      })
    )
    .max(2000),
  chords: z
    .array(
      z.object({
        start: z.number().int().min(0).max(4096),
        duration: z.number().int().min(1).max(256),
        degree: z.number().int().min(1).max(7),
        quality: z.enum(["maj", "min", "dim"]),
      })
    )
    .max(128),
});

export const guildPostSchema = z.object({
  content: z.string().trim().min(1, "Say something").max(2000),
  compositionId: z.string().trim().optional(),
});

/**
 * Founding a guild. The key is derived from the name server-side, so only the
 * human-facing fields are accepted here.
 */
export const guildFoundSchema = z.object({
  name: z.string().trim().min(3, "Give the house a name").max(48),
  tagline: z.string().trim().max(80).default(""),
  description: z.string().trim().max(600).default(""),
  emblem: z.string().trim().min(1).max(4).default("\u266c"),
  accent: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour")
    .default("#c9a84c"),
  focus: z.string().trim().max(32).default(""),
});

/** A line of guild chat. Short on purpose: this is talk, not publication. */
export const guildMessageSchema = z.object({
  guildKey: z.string().trim().min(1),
  content: z.string().trim().min(1, "Say something").max(600),
});

/**
 * Lifting a guildmate.
 *
 * The note is required rather than optional, and that is the whole design. A
 * boost with no words is a like, and the app already has likes; making someone
 * name what they are praising is what keeps this worth receiving.
 */
export const guildBoostSchema = z.object({
  guildKey: z.string().trim().min(1),
  toUserId: z.string().trim().min(1),
  note: z
    .string()
    .trim()
    .min(4, "Say what you are lifting them for")
    .max(240),
});

/** A piece the guild writes together, and the parts it is divided into. */
export const collabProjectSchema = z.object({
  guildKey: z.string().trim().min(1),
  title: z.string().trim().min(3, "Give the piece a title").max(80),
  brief: z.string().trim().max(600).default(""),
  musicalKey: z.string().trim().min(1).max(3).default("C"),
  mode: z.enum(["major", "minor"]).default("major"),
  meter: z.string().trim().min(3).max(5).default("4/4"),
  bars: z.number().int().min(4).max(32).default(8),
  parts: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Name the part").max(40),
        instrument: z.string().trim().max(40).default(""),
      })
    )
    .min(2, "A collaboration needs at least two parts")
    .max(8, "Eight parts is as many as one piece can hold"),
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
