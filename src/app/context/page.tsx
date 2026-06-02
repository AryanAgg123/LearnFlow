import { redirect } from "next/navigation";
import { ContextWorkspace } from "@/components/context/context-workspace";
import { LearnerContextPreview } from "@/components/context/learner-context-preview";
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function ContextPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      studentProfile: true,
      learnerContext: true,
      followUpQuestions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.studentProfile) {
    redirect("/profile");
  }

  const openFollowUp =
    user.followUpQuestions.find((item) => item.status === "OPEN") ?? null;

  return (
    <DashboardShell fullName={user.fullName} profile={user.studentProfile}>
      <ContextWorkspace
        learnerContext={user.learnerContext}
        openFollowUp={openFollowUp}
        profile={user.studentProfile}
      />
      <LearnerContextPreview
        followUpHistory={user.followUpQuestions}
        learnerContext={user.learnerContext}
      />
    </DashboardShell>
  );
}
