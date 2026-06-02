import Link from "next/link";
import { redirect } from "next/navigation";
import { PracticeTestGenerator } from "@/components/practice-tests/practice-test-generator";
import { PracticeTestViewer } from "@/components/practice-tests/practice-test-viewer";
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function PracticeTestsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      studentProfile: true,
      learnerContext: true,
      roadmapVersions: {
        orderBy: { createdAt: "desc" },
      },
      performanceSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      practiceTests: {
        orderBy: { createdAt: "desc" },
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
  const latestPracticeTest = user.practiceTests[0] ?? null;
  const attempts = user.practiceTests.length
    ? await prisma.practiceTestAttempt.findMany({
        where: {
          userId: user.id,
          practiceTestId: {
            in: user.practiceTests.map((practiceTest) => practiceTest.id),
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const latestAttempt = latestPracticeTest
    ? attempts.find((attempt) => attempt.practiceTestId === latestPracticeTest.id) ?? null
    : null;

  return (
    <DashboardShell fullName={user.fullName} profile={user.studentProfile}>
      <PracticeTestGenerator
        activeRoadmap={activeRoadmap}
        latestPracticeTest={latestPracticeTest}
        learnerContext={user.learnerContext}
      />

      {latestPracticeTest ? (
        <>
          <PracticeTestViewer
            latestAttempt={latestAttempt}
            practiceTest={latestPracticeTest}
          />
          <section className="card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Test history
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {user.practiceTests.map((practiceTest) => (
                <article
                  className="rounded-3xl border border-[var(--line)] bg-white/70 p-4"
                  key={practiceTest.id}
                >
                  <p className="text-sm font-semibold text-[var(--muted)]">
                    {practiceTest.formatPreference}
                  </p>
                  <p className="mt-2 text-lg font-bold">{practiceTest.title}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {practiceTest.summary}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    {practiceTest.focusLabel} - {practiceTest.estimatedTotalMinutes} min
                  </p>
                  {attempts.find((attempt) => attempt.practiceTestId === practiceTest.id) ? (
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Latest score: {
                        attempts.find((attempt) => attempt.practiceTestId === practiceTest.id)
                          ?.scorePercent
                      }%
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="card p-6">
          <p className="font-semibold">No practice test yet.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Generate one from your current learner context and roadmap progress.
          </p>
          {!user.learnerContext ? (
            <Link className="btn btn-secondary mt-4" href="/context">
              Finish learner context first
            </Link>
          ) : null}
        </section>
      )}
    </DashboardShell>
  );
}
