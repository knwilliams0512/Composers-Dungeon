import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <>
      <h2 className="heading-display mb-1 text-xl">Return to Your Quest</h2>
      <p className="mb-6 text-sm text-parchment-400">
        The torches are still lit where you left them.
      </p>
      <LoginForm />
      <div className="mt-6 space-y-2 text-center text-sm text-parchment-400">
        <p>
          No account yet?{" "}
          <Link href="/signup" className="text-gold-400 hover:text-gold-300">
            Enter the Dungeon
          </Link>
        </p>
        <p>
          <Link href="/forgot-password" className="hover:text-parchment-200">
            Forgotten your password?
          </Link>
        </p>
      </div>
    </>
  );
}
