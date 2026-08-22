import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppNav } from "@/components/nav/AppNav";
import { avatarGlyph } from "@/lib/enums";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/login");
  if (!profile.onboardingComplete) redirect("/onboarding");

  return (
    <div className="min-h-dvh">
      <AppNav
        displayName={profile.displayName}
        level={profile.level}
        avatarGlyph={avatarGlyph(profile.avatar)}
      />
      <main className="px-4 pb-24 pt-16 md:ml-60 md:px-8 md:pb-10 md:pt-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
