import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";

const features = [
  "A clean profile-first setup that captures the context agents need later.",
  "Simple login, student dashboard shell, and a database model ready for growth.",
  "OpenAI-ready backend boundaries for orchestration, tool use, and future planning flows.",
];

export default async function HomePage() {
  const session = await getCurrentSession();

  return (
    <main className="shell py-6 md:py-10">
      <section className="card overflow-hidden px-6 py-8 md:px-10 md:py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-6">
            <div className="pill">Student personalization, without the clutter</div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
              A focused foundation for AI-powered study planning.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Pathly gives 3rd-year students a clean place to sign in, capture
              their learning context, and move into a personalized dashboard
              that is ready for multi-agent orchestration next.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="btn btn-primary" href={session ? "/dashboard" : "/signup"}>
                {session ? "Open dashboard" : "Create your account"}
              </Link>
              <Link className="btn btn-secondary" href={session ? "/profile" : "/login"}>
                {session ? "Update profile" : "Sign in"}
              </Link>
            </div>
          </div>

          <div className="grid w-full max-w-md gap-4">
            <div className="rounded-[28px] bg-[#132238] p-6 text-white shadow-2xl">
              <p className="text-sm uppercase tracking-[0.2em] text-blue-200">
                Student snapshot
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-3">
                  <span className="text-sm text-blue-100">Target</span>
                  <span className="font-semibold">Semester turnaround</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-3">
                  <span className="text-sm text-blue-100">Time</span>
                  <span className="font-semibold">2 hrs weekday</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-3">
                  <span className="text-sm text-blue-100">Style</span>
                  <span className="font-semibold">Practice + visuals</span>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] bg-white/80 p-5 shadow-lg ring-1 ring-black/5">
              <p className="font-semibold">Phase 1 includes</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                <li>Auth and secure session handling</li>
                <li>Student profile intake flow</li>
                <li>Dashboard shell for future agents</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 py-6 md:grid-cols-3">
        {features.map((feature) => (
          <article className="card p-6" key={feature}>
            <p className="text-lg font-semibold leading-8">{feature}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
