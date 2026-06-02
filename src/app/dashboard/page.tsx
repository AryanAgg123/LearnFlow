import Link from "next/link";
import { redirect } from "next/navigation";
import { ProgressOverview } from "@/components/dashboard/progress-overview";
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { getCurrentSession } from "@/lib/auth/session";
import { contextStatusLabel, parsePerformanceSnapshot } from "@/lib/planning/helpers";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      studentProfile: true,
      learnerContext: true,
      followUpQuestions: true,
      roadmapVersions: {
        orderBy: { createdAt: "desc" },
        include: {
          tasks: {
            include: {
              resources: true,
            },
          },
        },
      },
      calendarSync: true,
      performanceSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      practiceTests: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const profile = user.studentProfile;
  const openFollowUp =
    user.followUpQuestions.find((item) => item.status === "OPEN") ?? null;
  const activeRoadmap = user.roadmapVersions.find((item) => item.isActive) ?? null;
  const tasks = activeRoadmap?.tasks ?? [];
  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length;
  const totalResources = tasks.flatMap((task) => task.resources).length || 1;
  const completedResources = tasks
    .flatMap((task) => task.resources)
    .filter((resource) => resource.status === "COMPLETED").length;
  const scheduledCount = tasks.filter((task) => Boolean(task.scheduledStart)).length;
  const latestInsight = parsePerformanceSnapshot(user.performanceSnapshots[0] ?? null);
  const latestPracticeTest = user.practiceTests[0] ?? null;

  return (
    <DashboardShell fullName={user.fullName} profile={profile}>
      <section className="card p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="pill">Dashboard</div>
            <h1 className="mt-4 text-4xl font-extrabold">
              {profile ? "Your planning foundation is ready to think." : "Let's finish your setup."}
            </h1>
            <p className="mt-3 max-w-2xl text-[var(--muted)]">
              {profile
                ? "Your profile, learner-context pipeline, resource curation, calendar sync, and performance tracking are all connected. The app can now keep learning plans and execution aligned."
                : "Complete your student profile so the app can start adapting around your subject, time, skill level, and constraints."}
            </p>
          </div>

          <Link className="btn btn-primary" href={profile ? "/context" : "/profile"}>
            {profile ? "Review learner context" : "Complete profile"}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="card p-5">
          <p className="text-sm font-semibold text-[var(--muted)]">Learner context</p>
          <p className="mt-3 text-3xl font-extrabold">
            {contextStatusLabel(user.learnerContext, openFollowUp)}
          </p>
        </article>
        <article className="card p-5">
          <p className="text-sm font-semibold text-[var(--muted)]">Task completion</p>
          <p className="mt-3 text-3xl font-extrabold">
            {Math.round((completedTasks / totalTasks) * 100)}%
          </p>
        </article>
        <article className="card p-5">
          <p className="text-sm font-semibold text-[var(--muted)]">Resource coverage</p>
          <p className="mt-3 text-3xl font-extrabold">
            {tasks.filter((task) => task.resources.length > 0).length}
          </p>
        </article>
        <article className="card p-5">
          <p className="text-sm font-semibold text-[var(--muted)]">Calendar sync</p>
          <p className="mt-3 text-3xl font-extrabold">
            {user.calendarSync?.isConnected ? "On" : "Off"}
          </p>
        </article>
      </section>

      <ProgressOverview
        completionRate={completedTasks / totalTasks}
        latestInsight={latestInsight}
        resourceCompletionRate={completedResources / totalResources}
        scheduledCount={scheduledCount}
      />

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Current execution snapshot
          </p>
          {activeRoadmap ? (
            <div className="mt-5 space-y-4">
              {tasks.slice(0, 5).map((task) => (
                <div
                  className="rounded-3xl border border-[var(--line)] bg-white/70 p-4"
                  key={task.id}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold">{task.title}</p>
                      <p className="text-sm text-[var(--muted)]">{task.status}</p>
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      {task.scheduledStart
                        ? new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(task.scheduledStart)
                        : "Not scheduled"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-[var(--muted)]">
              Generate a roadmap to start tracking execution.
            </p>
          )}
        </article>

        <article className="card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Next action
          </p>
          <div className="mt-5 space-y-3">
            {!user.learnerContext ? (
              <Link
                className="block rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-4 text-sm"
                href="/context"
              >
                Run the student info agent to build normalized learner context.
              </Link>
            ) : openFollowUp ? (
              <Link
                className="block rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-4 text-sm"
                href="/context"
              >
                Answer the pending follow-up question before roadmap generation.
              </Link>
            ) : !activeRoadmap ? (
              <Link
                className="block rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-4 text-sm"
                href="/roadmap"
              >
                Generate the first personalized roadmap from the learner context.
              </Link>
            ) : !tasks.some((task) => task.resources.length > 0) ? (
              <Link
                className="block rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-4 text-sm"
                href="/roadmap"
              >
                Curate resources and sync your study schedule from the roadmap page.
              </Link>
            ) : !latestPracticeTest ? (
              <Link
                className="block rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-4 text-sm"
                href="/practice-tests"
              >
                Generate a practice test from your current progress and weak areas.
              </Link>
            ) : (
              <Link
                className="block rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-4 text-sm"
                href="/practice-tests"
              >
                Generate a fresh quiz or coding test that matches your current level.
              </Link>
            )}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
