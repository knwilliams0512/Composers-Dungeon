import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Reset Password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h2 className="heading-display mb-1 text-xl">A Forgotten Incantation</h2>
      <p className="mb-6 text-sm text-parchment-400">
        Tell us your email and we will forge a new key.
      </p>
      <ForgotPasswordForm />
    </>
  );
}
