import { prisma } from "@/lib/prisma";
import type { RoadmapOutput } from "@/lib/agents/schemas";

export async function syncRoadmapTasksForVersion(input: {
  userId: string;
  roadmapVersionId: string;
  roadmap: RoadmapOutput;
}) {
  const taskPayload = input.roadmap.milestones.flatMap((milestone, milestoneIndex) =>
    milestone.tasks.map((task, taskIndex) => ({
      userId: input.userId,
      roadmapVersionId: input.roadmapVersionId,
      milestoneTitle: milestone.title,
      milestoneIndex,
      taskIndex,
      title: task.title,
      details: task.details,
      estimatedTime: task.estimatedTime,
      priority: task.priority,
      dueWindow: task.dueWindow,
    })),
  );

  const existingTasks = await prisma.roadmapTask.findMany({
    where: { roadmapVersionId: input.roadmapVersionId },
    select: {
      id: true,
      milestoneIndex: true,
      taskIndex: true,
    },
  });

  const validKeys = new Set(
    taskPayload.map((task) => `${task.milestoneIndex}:${task.taskIndex}`),
  );

  const tasksToDelete = existingTasks
    .filter((task) => !validKeys.has(`${task.milestoneIndex}:${task.taskIndex}`))
    .map((task) => task.id);

  await prisma.$transaction(async (tx) => {
    if (tasksToDelete.length) {
      await tx.taskResource.deleteMany({
        where: {
          roadmapTaskId: { in: tasksToDelete },
        },
      });

      await tx.roadmapTask.deleteMany({
        where: {
          id: { in: tasksToDelete },
        },
      });
    }

    for (const task of taskPayload) {
      await tx.roadmapTask.upsert({
        where: {
          roadmapVersionId_milestoneIndex_taskIndex: {
            roadmapVersionId: input.roadmapVersionId,
            milestoneIndex: task.milestoneIndex,
            taskIndex: task.taskIndex,
          },
        },
        create: task,
        update: {
          milestoneTitle: task.milestoneTitle,
          title: task.title,
          details: task.details,
          estimatedTime: task.estimatedTime,
          priority: task.priority,
          dueWindow: task.dueWindow,
        },
      });
    }
  });
}
