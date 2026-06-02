import { redirect } from "next/navigation";
import { GoogleCalendarCard } from "@/components/calendar/google-calendar-card";
import { PlanningActionsPanel } from "@/components/roadmap/planning-actions-panel";
import { RoadmapGenerator } from "@/components/roadmap/roadmap-generator";
import { RoadmapEditor } from "@/components/roadmap/roadmap-editor";
import { TaskBoard } from "@/components/roadmap/task-board";
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { getCurrentSession } from "@/lib/auth/session";
import { parsePerformanceSnapshot, parseRoadmapJson } from "@/lib/planning/helpers";
import { prisma } from "@/lib/prisma";

export default async function RoadmapPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      studentProfile: true,
      learnerContext: true,
      calendarSync: true,
      roadmapVersions: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          tasks: {
            include: {
              resources: true,
            },
            orderBy: [{ milestoneIndex: "asc" }, { taskIndex: "asc" }],
          },
        },
      },
      performanceSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.studentProfile) {
    redirect("/profile");
  }

  const activeRoadmap =
    user.roadmapVersions.find((item) => item.isActive) ?? null;
  const latestInsight = parsePerformanceSnapshot(user.performanceSnapshots[0] ?? null);

  return (
    <DashboardShell fullName={user.fullName} profile={user.studentProfile}>
      <RoadmapGenerator
        activeRoadmap={activeRoadmap}
        learnerContext={user.learnerContext}
      />
      <GoogleCalendarCard calendarSync={user.calendarSync} />
      <PlanningActionsPanel />

      {activeRoadmap ? (
        <>
          <RoadmapEditor
            roadmap={parseRoadmapJson(activeRoadmap.contentJson)}
            roadmapVersion={activeRoadmap}
          />
          <TaskBoard tasks={activeRoadmap.tasks} />
          <section className="card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Version history
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {user.roadmapVersions.map((version) => (
                <article
                  className="rounded-3xl border border-[var(--line)] bg-white/70 p-4"
                  key={version.id}
                >
                  <p className="text-sm font-semibold text-[var(--muted)]">
                    Version {version.versionNumber}
                  </p>
                  <p className="mt-2 text-lg font-bold">{version.goal}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {version.summary || "No summary saved."}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    {version.source} {version.isActive ? "- Active" : ""}
                  </p>
                </article>
              ))}
            </div>
          </section>
          {latestInsight ? (
            <section className="card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Latest performance insight
              </p>
              <p className="mt-4 text-2xl font-extrabold">{latestInsight.onTrackStatus}</p>
              <p className="mt-3 text-[var(--muted)]">{latestInsight.summary}</p>
            </section>
          ) : null}
        </>
      ) : (
        <section className="card p-6">
          <p className="font-semibold">No roadmap yet.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Once your learner context is ready, the roadmap agent can create the
            first version here.
          </p>
        </section>
      )}
    </DashboardShell>
  );
}
