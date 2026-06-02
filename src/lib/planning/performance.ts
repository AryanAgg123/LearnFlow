import { prisma } from "@/lib/prisma";
import { evaluatePerformance } from "@/lib/agents/performance";

function summarizeTaskProgress(tasks: Array<{
  id: string;
  title: string;
  status: string;
  estimatedTime: string;
  dueWindow: string;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  completedAt: Date | null;
  resources: Array<{ title: string; status: string }>;
}>) {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    estimatedTime: task.estimatedTime,
    dueWindow: task.dueWindow,
    scheduledStart: task.scheduledStart?.toISOString() ?? null,
    scheduledEnd: task.scheduledEnd?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    resources: task.resources,
  }));
}

export async function refreshPerformanceSnapshot(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      learnerContext: true,
      roadmapVersions: {
        where: { isActive: true },
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

  if (!user?.learnerContext) {
    return null;
  }

  const activeRoadmap = user.roadmapVersions[0];

  if (!activeRoadmap) {
    return null;
  }

  const completedTasks = activeRoadmap.tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const totalTasks = activeRoadmap.tasks.length || 1;
  const totalResources = activeRoadmap.tasks.flatMap((task) => task.resources).length || 1;
  const completedResources = activeRoadmap.tasks
    .flatMap((task) => task.resources)
    .filter((resource) => resource.status === "COMPLETED").length;

  const insight = await evaluatePerformance({
    learnerContextJson: user.learnerContext.normalizedJson,
    roadmapJson: activeRoadmap.contentJson,
    taskProgressJson: JSON.stringify({
      metrics: {
        completionRate: completedTasks / totalTasks,
        resourceCompletionRate: completedResources / totalResources,
      },
      tasks: summarizeTaskProgress(activeRoadmap.tasks),
    }),
    existingInsightJson:
      user.performanceSnapshots[0]
        ? JSON.stringify({
            summary: user.performanceSnapshots[0].summary,
            onTrackStatus: user.performanceSnapshots[0].onTrackStatus,
            updatedSkillEstimate: user.performanceSnapshots[0].updatedSkillEstimate,
          })
        : null,
  });

  return prisma.performanceSnapshot.create({
    data: {
      userId,
      roadmapVersionId: activeRoadmap.id,
      summary: insight.summary,
      onTrackStatus: insight.onTrackStatus,
      completionRate: completedTasks / totalTasks,
      resourceCompletionRate: completedResources / totalResources,
      updatedSkillEstimate: insight.updatedSkillEstimate,
      weakAreasJson: JSON.stringify(insight.weakAreas),
      suggestionsJson: JSON.stringify(insight.roadmapAdjustmentSuggestions),
      recommendedFocusJson: JSON.stringify(insight.recommendedResourceFocus),
    },
  });
}
