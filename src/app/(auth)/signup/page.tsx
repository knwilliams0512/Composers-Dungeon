import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Create Account" };

export default function SignupPage() {
  return (
    <>
      <h2 className="heading-display mb-1 text-xl">Enter the Dungeon</h2>
      <p className="mb-6 text-sm text-parchment-400">
        Every great composer once stood at this gate knowing nothing.
      </p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-parchment-400">
        Already inside?{" "}
        <Link href="/login" className="text-gold-400 hover:text-gold-300">
          Sign in
        </Link>
      </p>
    </>
  );
}
