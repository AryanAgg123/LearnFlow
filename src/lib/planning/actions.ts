"use server";

import { FollowUpStatus, LearnerContextStatus, ProgressStatus, ResourceProgressStatus, RoadmapVersionSource, CalendarEventStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { evaluatePracticeTest, generatePracticeTest } from "@/lib/agents/assessment";
import { curateTaskResources } from "@/lib/agents/resource";
import { generateRoadmapFromContext } from "@/lib/agents/roadmap";
import { createSchedulePlan } from "@/lib/agents/scheduler";
import { runStudentInfoPipeline } from "@/lib/agents/student-info";
import { getCurrentSession } from "@/lib/auth/session";
import { createManagedCalendarEvent, deleteManagedCalendarEvent, disconnectGoogleCalendar, getAuthorizedGoogleCalendar, markCalendarSyncStatus } from "@/lib/google/calendar";
import { prisma } from "@/lib/prisma";
import { refreshPerformanceSnapshot } from "@/lib/planning/performance";
import { syncRoadmapTasksForVersion } from "@/lib/planning/task-sync";
import {
  answeredFollowUpsForAgent,
  ensureOpenAIConfigured,
  formatProfileForAgent,
  mergeNotes,
  parsePracticeTestJson,
  parsePerformanceSnapshot,
  stringifyPracticeTest,
  stringifyPracticeTestResult,
  stringifyRoadmap,
} from "@/lib/planning/helpers";
import {
  contextNotesSchema,
  followUpAnswerSchema,
  practiceTestAttemptSchema,
  practiceTestRequestSchema,
  resourceStatusSchema,
  roadmapEditPayloadSchema,
  taskStatusSchema,
} from "@/lib/planning/validation";

export type PlannerActionState = {
  error?: string;
  success?: string;
};

export type PracticeTestActionState = PlannerActionState & {
  scorePercent?: number;
  summary?: string;
};

async function revalidatePlanningPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/context");
  revalidatePath("/practice-tests");
  revalidatePath("/roadmap");
}

async function maybeRefreshPerformanceSnapshot(userId: string) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "test-key") {
    return;
  }

  try {
    await refreshPerformanceSnapshot(userId);
  } catch {
    // Keep UI mutations successful even if the insight refresh fails.
  }
}

async function requireSessionUserId() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session.userId;
}

async function requireUserForPlanning() {
  const userId = await requireSessionUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: true,
      learnerContext: true,
      followUpQuestions: {
        orderBy: {
          createdAt: "desc",
        },
      },
      roadmapVersions: {
        orderBy: {
          createdAt: "desc",
        },
      },
      calendarSync: true,
      googleCalendarToken: true,
      performanceSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const studentProfile = user.studentProfile;

  if (!studentProfile) {
    redirect("/profile");
  }

  return {
    ...user,
    studentProfile,
  };
}

