import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * The Studio editor takes the whole viewport: no sidebar, no page padding, no
 * max width. It guards the same way the rest of the app does, then gets out of
 * the way so the score can have every pixel.
 */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/login");
  if (!profile.onboardingComplete) redirect("/onboarding");

  return <>{children}</>;
}
