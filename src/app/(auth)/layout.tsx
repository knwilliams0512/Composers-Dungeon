import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="group mb-8 text-center">
        <p className="animate-flicker text-4xl" aria-hidden>
          🕯️
        </p>
        <h1 className="heading-display mt-3 text-2xl transition-colors group-hover:text-gold-200">
          Composer&apos;s Dungeon
        </h1>
        <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-parchment-500">
          Learn · Descend · Compose
        </p>
      </Link>
      <div className="card-gold lit-edge w-full max-w-md animate-rise p-6 sm:p-8">{children}</div>
      <p className="mt-6 flex items-center gap-1.5 text-[11px] text-parchment-500">
        <Icon name="shield" size={12} />
        Everything stays on this machine — no account leaves it.
      </p>
    </div>
  );
}