async function requireActiveRoadmapWorkspace() {
  const user = await requireUserForPlanning();

  const activeRoadmap = await prisma.roadmapVersion.findFirst({
    where: {
      userId: user.id,
      isActive: true,
    },
    include: {
      tasks: {
        include: {
          resources: true,
        },
        orderBy: [{ milestoneIndex: "asc" }, { taskIndex: "asc" }],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    user,
    activeRoadmap,
  };
}

export async function analyzeLearnerContextAction(
  _previousState: PlannerActionState,
  formData: FormData,
): Promise<PlannerActionState> {
  try {
    ensureOpenAIConfigured();

    const user = await requireUserForPlanning();
    const parsed = contextNotesSchema.safeParse({
      extraNotes:
        typeof formData.get("extraNotes") === "string"
          ? formData.get("extraNotes")
          : "",
    });

    if (!parsed.success) {
      return { error: "Please add valid notes before continuing." };
    }

    const extraNotes = mergeNotes(
      user.learnerContext?.extraNotes,
      parsed.data.extraNotes ?? "",
    );

    const { followUp, normalizedContext } = await runStudentInfoPipeline({
      profile: formatProfileForAgent(user.studentProfile),
      extraNotes,
      answeredFollowUps: answeredFollowUpsForAgent(user.followUpQuestions),
      existingContext: user.learnerContext?.summary ?? null,
    });

    const context = await prisma.learnerContext.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: followUp.needsFollowUp
          ? LearnerContextStatus.NEEDS_FOLLOW_UP
          : LearnerContextStatus.READY,
        summary: normalizedContext.summary,
        intent: normalizedContext.intent,
        readiness: normalizedContext.profileCompleteness,
        confidenceLabel: normalizedContext.confidenceLabel,
        extraNotes,
        normalizedJson: JSON.stringify(normalizedContext),
        missingInfoSummary: normalizedContext.missingInformation.join(", "),
        skillGapsSummary: normalizedContext.inferredSkillGaps.join(", "),
        constraintsSummary: normalizedContext.inferredConstraints.join(", "),
      },
      update: {
        status: followUp.needsFollowUp
          ? LearnerContextStatus.NEEDS_FOLLOW_UP
          : LearnerContextStatus.READY,
        summary: normalizedContext.summary,
        intent: normalizedContext.intent,
        readiness: normalizedContext.profileCompleteness,
        confidenceLabel: normalizedContext.confidenceLabel,
        extraNotes,
        normalizedJson: JSON.stringify(normalizedContext),
        missingInfoSummary: normalizedContext.missingInformation.join(", "),
        skillGapsSummary: normalizedContext.inferredSkillGaps.join(", "),
        constraintsSummary: normalizedContext.inferredConstraints.join(", "),
      },
    });

    await prisma.followUpQuestion.updateMany({
      where: {
        userId: user.id,
        status: FollowUpStatus.OPEN,
      },
      data: {
        status: FollowUpStatus.DISMISSED,
      },
    });

    if (followUp.needsFollowUp && followUp.question) {
      await prisma.followUpQuestion.create({
        data: {
          userId: user.id,
          learnerContextId: context.id,
          question: followUp.question,
          rationale: followUp.rationale,
          status: FollowUpStatus.OPEN,
        },
      });
    }

    await revalidatePlanningPaths();

    return {
      success: followUp.needsFollowUp
        ? "The agent found one important follow-up question before planning."
        : "Your learner context is ready for roadmap generation.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "We could not analyze your learner context right now.",
    };
  }
}

