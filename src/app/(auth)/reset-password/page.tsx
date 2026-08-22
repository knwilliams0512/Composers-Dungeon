import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Choose a New Password" };

export default function ResetPasswordPage() {
  return (
    <>
      <h2 className="heading-display mb-1 text-xl">Forge a New Key</h2>
      <p className="mb-6 text-sm text-parchment-400">Choose a new password.</p>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
