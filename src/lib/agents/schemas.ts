import { z } from "zod";

export const followUpDecisionSchema = z.object({
  needsFollowUp: z.boolean(),
  question: z.string().nullable(),
  rationale: z.string().nullable(),
  focusAreas: z.array(z.string()).default([]),
  shortAssessment: z.string(),
});

export const learnerContextSchema = z.object({
  profileCompleteness: z.enum(["partial", "sufficient", "strong"]),
  summary: z.string(),
  intent: z.string(),
  primaryGoal: z.string(),
  skillLevel: z.string(),
  confidenceLabel: z.enum(["low", "medium", "high"]),
  currentFocus: z.string(),
  inferredSkillGaps: z.array(z.string()).default([]),
  inferredConstraints: z.array(z.string()).default([]),
  motivations: z.array(z.string()).default([]),
  availableStudyCapacity: z.string(),
  preferredLearningStyle: z.string(),
  recommendedPacing: z.string(),
  missingInformation: z.array(z.string()).default([]),
  nextBestAction: z.string(),
});

export const roadmapTaskSchema = z.object({
  title: z.string(),
  details: z.string(),
  estimatedTime: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  dueWindow: z.string(),
});

export const roadmapMilestoneSchema = z.object({
  title: z.string(),
  outcome: z.string(),
  estimatedTime: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  dueWindow: z.string(),
  tasks: z.array(roadmapTaskSchema).min(1),
});

export const roadmapSchema = z.object({
  goal: z.string(),
  summary: z.string(),
  milestones: z.array(roadmapMilestoneSchema).min(1),
});

export const resourceRecommendationSchema = z.object({
  taskId: z.string(),
  resources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().min(1),
        type: z.enum(["ARTICLE", "VIDEO", "COURSE", "NOTE", "TOOL"]),
        whyRelevant: z.string(),
      }),
    )
    .min(1)
    .max(3),
});

export const resourceBatchSchema = z.object({
  summary: z.string(),
  recommendations: z.array(resourceRecommendationSchema),
});

export const scheduleItemSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  startIso: z.string(),
  endIso: z.string(),
  reason: z.string(),
});

export const schedulePlanSchema = z.object({
  summary: z.string(),
  events: z.array(scheduleItemSchema),
});

export const performanceInsightSchema = z.object({
  summary: z.string(),
  onTrackStatus: z.string(),
  updatedSkillEstimate: z.string(),
  weakAreas: z.array(z.string()).default([]),
  roadmapAdjustmentSuggestions: z.array(z.string()).default([]),
  recommendedResourceFocus: z.array(z.string()).default([]),
  nextAction: z.string(),
});

export const practiceTestQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["QUIZ", "SHORT_ANSWER", "CODING"]),
  title: z.string(),
  prompt: z.string(),
  skillFocus: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimatedMinutes: z.number().int().min(1).max(180),
  options: z.array(z.string()).default([]),
  answerGuidance: z.string(),
  referenceAnswer: z.string().optional().default(""),
  starterCode: z.string().nullable().default(null),
  evaluationCriteria: z.array(z.string()).default([]),
});

export const practiceTestSchema = z.object({
  title: z.string(),
  summary: z.string(),
  focusLabel: z.string(),
  recommendedMode: z.enum(["ADAPTIVE", "QUIZ", "MIXED", "CODING"]),
  estimatedTotalMinutes: z.number().int().min(5).max(300),
  instructions: z.string(),
  questions: z.array(practiceTestQuestionSchema).min(3).max(10),
});

export const practiceTestAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
});

export const practiceTestEvaluationQuestionSchema = z.object({
  questionId: z.string(),
  score: z.number().min(0),
  maxScore: z.number().positive(),
  verdict: z.enum(["correct", "partial", "incorrect"]),
  feedback: z.string(),
  modelAnswer: z.string(),
});

export const practiceTestEvaluationSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()).default([]),
  weakAreas: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).default([]),
  results: z.array(practiceTestEvaluationQuestionSchema).min(1),
});

export type FollowUpDecision = z.infer<typeof followUpDecisionSchema>;
export type LearnerContextOutput = z.infer<typeof learnerContextSchema>;
export type RoadmapOutput = z.infer<typeof roadmapSchema>;
export type ResourceBatchOutput = z.infer<typeof resourceBatchSchema>;
export type SchedulePlanOutput = z.infer<typeof schedulePlanSchema>;
export type PerformanceInsightOutput = z.infer<typeof performanceInsightSchema>;
export type PracticeTestOutput = z.infer<typeof practiceTestSchema>;
export type PracticeTestAnswerInput = z.infer<typeof practiceTestAnswerSchema>;
export type PracticeTestEvaluationOutput = z.infer<typeof practiceTestEvaluationSchema>;
