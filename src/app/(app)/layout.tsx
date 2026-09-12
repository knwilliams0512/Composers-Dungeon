import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppNav } from "@/components/nav/AppNav";
import { avatarGlyph } from "@/lib/enums";

/**
 * Applies the composer's accessibility preferences to <html> before the page
 * paints.
 *
 * It has to be an inline script rather than a React effect: an effect runs
 * after hydration, which means someone who asked for larger text would get a
 * screenful of small text first, every single navigation. Writing the
 * attributes during HTML parsing avoids that flash.
 *
 * The values are numbers and fixed strings chosen on the server, and they are
 * JSON-encoded on the way in, so nothing a composer types can reach this.
 */
function accessibilityScript(prefs: {
  reduceMotion: boolean | null;
  textScale: string;
  highContrast: boolean;
  readableFont: boolean;
}): string {
  return `(function(){var d=document.documentElement;var p=${JSON.stringify(prefs)};
if(p.textScale&&p.textScale!=="NORMAL")d.setAttribute("data-text",p.textScale);
if(p.reduceMotion===true)d.setAttribute("data-motion","reduce");
if(p.highContrast)d.setAttribute("data-contrast","high");
if(p.readableFont)d.setAttribute("data-font","readable");})();`;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/login");
  if (!profile.onboardingComplete) redirect("/onboarding");

  return (
    <div className="min-h-dvh">
      <script
        dangerouslySetInnerHTML={{
          __html: accessibilityScript({
            reduceMotion: profile.reduceMotion,
            textScale: profile.textScale,
            highContrast: profile.highContrast,
            readableFont: profile.readableFont,
          }),
        }}
      />
      {/* The first stop for anyone on a keyboard: ten nav links stand between
          the top of the page and the content, every single navigation. */}
      <a href="#main" className="skip-link btn-primary">
        Skip to content
      </a>
      <AppNav
        displayName={profile.displayName}
        level={profile.level}
        avatarGlyph={avatarGlyph(profile.avatar)}
      />
      <main id="main" className="px-4 pb-24 pt-16 md:ml-60 md:px-8 md:pb-10 md:pt-8">
        <div className="mx-auto max-w-[1360px]">{children}</div>
      </main>
    </div>
  );
}
