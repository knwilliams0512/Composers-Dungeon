import { emptyScore, type Score } from "@/lib/score";

/**
 * The setup every part of a collaboration is written against.
 *
 * Lives here rather than beside the actions because a "use server" module may
 * only export async functions — every sync export of one becomes a client
 * reference stub and the build refuses it. The editor needs this on the client
 * to open at the right key, and the server needs it to check what comes back,
 * so it belongs to neither and sits between them.
 */
export interface CollabSetup {
  musicalKey: string;
  mode: string;
  meter: string;
  bars: number;
}

export function setupForProject(project: CollabSetup): Score {
  const [beats, unit] = project.meter.split("/").map((n) => Number.parseInt(n, 10));
  return emptyScore({
    key: project.musicalKey,
    mode: project.mode === "minor" ? "minor" : "major",
    meter: {
      beats: Number.isFinite(beats) && beats > 0 ? beats : 4,
      unit: Number.isFinite(unit) && unit > 0 ? unit : 4,
    },
    bars: project.bars,
  });
}

/** How a part's setup reads in a sentence, for the places that explain it. */
export function describeSetup(project: CollabSetup): string {
  return `${project.musicalKey} ${project.mode}, ${project.meter}, ${project.bars} bars`;
}
