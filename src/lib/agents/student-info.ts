import { Agent, run } from "@openai/agents";
import { STUDENT_AGENT_MODEL } from "@/lib/agents/base-agent";
import {
  followUpDecisionSchema,
  learnerContextSchema,
  type FollowUpDecision,
  type LearnerContextOutput,
} from "@/lib/agents/schemas";

type StudentInfoInput = {
  profile: {
    currentSubjectTopic: string;
    targetGoal: string;
    currentSkillLevel: string;
    deadline: string | null;
    availableStudyTime: string;
    preferredLearningStyle: string;
    constraints: string | null;
    weakAreas: string | null;
  };
  extraNotes: string;
  answeredFollowUps: Array<{
    question: string;
    answer: string;
  }>;
  existingContext?: string | null;
};

const followUpStrategistAgent = new Agent({
  name: "Follow-Up Strategist",
  instructions: [
    "You review a student's profile, notes, and answered follow-up questions.",
    "Ask at most one follow-up question, and only if the answer would materially improve personalization or roadmap quality.",
    "Do not ask broad or repetitive questions.",
    "If the current information is enough to plan responsibly, set needsFollowUp to false.",
    "Keep the question concise, practical, and easy for a college student to answer.",
  ].join(" "),
  model: STUDENT_AGENT_MODEL,
  outputType: followUpDecisionSchema,
});

const learnerContextNormalizerAgent = new Agent({
  name: "Learner Context Normalizer",
  instructions: [
    "Convert messy student profile information into a structured learner context for downstream planning agents.",
    "Infer intent, likely skill gaps, pacing, and constraints from the student's full context.",
    "Do not hallucinate precise facts; infer carefully and express uncertainty through confidenceLabel and missingInformation.",
    "Keep the output practical for learning-roadmap generation.",
  ].join(" "),
  model: STUDENT_AGENT_MODEL,
  outputType: learnerContextSchema,
});

function buildStudentInfoPrompt(input: StudentInfoInput) {
  return [
    "Student profile:",
    JSON.stringify(input.profile, null, 2),
    "",
    "Extra notes:",
    input.extraNotes || "None provided.",
    "",
    "Answered follow-up questions:",
    input.answeredFollowUps.length
      ? JSON.stringify(input.answeredFollowUps, null, 2)
      : "None yet.",
    "",
    "Existing normalized context summary:",
    input.existingContext || "None yet.",
  ].join("\n");
}

export async function runStudentInfoPipeline(input: StudentInfoInput) {
  const prompt = buildStudentInfoPrompt(input);

  const followUpResult = await run(followUpStrategistAgent, prompt);
  const followUp = followUpResult.finalOutput as FollowUpDecision;

  const normalizationResult = await run(
    learnerContextNormalizerAgent,
    [
      prompt,
      "",
      "Use all available information to normalize the learner context.",
      "If information is still missing, keep the missingInformation list honest rather than inventing details.",
      "The current follow-up recommendation is:",
      JSON.stringify(followUp, null, 2),
    ].join("\n"),
  );

  const normalizedContext =
    normalizationResult.finalOutput as LearnerContextOutput;

  return {
    followUp,
    normalizedContext,
  };
}
