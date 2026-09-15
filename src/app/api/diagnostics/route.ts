/**
 * The last thing that went wrong, readable from inside the app.
 *
 * Next.js redacts error messages in production and shows a digest instead, so
 * when the installed app fell over the only thing on screen was a number, and
 * the real message was in a log file behind an environment variable that most
 * people have no reason to know how to open. That made a one-line failure —
 * "The column `fullFreedom` does not exist in the current database" — take days
 * to identify.
 *
 * This is desktop-only: `next start` on a shared machine never sets CD_DESKTOP,
 * and without it this route does not exist. Even in the desktop app it returns
 * nothing but the tail of the app's own stderr log.
 */
import { NextResponse } from "next/server";
import { readFileSync, existsSync, statSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const MAX_LINES = 80;

export async function GET() {
  if (process.env.CD_DESKTOP !== "1") {
    return new NextResponse("Not found", { status: 404 });
  }

  const root = process.env.CD_ROOT;
  const logPath = root ? join(root, "data", "server.log.err") : null;

  let log = "";
  let when: string | null = null;
  if (logPath && existsSync(logPath)) {
    try {
      when = statSync(logPath).mtime.toISOString();
      const lines = readFileSync(logPath, "utf8").split("\n");
      log = lines.slice(-MAX_LINES).join("\n").trim();
    } catch (err) {
      log = `The log exists but could not be read: ${String(err)}`;
    }
  }

  return NextResponse.json({
    version: process.env.CD_VERSION ?? "unknown",
    node: process.version,
    database: process.env.DATABASE_URL ?? "unset",
    logPath,
    logModified: when,
    log: log || "(the error log is empty)",
  });
}
