import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ALL_TIERS } from "@/lib/composer-freedom";

/**
 * The landing page is the one screen a visitor judges the whole app by, so it
 * shows the actual thing: a rendered score with the standards beside it, the
 * descent through the nine areas, and the ladder of earned freedom — all
 * static markup, no client JS beyond what the shell already ships.
 */

/* A real little melody, drawn as the piano roll the composer uses.
   C D E F | G A G F | E F E D | C D E C — stepwise, one peak, ends home. */
const HERO_NOTES: { start: number; pitch: number; len?: number }[] = [
  { start: 0, pitch: 0 }, { start: 1, pitch: 1 }, { start: 2, pitch: 2 }, { start: 3, pitch: 3 },
  { start: 4, pitch: 4 }, { start: 5, pitch: 5 }, { start: 6, pitch: 4 }, { start: 7, pitch: 3 },
  { start: 8, pitch: 2 }, { start: 9, pitch: 3 }, { start: 10, pitch: 2 }, { start: 11, pitch: 1 },
  { start: 12, pitch: 0 }, { start: 13, pitch: 1 }, { start: 14, pitch: 2, len: 1 }, { start: 15, pitch: 0 },
];

const HERO_STANDARDS = [
  { label: "Stays in the key", done: true },
  { label: "One clear high point", done: true },
  { label: "Mostly stepwise motion", done: true },
  { label: "Ends on the tonic", done: true },
];

const JOURNEY: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "book",
    title: "Learn",
    body: "Twenty-five Academy lessons, from the musical alphabet to virtuoso repertoire — each with vocabulary, the mistakes everyone makes first, recordings worth hearing, and a five-minute drill.",
  },
  {
    icon: "candle",
    title: "Descend",
    body: "Nine dungeon areas of generated trials, theory puzzles, creative curses and hidden treasure. Every area trains a different craft, and every trial hands you a finished brief.",
  },
  {
    icon: "quill",
    title: "Compose",
    body: "Write the music here, on a grid where every note fits the key, with a synth in the page and the trial's standards checking themselves as you go. Meet them all or the level does not pass.",
  },
];

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "target",
    title: "A judge that cannot be charmed",
    body: "Every trial's standards are checked by the engine, twice — live while you write, and again on the server when you submit. XP is earned, never claimed.",
  },
  {
    icon: "skull",
    title: "Bosses with health bars",
    body: "The Pale Soprano. The Iron Metronome. The Chromatic Serpent. Wound them with craft; the final blow must be a finished composition.",
  },
  {
    icon: "flame",
    title: "The Creative Flame",
    body: "Write every day and the flame burns — +10% XP while it does, milestones at 7, 30 and 100 days, and forgiving rest days when life happens.",
  },
  {
    icon: "layers",
    title: "Nine skills, tracked apart",
    body: "Melody, harmony, rhythm, form, counterpoint and more — each with its own level, so the dungeon can send you where you are weakest.",
  },
  {
    icon: "chest",
    title: "Artifacts and curses",
    body: "The Ancient Motif rerolls a trial you hate. The Hourglass of Rest protects your streak. Curses hand you a restriction and dare you to write well inside it.",
  },
  {
    icon: "shield",
    title: "Yours, entirely",
    body: "Runs on your own machine. No server, no uploads, no subscription. Your music lives in one file you can copy anywhere.",
  },
];

const AREAS = [
  "Hall of Melody",
  "Crypt of Harmony",
  "Tower of Rhythm",
  "Ancient Conservatory",
  "Impressionist Gardens",
  "Hall of the Virtuoso",
  "Frozen Conservatory",
  "Inferno of Virtuosity",
  "Cathedral of Composition",
];

