import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Workshop } from "@/components/composer/Workshop";
import { Icon } from "@/components/ui/Icon";
import { freedomForPlayer } from "@/lib/composer-freedom";

export const metadata = { title: "The Composer's Workshop" };

export default async function WorkshopPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [profile, lessonsCompleted, recent] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    db.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
    db.composition.findMany({
      where: { userId, score: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true },
    }),
  ]);
  if (!profile) redirect("/login");

  const freedom = freedomForPlayer(profile.level, lessonsCompleted);

  return (
    <div>
      <SectionHeading
        eyebrow="No trial · No judge · Your own brief"
        title="The Composer's Workshop"
        subtitle="The dungeon hands you a brief and grades what you write. Here nobody does. Set the piece up how you like, write it, keep it — and take as long as you want."
      />

      <Workshop freedom={freedom} />

      {recent.length > 0 && (
        <section className="card mt-6 p-5">
          <h3 className="heading-display text-base">Recently Written Here</h3>
          <ul className="mt-3 space-y-2">
            {recent.map((c) => (
              <li key={c.id} className="flex items-center gap-3 text-sm">
                <Icon name="quill" size={14} className="text-gold-500" />
                <span className="text-parchment-200">{c.title}</span>
                <span className="ml-auto text-xs text-parchment-500">
                  {c.createdAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/library" className="btn-ghost mt-3 text-xs">
            <Icon name="scroll" size={13} /> Open the Library
          </Link>
        </section>
      )}
    </div>
  );
}
