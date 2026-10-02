import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Reset Password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h2 className="heading-display mb-1 text-xl">A Forgotten Incantation</h2>
      <p className="mb-6 text-sm text-parchment-400">
        Tell us your email and we will forge a new key.
      </p>
      {/* The form reads a query parameter to explain a spent hand-over link, so
          it cannot be prerendered without a boundary to fall back to. */}
      <Suspense fallback={<div className="h-40" />}>
        <ForgotPasswordForm />
      </Suspense>
    </>
  );
}
