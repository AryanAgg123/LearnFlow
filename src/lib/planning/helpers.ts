import type {
  FollowUpQuestion,
  LearnerContext,
  PerformanceSnapshot,
  PracticeTest,
  PracticeTestAttempt,
  RoadmapVersion,
  StudentProfile,
} from "@prisma/client";
import {
  learnerContextSchema,
  practiceTestEvaluationSchema,
  practiceTestSchema,
  roadmapSchema,
  type LearnerContextOutput,
  type PracticeTestEvaluationOutput,
  type PracticeTestOutput,
  type RoadmapOutput,
} from "@/lib/agents/schemas";

export function ensureOpenAIConfigured() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "test-key") {
    throw new Error(
      "Add a real OPENAI_API_KEY in .env before using the agent workflows.",
    );
  }
}

export function formatProfileForAgent(profile: StudentProfile) {
  return {
    currentSubjectTopic: profile.currentSubjectTopic,
    targetGoal: profile.targetGoal,
    currentSkillLevel: profile.currentSkillLevel,
    deadline: profile.deadline ? profile.deadline.toISOString() : null,
    availableStudyTime: profile.availableStudyTime,
    preferredLearningStyle: profile.preferredLearningStyle,
    constraints: profile.constraints,
    weakAreas: profile.weakAreas,
  };
}

export function answeredFollowUpsForAgent(
  followUps: Array<Pick<FollowUpQuestion, "question" | "answer" | "status">>,
) {
  return followUps
    .filter((item) => item.status === "ANSWERED" && item.answer)
    .map((item) => ({
      question: item.question,
      answer: item.answer ?? "",
    }));
}

export function mergeNotes(existingNotes?: string | null, nextNotes?: string) {
  const existing = existingNotes?.trim();
  const incoming = nextNotes?.trim();

  if (!existing && !incoming) {
    return "";
  }

  if (!existing) {
    return incoming ?? "";
  }

  if (!incoming) {
    return existing;
  }

  if (existing.includes(incoming)) {
    return existing;
  }

  return `${existing}\n\n${incoming}`;
}

export function parseLearnerContextJson(normalizedJson: string) {
  return learnerContextSchema.parse(JSON.parse(normalizedJson));
}

export function parseRoadmapJson(contentJson: string) {
  return roadmapSchema.parse(JSON.parse(contentJson));
}

export function stringifyLearnerContext(context: LearnerContextOutput) {
  return JSON.stringify(context);
}

export function stringifyRoadmap(roadmap: RoadmapOutput) {
  return JSON.stringify(roadmap);
}

export function parsePracticeTestJson(contentJson: string) {
  return practiceTestSchema.parse(JSON.parse(contentJson));
}

export function stringifyPracticeTest(practiceTest: PracticeTestOutput) {
  return JSON.stringify(practiceTest);
}

export function activeRoadmapSummary(roadmap: RoadmapVersion | null) {
  if (!roadmap) {
    return null;
  }

  return parseRoadmapJson(roadmap.contentJson);
}

export function latestPracticeTestSummary(practiceTest: PracticeTest | null) {
  if (!practiceTest) {
    return null;
  }

  return parsePracticeTestJson(practiceTest.contentJson);
}

export function parsePracticeTestResultJson(resultJson: string) {
  return practiceTestEvaluationSchema.parse(JSON.parse(resultJson));
}

export function latestPracticeTestAttemptSummary(
  practiceTestAttempt: PracticeTestAttempt | null,
) {
  if (!practiceTestAttempt) {
    return null;
  }

  return {
    scorePercent: practiceTestAttempt.scorePercent,
    earnedPoints: practiceTestAttempt.earnedPoints,
    totalPoints: practiceTestAttempt.totalPoints,
    summary: practiceTestAttempt.summary,
    result: parsePracticeTestResultJson(practiceTestAttempt.resultJson),
  };
}

export function stringifyPracticeTestResult(
  practiceTestResult: PracticeTestEvaluationOutput,
) {
  return JSON.stringify(practiceTestResult);
}

export function contextStatusLabel(
  context: LearnerContext | null,
  openFollowUp: FollowUpQuestion | null,
) {
  if (openFollowUp) {
    return "Needs follow-up";
  }

  if (context?.status === "READY") {
    return "Ready";
  }

  if (context) {
    return "In progress";
  }

  return "Not started";
}

export function parseStringArrayJson(value: string) {
  return JSON.parse(value) as string[];
}

export function parsePerformanceSnapshot(snapshot: PerformanceSnapshot | null) {
  if (!snapshot) {
    return null;
  }

  return {
    summary: snapshot.summary,
    onTrackStatus: snapshot.onTrackStatus,
    completionRate: snapshot.completionRate,
    resourceCompletionRate: snapshot.resourceCompletionRate,
    updatedSkillEstimate: snapshot.updatedSkillEstimate,
    weakAreas: parseStringArrayJson(snapshot.weakAreasJson),
    suggestions: parseStringArrayJson(snapshot.suggestionsJson),
    recommendedFocus: parseStringArrayJson(snapshot.recommendedFocusJson),
  };
}