export default async function LandingPage() {
  const userId = await getSessionUserId();
  if (userId) redirect("/hall");

  return (
    <div className="overflow-x-hidden">
      {/* ================= Hero ================= */}
      <section className="relative flex min-h-[92dvh] flex-col items-center justify-center px-6 pb-16 pt-20 text-center">
        <p className="mb-5 animate-flicker text-6xl" aria-hidden>
          🕯️
        </p>
        <h1 className="heading-display max-w-3xl text-balance text-5xl leading-tight sm:text-7xl">
          Composer&apos;s Dungeon
        </h1>
        <p className="mt-3 font-display text-sm uppercase tracking-[0.4em] text-gold-600">
          Learn · Descend · Compose
        </p>
        <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-parchment-300">
          An RPG for people who want to write music. Start knowing nothing; learn theory in
          the Academy, then descend into a dungeon that hands you real composition briefs —
          and judges what you write.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link href="/signup" className="btn-primary px-9 py-3.5 text-base">
            <Icon name="candle" size={18} /> Enter the Dungeon
          </Link>
          <Link href="/login" className="btn-secondary px-9 py-3.5 text-base">
            Return to Your Quest
          </Link>
        </div>
        <p className="mt-4 text-xs text-parchment-500">
          Free · runs entirely on your machine · no experience needed
        </p>

        {/* The composer, rendered as it actually looks */}
        <div className="card-gold lit-edge mt-14 w-full max-w-4xl p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_15rem]">
            <div>
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-parchment-500">
                <span className="flex items-center gap-1.5">
                  <Icon name="sword" size={11} className="text-crimson-400" /> Trial of the
                  Echoing Steps
                </span>
                <span>C major · 4/4 · 4 bars</span>
              </div>
              <svg
                viewBox="0 0 160 66"
                className="w-full rounded-lg border border-abyss-600/60 bg-abyss-900/70"
                role="img"
                aria-label="A short melody drawn on the composer's grid"
              >
                {/* beat lines */}
                {Array.from({ length: 15 }).map((_, i) => (
                  <line
                    key={i}
                    x1={(i + 1) * 10}
                    y1={2}
                    x2={(i + 1) * 10}
                    y2={64}
                    stroke={(i + 1) % 4 === 0 ? "#2d2547" : "#171326"}
                    strokeWidth={(i + 1) % 4 === 0 ? 1.2 : 0.7}
                  />
                ))}
                {/* row lines */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line key={i} x1={0} y1={(i + 1) * 11} x2={160} y2={(i + 1) * 11} stroke="#110e1c" strokeWidth={0.6} />
                ))}
                {/* notes */}
                {HERO_NOTES.map((n, i) => (
                  <rect
                    key={i}
                    x={n.start * 10 + 0.8}
                    y={55 - n.pitch * 10.5}
                    width={(n.len ?? 1) * 10 - 1.6}
                    height={8.5}
                    rx={1.6}
                    fill={n.pitch === 5 ? "#f0d894" : "#c9a84c"}
                    opacity={0.95}
                  />
                ))}
              </svg>
              <p className="mt-2 text-left text-[11px] text-parchment-500">
                Sixteen notes, one peak, home again — placed by clicking, heard by pressing
                play.
              </p>
            </div>
            <div className="rounded-lg border border-abyss-600/60 bg-abyss-900/50 p-4 text-left">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-gold-500">
                <Icon name="target" size={11} /> The Standard
              </p>
              <ul className="mt-3 space-y-2.5">
                {HERO_STANDARDS.map((s) => (
                  <li key={s.label} className="flex items-center gap-2 text-[13px] text-parchment-300">
                    <Icon name="check" size={13} className="shrink-0 text-emerald-400" />
                    {s.label}
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-abyss-600/60 pt-2.5 text-[11px] text-parchment-500">
                All four met — this piece passes the trial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= The journey ================= */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rune-divider">
          <span className="font-display text-xs uppercase tracking-[0.35em] text-gold-500">
            The Way Down
          </span>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {JOURNEY.map((step, i) => (
            <div key={step.title} className="card lit-edge relative p-6">
              <span className="absolute right-5 top-4 font-display text-4xl text-abyss-600">
                {i + 1}
              </span>
              <Icon name={step.icon} size={26} className="text-gold-500" />
              <h2 className="heading-display mt-3 text-xl">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-parchment-400">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= The descent ================= */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="rune-divider">
          <span className="font-display text-xs uppercase tracking-[0.35em] text-crimson-400">
            Nine Halls, Ever Deeper
          </span>
        </div>
        <ol className="relative mx-auto mt-10 max-w-md space-y-0 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-gradient-to-b before:from-gold-700/60 before:via-abyss-600 before:to-crimson-500/70">
          {AREAS.map((area, i) => (
            <li key={area} className="relative flex items-center gap-4 py-2.5 pl-9">
              <span
                className="absolute left-0 flex h-[23px] w-[23px] items-center justify-center rounded-full border bg-abyss-900 text-[10px] font-semibold"
                style={{
                  borderColor: `rgba(${Math.round(125 + i * 6)}, ${Math.round(98 - i * 6)}, ${Math.round(41 + i * 1)}, 0.8)`,
                  color: i < 5 ? "#e3c26d" : "#c2554f",
                }}
              >
                {i + 1}
              </span>
              <span
                className="font-display tracking-wide"
                style={{ color: i < 5 ? "#d6c5a0" : i < 8 ? "#b3a07c" : "#f0d894", fontSize: i === 8 ? "1.1rem" : "1rem" }}
              >
                {area}
              </span>
              {i === 8 && (
                <span className="pill-crimson ml-auto">
                  <Icon name="skull" size={10} /> The Forgotten Composer
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* ================= Features ================= */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rune-divider">
          <span className="font-display text-xs uppercase tracking-[0.35em] text-gold-500">
            What Waits Below
          </span>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <Icon name={f.icon} size={22} className="text-gold-500" />
              <h3 className="mt-2.5 font-display text-lg text-gold-300">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-parchment-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= Earned freedom ================= */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="rune-divider">
          <span className="font-display text-xs uppercase tracking-[0.35em] text-arcane-300">
            Freedom Is Earned
          </span>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-parchment-400">
          A blank page with infinite options is why beginners write nothing. You start with
          one octave, in key, and two note lengths — and every rank you earn hands back a
          decision.
        </p>
        <ol className="mt-8 space-y-2.5">
          {ALL_TIERS.map((t, i) => (
            <li
              key={t.tier}
              className="card flex items-center gap-4 px-5 py-3.5"
              style={{ marginLeft: `${i * 4}%`, marginRight: `${(4 - i) * 4}%` }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-700/60 font-display text-sm text-gold-400">
                {t.tier}
              </span>
              <div className="min-w-0">
                <p className="font-display tracking-wide text-parchment-100">{t.name}</p>
                <p className="truncate text-xs text-parchment-500">{t.blurb}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ================= Final call ================= */}
      <section className="px-6 pb-24 pt-10 text-center">
        <div className="card-gold lit-edge mx-auto max-w-2xl p-10">
          <Icon name="note" size={34} className="mx-auto text-gold-400" />
          <h2 className="heading-display mt-4 text-3xl text-balance">
            The first note is the hardest. Write it tonight.
          </h2>
          <p className="mt-3 text-sm text-parchment-400">
            Two minutes of onboarding, and the dungeon shapes itself to you.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary px-9 py-3.5 text-base">
              <Icon name="candle" size={18} /> Begin
            </Link>
            <Link href="/login" className="btn-ghost">
              I already have a quest
            </Link>
          </div>
        </div>
        <p className="mt-10 text-[11px] uppercase tracking-[0.3em] text-parchment-500/70">
          Composer&apos;s Dungeon · Learn · Descend · Compose
        </p>
      </section>
    </div>
  );
}
