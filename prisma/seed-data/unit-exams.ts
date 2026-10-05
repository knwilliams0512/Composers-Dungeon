import type { UnitExamSpec } from "./unit-exam-types";
import { level1Exams } from "./unit-exams-1";
import { level2Exams } from "./unit-exams-2";
import { level3Exams } from "./unit-exams-3";
import { level4Exams } from "./unit-exams-4";
import { level5Exams } from "./unit-exams-5";
import { level6Exams } from "./unit-exams-6";

/**
 * Every unit's exam, in roadmap order.
 *
 * Split by level because one file of forty exams is a file nobody reads
 * carefully, and these have to be read carefully — a wrong answer here does
 * not merely teach the wrong thing, it locks somebody out of the next unit for
 * knowing the right one.
 */
export const unitExams: UnitExamSpec[] = [...level1Exams, ...level2Exams, ...level3Exams, ...level4Exams, ...level5Exams, ...level6Exams];
