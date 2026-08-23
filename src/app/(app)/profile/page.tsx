import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { levelFromXp, skillLevelFromXp } from "@/lib/xp";
import { Icon } from "@/components/ui/Icon";
import {
  avatarGlyph,
  parseJsonArray,
  GOAL_LABELS,
  INTEREST_LABELS,
  TIER_INFO,
  type ExperienceTier,
  type Goal,
  type MusicalInterest,
} from "@/lib/enums";

export const metadata = { title: "Your Profile" };

export default async function ProfilePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [profile, skills, specializations, allSpecs, achievementCount, artifactCount, compositionCount] =
    await Promise.all([
      db.userProfile.findUnique({ where: { userId } }),
      db.userSkill.findMany({
        where: { userId },
        include: { skill: true },
        orderBy: { skill: { order: "asc" } },
      }),
      db.userSpecialization.findMany({
        where: { userId },
        include: { specialization: true },
      }),
      db.specialization.findMany({ orderBy: { key: "asc" } }),
      db.userAchievement.count({ where: { userId } }),
      db.userArtifact.count({ where: { userId } }),
      db.composition.count({ where: { userId } }),
    ]);
  if (!profile) redirect("/login");

  const xp = levelFromXp(profile.totalXp);
  const goals = parseJsonArray(profile.goals) as Goal[];
  const interests = parseJsonArray(profile.interests) as MusicalInterest[];
  const tierLabel =
    TIER_INFO[profile.experienceTier as ExperienceTier]?.label ?? profile.experienceTier;
  const unlockedSpecIds = new Set(specializations.map((s) => s.specializationId));

  const rankedSkills = [...skills].sort((a, b) => b.level - a.level || b.xp - a.xp);

  return (
    <div>
      <SectionHeading
        eyebrow="Prestigious · Collectible · Yours"
        title="Composer Profile"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Overview */}
          <section className="card-gold p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-gold-600/60 bg-abyss-800 text-4xl shadow-glow">
                {avatarGlyph(profile.avatar)}
              </span>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h2 className="heading-display text-2xl">{profile.displayName}</h2>
                <p className="text-sm text-parchment-400">
                  Level {xp.level} Composer · {tierLabel} ·{" "}
                  {profile.visibility === "PUBLIC" ? "Public" : "Private"} profile
                </p>
                {profile.bio && <p className="mt-1 text-parchment-300">{profile.bio}</p>}
                <ProgressBar
                  percent={xp.percent}
                  className="mt-3"
                  label={`${profile.totalXp.toLocaleString()} total XP · ${xp.intoLevel}/${xp.needed} to next level`}
                />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              {[
                { label: "Creative Flame", value: `${profile.streakCount}d` },
                { label: "Longest Streak", value: `${profile.longestStreak}d` },
                { label: "Rest Days", value: `⏳ ${profile.restDays}` },
                { label: "Member Since", value: profile.createdAt.toLocaleDateString() },
              ].map((s) => (
                <div key={s.label} className="rounded bg-abyss-800/70 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-parchment-500">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-sm text-parchment-100">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Achievements", value: achievementCount },
                { label: "Artifacts", value: artifactCount },
                { label: "Compositions", value: compositionCount },
              ].map((s) => (
                <div key={s.label} className="rounded bg-abyss-800/70 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-parchment-500">
                    {s.label}
                  </p>
                  <p className="mt-0.5 font-display text-lg text-gold-300">{s.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section className="card p-5">
            <h2 className="heading-display mb-3 text-lg">Skill Meters</h2>
            <div className="space-y-3">
              {skills.length === 0 && (
                <p className="text-sm text-parchment-500">
                  Skills awaken as you complete lessons and challenges.
                </p>
              )}
              {skills.map((s) => {
                const p = skillLevelFromXp(s.xp);
                const rank = rankedSkills.findIndex((r) => r.id === s.id) + 1;
                return (
                  <div key={s.id}>
                    <div className="mb-1 flex items-baseline justify-between text-sm">
                      <span className="text-parchment-200">
                        {s.skill.icon} {s.skill.name}
                        <span className="ml-2 text-xs text-parchment-500">
                          #{rank} strongest
                        </span>
                      </span>
                      <span className="font-display text-gold-400">
                        Lv {p.level}
                        <span className="ml-1 text-xs text-parchment-500">
                          {p.intoLevel}/{p.needed} XP
                        </span>
                      </span>
                    </div>
                    <ProgressBar percent={p.percent} color="arcane" />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Specializations */}
          <section className="card p-5">
            <h2 className="heading-display mb-3 text-lg">Composer Specializations</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {allSpecs.map((spec) => {
                const unlocked = unlockedSpecIds.has(spec.id);
                const focus = parseJsonArray(spec.focus);
                return (
                  <div
                    key={spec.id}
                    className={`rounded border p-4 ${
                      unlocked
                        ? "border-purple-400/50 bg-purple-900/10"
                        : "border-abyss-600 opacity-60"
                    }`}
                  >
                    <p className="font-display text-parchment-100">
                      {spec.icon} {spec.name} {unlocked && "✓"}
                    </p>
                    <p className="mt-1 text-xs text-parchment-400">{spec.description}</p>
                    <p className="mt-2 text-[11px] text-parchment-500">
                      Focus: {focus.join(" · ")}
                    </p>
                    {!unlocked && (
                      <p className="mt-1 text-[11px] text-parchment-500">
                        <Icon name="lock" size={11} className="mr-1 inline" /> Level{" "}
                        {spec.levelRequirement}
                        {spec.skillKey &&
                          ` + ${spec.skillKey.toLowerCase()} skill ${spec.requiredSkillLevel}`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Goals & interests */}
          <section className="card p-5">
            <h2 className="heading-display mb-3 text-lg">Goals & Interests</h2>
            <p className="label">Goals</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {goals.map((g) => (
                <span key={g} className="rounded-full border border-abyss-600 px-3 py-1 text-xs text-parchment-300">
                  {GOAL_LABELS[g] ?? g}
                </span>
              ))}
            </div>
            <p className="label">Musical Interests</p>
            <div className="flex flex-wrap gap-2">
              {interests.map((i) => (
                <span key={i} className="rounded-full border border-gold-700/50 px-3 py-1 text-xs text-gold-300">
                  {INTEREST_LABELS[i] ?? i}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Edit panel */}
        <div>
          <ProfileEditor
            initial={{
              displayName: profile.displayName,
              bio: profile.bio,
              avatar: profile.avatar,
              visibility: profile.visibility,
            }}
          />
        </div>
      </div>
    </div>
  );
}