export async function answerFollowUpAction(
  _previousState: PlannerActionState,
  formData: FormData,
): Promise<PlannerActionState> {
  try {
    ensureOpenAIConfigured();

    const user = await requireUserForPlanning();
    const parsed = followUpAnswerSchema.safeParse({
      followUpId:
        typeof formData.get("followUpId") === "string"
          ? formData.get("followUpId")
          : "",
      answer:
        typeof formData.get("answer") === "string"
          ? formData.get("answer")
          : "",
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid answer." };
    }

    await prisma.followUpQuestion.updateMany({
      where: {
        id: parsed.data.followUpId,
        userId: user.id,
        status: FollowUpStatus.OPEN,
      },
      data: {
        status: FollowUpStatus.ANSWERED,
        answer: parsed.data.answer,
        answeredAt: new Date(),
      },
    });

    const refreshedUser = await requireUserForPlanning();
    const extraNotes = refreshedUser.learnerContext?.extraNotes ?? "";

    const { followUp, normalizedContext } = await runStudentInfoPipeline({
      profile: formatProfileForAgent(refreshedUser.studentProfile),
      extraNotes,
      answeredFollowUps: answeredFollowUpsForAgent(refreshedUser.followUpQuestions),
      existingContext: refreshedUser.learnerContext?.summary ?? null,
    });

    const context = await prisma.learnerContext.upsert({
      where: { userId: refreshedUser.id },
      create: {
        userId: refreshedUser.id,
        status: followUp.needsFollowUp
          ? LearnerContextStatus.NEEDS_FOLLOW_UP
          : LearnerContextStatus.READY,
        summary: normalizedContext.summary,
        intent: normalizedContext.intent,
        readiness: normalizedContext.profileCompleteness,
        confidenceLabel: normalizedContext.confidenceLabel,
        extraNotes,
        normalizedJson: JSON.stringify(normalizedContext),
        missingInfoSummary: normalizedContext.missingInformation.join(", "),
        skillGapsSummary: normalizedContext.inferredSkillGaps.join(", "),
        constraintsSummary: normalizedContext.inferredConstraints.join(", "),
      },
      update: {
        status: followUp.needsFollowUp
          ? LearnerContextStatus.NEEDS_FOLLOW_UP
          : LearnerContextStatus.READY,
        summary: normalizedContext.summary,
        intent: normalizedContext.intent,
        readiness: normalizedContext.profileCompleteness,
        confidenceLabel: normalizedContext.confidenceLabel,
        extraNotes,
        normalizedJson: JSON.stringify(normalizedContext),
        missingInfoSummary: normalizedContext.missingInformation.join(", "),
        skillGapsSummary: normalizedContext.inferredSkillGaps.join(", "),
        constraintsSummary: normalizedContext.inferredConstraints.join(", "),
      },
    });

    await prisma.followUpQuestion.updateMany({
      where: {
        userId: refreshedUser.id,
        status: FollowUpStatus.OPEN,
      },
      data: {
        status: FollowUpStatus.DISMISSED,
      },
    });

    if (followUp.needsFollowUp && followUp.question) {
      await prisma.followUpQuestion.create({
        data: {
          userId: refreshedUser.id,
          learnerContextId: context.id,
          question: followUp.question,
          rationale: followUp.rationale,
          status: FollowUpStatus.OPEN,
        },
      });
    }

    await revalidatePlanningPaths();

    return {
      success: followUp.needsFollowUp
        ? "Answer saved. The agent asked one final follow-up."
        : "Answer saved. Your learner context is now ready.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "We could not save that follow-up answer.",
    };
  }
}

export async function generateRoadmapAction(
  _previousState: PlannerActionState,
  formData: FormData,
): Promise<PlannerActionState> {
  try {
    ensureOpenAIConfigured();

    const user = await requireUserForPlanning();
    const learnerContext = user.learnerContext;

    if (!learnerContext || learnerContext.status !== LearnerContextStatus.READY) {
      return {
        error:
          "Complete the learner context step before generating a roadmap.",
      };
    }

    const regenerationReasonValue = formData.get("regenerationReason");
    const regenerationReason =
      typeof regenerationReasonValue === "string" ? regenerationReasonValue : "";

    const currentRoadmap =
      user.roadmapVersions.find((item) => item.isActive) ?? null;

    const roadmap = await generateRoadmapFromContext({
      learnerContextJson: learnerContext.normalizedJson,
      currentRoadmapJson: currentRoadmap?.contentJson ?? null,
      regenerationReason,
    });

    const nextVersionNumber =
      (user.roadmapVersions[0]?.versionNumber ?? 0) + 1;

    await prisma.roadmapVersion.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    const roadmapVersion = await prisma.roadmapVersion.create({
      data: {
        userId: user.id,
        learnerContextId: learnerContext.id,
        versionNumber: nextVersionNumber,
        goal: roadmap.goal,
        summary: roadmap.summary,
        contentJson: stringifyRoadmap(roadmap),
        isActive: true,
        source: currentRoadmap
          ? RoadmapVersionSource.REGENERATED
          : RoadmapVersionSource.AGENT_GENERATED,
      },
    });

    await syncRoadmapTasksForVersion({
      userId: user.id,
      roadmapVersionId: roadmapVersion.id,
      roadmap,
    });

    await maybeRefreshPerformanceSnapshot(user.id);
    await revalidatePlanningPaths();

    return {
      success: currentRoadmap
        ? "A new roadmap version is ready."
        : "Your first roadmap is ready.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "We could not generate the roadmap right now.",
    };
  }
}

export async function saveRoadmapEditsAction(
  _previousState: PlannerActionState,
  formData: FormData,
): Promise<PlannerActionState> {
  try {
    const user = await requireUserForPlanning();
    const roadmapIdValue = formData.get("roadmapId");
    const contentJsonValue = formData.get("contentJson");
    const roadmapId = typeof roadmapIdValue === "string" ? roadmapIdValue : "";
    const contentJson =
      typeof contentJsonValue === "string" ? contentJsonValue : "";

    if (!roadmapId || !contentJson) {
      return { error: "Roadmap data is missing." };
    }

    const parsedRoadmap = roadmapEditPayloadSchema.safeParse(
      JSON.parse(contentJson),
    );

    if (!parsedRoadmap.success) {
      return { error: "The edited roadmap structure is invalid." };
    }

    await prisma.roadmapVersion.updateMany({
      where: {
        id: roadmapId,
        userId: user.id,
      },
      data: {
        goal: parsedRoadmap.data.goal,
        summary: parsedRoadmap.data.summary,
        contentJson: stringifyRoadmap(parsedRoadmap.data),
        source: RoadmapVersionSource.USER_EDITED,
      },
    });

    await syncRoadmapTasksForVersion({
      userId: user.id,
      roadmapVersionId: roadmapId,
      roadmap: parsedRoadmap.data,
    });

    await maybeRefreshPerformanceSnapshot(user.id);
    await revalidatePlanningPaths();

    return { success: "Roadmap edits saved." };
  } catch {
    return { error: "We could not save those roadmap edits." };
  }
}

export async function generatePracticeTestAction(
  _previousState: PlannerActionState,
  formData: FormData,
): Promise<PlannerActionState> {
  try {
    ensureOpenAIConfigured();

    const user = await requireUserForPlanning();

    if (!user.learnerContext || user.learnerContext.status !== LearnerContextStatus.READY) {
      return {
        error: "Finish learner context setup before generating practice tests.",
      };
    }

    const parsed = practiceTestRequestSchema.safeParse({
      focusArea:
        typeof formData.get("focusArea") === "string"
          ? formData.get("focusArea")
          : "",
      testFormat:
        typeof formData.get("testFormat") === "string"
          ? formData.get("testFormat")
          : "ADAPTIVE",
      targetLength:
        typeof formData.get("targetLength") === "string"
          ? formData.get("targetLength")
          : "STANDARD",
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Invalid practice test request.",
      };
    }

    const activeRoadmap = await prisma.roadmapVersion.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        tasks: {
          include: {
            resources: true,
          },
          orderBy: [{ milestoneIndex: "asc" }, { taskIndex: "asc" }],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const taskProgress = (activeRoadmap?.tasks ?? []).slice(0, 8).map((task) => ({
      milestoneTitle: task.milestoneTitle,
      title: task.title,
      details: task.details,
      status: task.status,
      priority: task.priority,
      dueWindow: task.dueWindow,
      resourceCount: task.resources.length,
      completedResources: task.resources.filter((resource) => resource.status === ResourceProgressStatus.COMPLETED).length,
    }));

    const latestInsight = parsePerformanceSnapshot(user.performanceSnapshots[0] ?? null);

    const practiceTest = await generatePracticeTest({
      learnerContextJson: user.learnerContext.normalizedJson,
      roadmapJson: activeRoadmap?.contentJson ?? null,
      taskProgressJson: JSON.stringify(taskProgress),
      performanceInsightJson: latestInsight ? JSON.stringify(latestInsight) : null,
      focusArea: parsed.data.focusArea,
      testFormat: parsed.data.testFormat,
      targetLength: parsed.data.targetLength,
    });

    await prisma.practiceTest.create({
      data: {
        userId: user.id,
        roadmapVersionId: activeRoadmap?.id ?? null,
        title: practiceTest.title,
        summary: practiceTest.summary,
        focusLabel: practiceTest.focusLabel,
        formatPreference: practiceTest.recommendedMode,
        estimatedTotalMinutes: practiceTest.estimatedTotalMinutes,
        contentJson: stringifyPracticeTest(practiceTest),
      },
    });

    await revalidatePlanningPaths();

    return {
      success: "A new practice test is ready.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "We could not generate a practice test right now.",
    };
  }
}

export async function submitPracticeTestAction(
  _previousState: PracticeTestActionState,
  formData: FormData,
): Promise<PracticeTestActionState> {
  try {
    ensureOpenAIConfigured();

    const user = await requireUserForPlanning();
    const parsed = practiceTestAttemptSchema.safeParse({
      practiceTestId:
        typeof formData.get("practiceTestId") === "string"
          ? formData.get("practiceTestId")
          : "",
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Invalid practice test submission.",
      };
    }

    if (!user.learnerContext || user.learnerContext.status !== LearnerContextStatus.READY) {
      return {
        error: "Finish learner context setup before submitting a practice test.",
      };
    }

    const practiceTest = await prisma.practiceTest.findFirst({
      where: {
        id: parsed.data.practiceTestId,
        userId: user.id,
      },
    });

    if (!practiceTest) {
      return { error: "Practice test not found." };
    }

    const parsedPracticeTest = parsePracticeTestJson(practiceTest.contentJson);
    const answers = parsedPracticeTest.questions.map((question) => ({
      questionId: question.id,
      answer:
        typeof formData.get(`answer_${question.id}`) === "string"
          ? String(formData.get(`answer_${question.id}`)).trim()
          : "",
    }));

    if (answers.every((item) => item.answer.length === 0)) {
      return { error: "Add at least one answer before submitting the test." };
    }

    const evaluation = await evaluatePracticeTest({
      learnerContextJson: user.learnerContext.normalizedJson,
      practiceTestJson: practiceTest.contentJson,
      answersJson: JSON.stringify(answers),
    });

    const earnedPoints = evaluation.results.reduce(
      (total, item) => total + item.score,
      0,
    );
    const totalPoints = evaluation.results.reduce(
      (total, item) => total + item.maxScore,
      0,
    );
    const scorePercent =
      totalPoints > 0 ? Number(((earnedPoints / totalPoints) * 100).toFixed(1)) : 0;

    await prisma.practiceTestAttempt.create({
      data: {
        userId: user.id,
        practiceTestId: practiceTest.id,
        answersJson: JSON.stringify(answers),
        resultJson: stringifyPracticeTestResult(evaluation),
        scorePercent,
        earnedPoints,
        totalPoints,
        summary: evaluation.summary,
      },
    });

    await maybeRefreshPerformanceSnapshot(user.id);
    await revalidatePlanningPaths();

    return {
      success: "Test submitted and evaluated.",
      scorePercent,
      summary: evaluation.summary,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "We could not evaluate that practice test right now.",
    };
  }
}

export async function findResourcesAction(
  _previousState: PlannerActionState,
): Promise<PlannerActionState> {
  void _previousState;

  try {
    ensureOpenAIConfigured();

    const { user, activeRoadmap } = await requireActiveRoadmapWorkspace();

    if (!user.learnerContext || user.learnerContext.status !== LearnerContextStatus.READY) {
      return { error: "Finish learner context setup before finding resources." };
    }

    if (!activeRoadmap) {
      return { error: "Generate a roadmap before curating resources." };
    }

    const tasksToCurate = activeRoadmap.tasks
      .filter((task) => task.status !== ProgressStatus.COMPLETED)
      .filter((task) => task.resources.length === 0)
      .slice(0, 6);

    if (!tasksToCurate.length) {
      return { success: "All active tasks already have curated resources." };
    }

    const resourceBatch = await curateTaskResources({
      learnerContextJson: user.learnerContext.normalizedJson,
      taskBatchJson: JSON.stringify(
        tasksToCurate.map((task) => ({
          taskId: task.id,
          milestoneTitle: task.milestoneTitle,
          title: task.title,
          details: task.details,
          estimatedTime: task.estimatedTime,
          dueWindow: task.dueWindow,
          priority: task.priority,
        })),
      ),
    });

    await prisma.$transaction(async (tx) => {
      for (const recommendation of resourceBatch.recommendations) {
        await tx.taskResource.deleteMany({
          where: {
            roadmapTaskId: recommendation.taskId,
            userId: user.id,
          },
        });

        await tx.taskResource.createMany({
          data: recommendation.resources.map((resource) => ({
            userId: user.id,
            roadmapTaskId: recommendation.taskId,
            title: resource.title,
            url: resource.url,
            type: resource.type,
            whyRelevant: resource.whyRelevant,
          })),
        });
      }
    });

    await revalidatePlanningPaths();

    return {
      success: resourceBatch.summary || "Curated resources are ready for your roadmap tasks.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "We could not find resources right now.",
    };
  }
}

export async function syncCalendarAction(
  _previousState: PlannerActionState,
): Promise<PlannerActionState> {
  void _previousState;

  try {
    ensureOpenAIConfigured();

    const { user, activeRoadmap } = await requireActiveRoadmapWorkspace();

    if (!user.learnerContext || user.learnerContext.status !== LearnerContextStatus.READY) {
      return { error: "Finish learner context setup before scheduling." };
    }

    if (!activeRoadmap) {
      return { error: "Generate a roadmap before syncing your calendar." };
    }

    if (!user.googleCalendarToken) {
      return { error: "Connect Google Calendar before syncing events." };
    }

    const schedulableTasks = activeRoadmap.tasks.filter(
      (task) => task.status !== ProgressStatus.COMPLETED,
    );

    if (!schedulableTasks.length) {
      return { success: "There are no incomplete tasks to schedule." };
    }

    const { timezone } = await getAuthorizedGoogleCalendar(user.id);

    const schedulePlan = await createSchedulePlan({
      learnerContextJson: user.learnerContext.normalizedJson,
      tasksJson: JSON.stringify(
        schedulableTasks.map((task) => ({
          taskId: task.id,
          milestoneTitle: task.milestoneTitle,
          title: task.title,
          details: task.details,
          estimatedTime: task.estimatedTime,
          dueWindow: task.dueWindow,
          priority: task.priority,
          currentSchedule: task.scheduledStart
            ? {
                startIso: task.scheduledStart.toISOString(),
                endIso: task.scheduledEnd?.toISOString() ?? null,
              }
            : null,
        })),
      ),
      timezone,
      nowIso: new Date().toISOString(),
    });

    for (const task of activeRoadmap.tasks) {
      if (task.calendarEventId) {
        try {
          await deleteManagedCalendarEvent(user.id, task.calendarEventId);
        } catch {
          // Best-effort cleanup before recreation.
        }
      }
    }

    const plannedByTaskId = new Map(
      schedulePlan.events.map((event) => [event.taskId, event]),
    );

    for (const task of activeRoadmap.tasks) {
      const scheduled = plannedByTaskId.get(task.id);

      if (!scheduled) {
        await prisma.roadmapTask.update({
          where: { id: task.id },
          data: {
            scheduledStart: null,
            scheduledEnd: null,
            calendarEventId: null,
            calendarStatus: CalendarEventStatus.NOT_SCHEDULED,
            syncError: null,
          },
        });
        continue;
      }

      try {
        const event = await createManagedCalendarEvent({
          userId: user.id,
          taskId: task.id,
          title: scheduled.title,
          details: `${task.details}\n\nScheduled by Pathly. ${scheduled.reason}`,
          startIso: scheduled.startIso,
          endIso: scheduled.endIso,
          timezone,
        });

        await prisma.roadmapTask.update({
          where: { id: task.id },
          data: {
            scheduledStart: new Date(scheduled.startIso),
            scheduledEnd: new Date(scheduled.endIso),
            calendarEventId: event.id ?? null,
            calendarStatus: CalendarEventStatus.SCHEDULED,
            syncError: null,
          },
        });
      } catch (error) {
        await prisma.roadmapTask.update({
          where: { id: task.id },
          data: {
            calendarStatus: CalendarEventStatus.SYNC_ERROR,
            syncError: error instanceof Error ? error.message : "Schedule sync failed.",
          },
        });
      }
    }

    await markCalendarSyncStatus({
      userId: user.id,
      isConnected: true,
      lastSyncedAt: new Date(),
      accessTokenExpiresAt: user.calendarSync?.accessTokenExpiresAt ?? null,
    });

    await revalidatePlanningPaths();

    return {
      success: schedulePlan.summary || "Calendar sync completed.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "We could not sync the calendar right now.",
    };
  }
}

export async function disconnectGoogleCalendarAction(): Promise<void> {
  const userId = await requireSessionUserId();

  await disconnectGoogleCalendar(userId);
  await prisma.roadmapTask.updateMany({
    where: { userId },
    data: {
      calendarEventId: null,
      scheduledStart: null,
      scheduledEnd: null,
      calendarStatus: CalendarEventStatus.NOT_SCHEDULED,
      syncError: null,
    },
  });

  await revalidatePlanningPaths();
}

export async function disconnectGoogleCalendarFormAction(
  _formData: FormData,
): Promise<void> {
  void _formData;
  await disconnectGoogleCalendarAction();
}

export async function updateTaskStatusAction(
  _previousState: PlannerActionState,
  formData: FormData,
): Promise<PlannerActionState> {
  try {
    const userId = await requireSessionUserId();
    const parsed = taskStatusSchema.safeParse({
      taskId: typeof formData.get("taskId") === "string" ? formData.get("taskId") : "",
      status: typeof formData.get("status") === "string" ? formData.get("status") : "NOT_STARTED",
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid task update." };
    }

    const task = await prisma.roadmapTask.findFirst({
      where: {
        id: parsed.data.taskId,
        userId,
      },
    });

    if (!task) {
      return { error: "Task not found." };
    }

    if (parsed.data.status === "COMPLETED" && task.calendarEventId) {
      try {
        await deleteManagedCalendarEvent(userId, task.calendarEventId);
      } catch {
        // Best effort.
      }
    }

    await prisma.roadmapTask.update({
      where: { id: task.id },
      data: {
        status: parsed.data.status,
        completedAt: parsed.data.status === "COMPLETED" ? new Date() : null,
        calendarEventId: parsed.data.status === "COMPLETED" ? null : task.calendarEventId,
        calendarStatus:
          parsed.data.status === "COMPLETED"
            ? CalendarEventStatus.NOT_SCHEDULED
            : task.calendarStatus,
      },
    });

    await maybeRefreshPerformanceSnapshot(userId);
    await revalidatePlanningPaths();

    return { success: "Task progress updated." };
  } catch {
    return { error: "We could not update that task right now." };
  }
}

export async function updateTaskStatusFormAction(formData: FormData): Promise<void> {
  await updateTaskStatusAction({}, formData);
}

export async function updateTaskResourceStatusAction(
  _previousState: PlannerActionState,
  formData: FormData,
): Promise<PlannerActionState> {
  try {
    const userId = await requireSessionUserId();
    const parsed = resourceStatusSchema.safeParse({
      resourceId:
        typeof formData.get("resourceId") === "string"
          ? formData.get("resourceId")
          : "",
      status:
        typeof formData.get("status") === "string"
          ? formData.get("status")
          : "SAVED",
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid resource update." };
    }

    await prisma.taskResource.updateMany({
      where: {
        id: parsed.data.resourceId,
        userId,
      },
      data: {
        status: parsed.data.status === "COMPLETED"
          ? ResourceProgressStatus.COMPLETED
          : ResourceProgressStatus.SAVED,
      },
    });

    await maybeRefreshPerformanceSnapshot(userId);
    await revalidatePlanningPaths();

    return { success: "Resource status updated." };
  } catch {
    return { error: "We could not update that resource right now." };
  }
}

export async function updateTaskResourceStatusFormAction(
  formData: FormData,
): Promise<void> {
  await updateTaskResourceStatusAction({}, formData);
}

export async function refreshPerformanceInsightsAction(
  _previousState: PlannerActionState,
): Promise<PlannerActionState> {
  void _previousState;

  try {
    ensureOpenAIConfigured();
    const userId = await requireSessionUserId();
    await refreshPerformanceSnapshot(userId);
    await revalidatePlanningPaths();
    return { success: "Performance insight refreshed." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "We could not refresh performance insights.",
    };
  }
}
