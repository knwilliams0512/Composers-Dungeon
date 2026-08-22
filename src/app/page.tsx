import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";

export default async function LandingPage() {
  const userId = await getSessionUserId();
  if (userId) redirect("/hall");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 animate-flicker text-5xl">🕯️</p>
      <h1 className="heading-display text-5xl sm:text-6xl">Composer&apos;s Dungeon</h1>
      <p className="mt-4 max-w-xl text-lg text-parchment-400">
        The Academy teaches you. The Dungeon tests you. Learn music theory from
        your first note, descend through halls of melody and harmony, break
        curses, defeat musical bosses — and emerge a composer.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/signup" className="btn-primary px-8 py-3 text-base">
          Enter the Dungeon
        </Link>
        <Link href="/login" className="btn-secondary px-8 py-3 text-base">
          Return to Your Quest
        </Link>
      </div>
      <div className="mt-16 grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
        {[
          {
            icon: "📖",
            title: "The Academy",
            body: "Structured lessons from the musical alphabet to fugue and virtuoso repertoire.",
          },
          {
            icon: "🕯️",
            title: "The Dungeon",
            body: "Composition challenges, theory puzzles, and curses that bend your creativity.",
          },
          {
            icon: "💀",
            title: "The Bosses",
            body: "Musical trials with health bars. Damage them with modulations, motifs, and craft.",
          },
        ].map((f) => (
          <div key={f.title} className="card p-5">
            <p className="text-2xl">{f.icon}</p>
            <h2 className="mt-2 font-display text-gold-300">{f.title}</h2>
            <p className="mt-1 text-sm text-parchment-400">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
