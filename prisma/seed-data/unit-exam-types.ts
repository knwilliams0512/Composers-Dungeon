/**
 * The shape of a unit exam.
 *
 * Every question names the lesson and the section it comes from. That is not
 * bookkeeping: scripts/check-exams.ts refuses a unit whose exam leaves any
 * section of any of its lessons untested, which is the only way "the exam
 * covers the whole unit" can be a fact rather than an intention.
 */

export interface ExamQuestion {
  /** The lesson slug this is drawn from. */
  slug: string;
  /** The exact section heading inside that lesson. */
  heading: string;
  prompt: string;
  /** Two or more options. The text of each must be unique within a question. */
  choices: string[];
  /** Index into `choices`. */
  answer: number;
  /** Shown after answering, right or wrong. Says why, never just "correct". */
  why: string;
}

export interface UnitExamSpec {
  /** The roadmap unit, e.g. "2.3". */
  unit: string;
  title: string;
  blurb: string;
  /**
   * Percent needed to pass. 75 unless a unit has a reason to differ.
   *
   * Not 80, which sounds rounder and is harsher than it reads: on an
   * eight-question paper 80% means seven right, so one slip fails you. At
   * 75% two may be wrong, which is a gate rather than a trap. The screen
   * states the actual count either way.
   */
  passMark?: number;
  questions: ExamQuestion[];
}
