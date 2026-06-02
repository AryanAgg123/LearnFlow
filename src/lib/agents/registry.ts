import { createStudentAgent } from "@/lib/agents/base-agent";
import {
  followUpDecisionSchema,
  learnerContextSchema,
  performanceInsightSchema,
  practiceTestSchema,
  resourceBatchSchema,
  roadmapSchema,
  schedulePlanSchema,
} from "@/lib/agents/schemas";

export const agentRegistry = {
  followUpStrategist: {
    name: "Follow-Up Strategist",
    outputType: followUpDecisionSchema,
  },
  learnerContextNormalizer: {
    name: "Learner Context Normalizer",
    outputType: learnerContextSchema,
  },
  roadmapCuration: {
    name: "Roadmap Curation Agent",
    outputType: roadmapSchema,
  },
  resourceFinding: {
    name: "Resource Finding Agent",
    outputType: resourceBatchSchema,
  },
  calendarScheduler: {
    name: "Calendar Scheduler Agent",
    outputType: schedulePlanSchema,
  },
  performanceTracking: {
    name: "Performance Tracking Agent",
    outputType: performanceInsightSchema,
  },
  practiceTestGeneration: {
    name: "Practice Test Agent",
    outputType: practiceTestSchema,
  },
  profileStrategist: createStudentAgent(
    "Profile Strategist",
    "Understand a student's context, goals, and constraints before planning begins.",
  ),
};
