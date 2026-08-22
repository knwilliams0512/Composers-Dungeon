import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8 text-center">
        <p className="animate-flicker text-3xl">🕯️</p>
        <h1 className="heading-display mt-2 text-2xl">Composer&apos;s Dungeon</h1>
      </Link>
      <div className="card w-full max-w-md p-6 sm:p-8">{children}</div>
    </div>
  );
}
