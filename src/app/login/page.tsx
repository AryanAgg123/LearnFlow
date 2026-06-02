import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { loginAction } from "@/lib/auth/actions";
import { getCurrentSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <section className="card w-full max-w-lg p-8 md:p-10">
        <div className="mb-8">
          <div className="pill">Welcome back</div>
          <h1 className="mt-4 text-4xl font-extrabold">Sign in fast and keep moving.</h1>
          <p className="mt-3 text-[var(--muted)]">
            Keep your study setup simple. Log in, update your context, and pick
            up where you left off.
          </p>
        </div>
        <AuthForm action={loginAction} mode="login" />
      </section>
    </main>
  );
}
