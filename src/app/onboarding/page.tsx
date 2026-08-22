import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/login");
  if (profile.onboardingComplete) redirect("/hall");

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <p className="animate-flicker text-3xl">🕯️</p>
        <h1 className="heading-display mt-2 text-3xl">Before You Descend</h1>
        <p className="mt-2 text-parchment-400">
          The Dungeon shapes itself to each composer. Tell it who you are.
        </p>
      </header>
      <OnboardingWizard displayName={profile.displayName} />
    </div>
  );
}
