import Link from "next/link";
import type { PropsWithChildren } from "react";
import type { StudentProfile } from "@prisma/client";
import { logoutAction } from "@/lib/auth/actions";

type DashboardShellProps = PropsWithChildren<{
  fullName: string;
  profile: StudentProfile | null;
}>;

export function DashboardShell({
  fullName,
  profile,
  children,
}: DashboardShellProps) {
  return (
    <div className="shell py-6 md:py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="card h-fit p-5">
          <div className="space-y-2">
            <div className="pill">Planning workspace</div>
            <h2 className="text-2xl font-extrabold">Pathly</h2>
            <p className="muted text-sm">
              Built for focused students who want fast clarity and less friction.
            </p>
          </div>

          <div className="mt-8 rounded-3xl bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--muted)]">Signed in as</p>
            <p className="mt-1 text-lg font-bold">{fullName}</p>
          </div>

          <nav className="mt-8 space-y-3 text-sm font-semibold">
            <Link className="block rounded-2xl px-3 py-3 hover:bg-white/70" href="/dashboard">
              Dashboard
            </Link>
            <Link className="block rounded-2xl px-3 py-3 hover:bg-white/70" href="/profile">
              Student profile
            </Link>
            <Link className="block rounded-2xl px-3 py-3 hover:bg-white/70" href="/context">
              Learner context
            </Link>
            <Link className="block rounded-2xl px-3 py-3 hover:bg-white/70" href="/roadmap">
              Roadmap
            </Link>
            <Link className="block rounded-2xl px-3 py-3 hover:bg-white/70" href="/practice-tests">
              Practice tests
            </Link>
          </nav>

          <div className="mt-8 rounded-3xl border border-[var(--line)] p-4">
            <p className="text-sm font-semibold">Profile status</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {profile ? "Ready for agent-powered planning." : "Complete your profile to continue."}
            </p>
          </div>

          <form action={logoutAction} className="mt-8">
            <button className="btn btn-secondary w-full" type="submit">
              Log out
            </button>
          </form>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
