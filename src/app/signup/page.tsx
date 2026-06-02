import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { signupAction } from "@/lib/auth/actions";
import { getCurrentSession } from "@/lib/auth/session";

export default async function SignupPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <section className="card w-full max-w-lg p-8 md:p-10">
        <div className="mb-8">
          <div className="pill">Start strong</div>
          <h1 className="mt-4 text-4xl font-extrabold">
            Create your account and set your direction.
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            This foundation is designed for students who want fast setup,
            personalized context, and a dashboard that stays clear instead of noisy.
          </p>
        </div>
        <AuthForm action={signupAction} mode="signup" />
      </section>
    </main>
  );
}
