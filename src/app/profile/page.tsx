import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      studentProfile: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell fullName={user.fullName} profile={user.studentProfile}>
      <section className="card p-6 md:p-8">
        <div className="max-w-3xl">
          <div className="pill">Student profile</div>
          <h1 className="mt-4 text-4xl font-extrabold">
            Capture the context your future agents will need.
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Keep this focused and honest. The better this profile reflects your
            real study situation, the more adaptive future planning and coaching
            can be.
          </p>
        </div>
      </section>

      <section className="card p-6 md:p-8">
        <ProfileForm profile={user.studentProfile} />
      </section>
    </DashboardShell>
  );
}
