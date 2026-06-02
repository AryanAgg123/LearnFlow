import { Agent, run } from "@openai/agents";
import { PLANNING_AGENT_MODEL } from "@/lib/agents/base-agent";
import {
  practiceTestEvaluationSchema,
  practiceTestSchema,
  type PracticeTestEvaluationOutput,
  type PracticeTestOutput,
} from "@/lib/agents/schemas";

const practiceTestAgent = new Agent({
  name: "Practice Test Agent",
  instructions: [
    "Create an adaptive practice test for a college student based on their current learning progress.",
    "Use learner context, roadmap progress, and recent performance to choose the right level and focus.",
    "Mix question styles when useful: quiz, short-answer, and coding tasks.",
    "If the student's current subject, roadmap, or weak areas point to coding practice such as DSA, include at least one realistic coding challenge.",
    "Keep the test practical, focused, and not overwhelming.",
    "Use clear language and write prompts that feel like a real prep session rather than textbook filler.",
    "For quiz questions, include 4 concise answer options.",
    "Every question must include a concise referenceAnswer for later evaluation.",
    "For coding questions, include evaluation criteria and starter code only when it genuinely helps.",
  ].join(" "),
  model: PLANNING_AGENT_MODEL,
  outputType: practiceTestSchema,
});

export async function generatePracticeTest(input: {
  learnerContextJson: string;
  roadmapJson?: string | null;
  taskProgressJson: string;
  performanceInsightJson?: string | null;
  focusArea?: string;
  testFormat: "ADAPTIVE" | "QUIZ" | "MIXED" | "CODING";
  targetLength: "SHORT" | "STANDARD" | "DEEP";
}) {
  const prompt = [
    `Preferred test format: ${input.testFormat}`,
    `Target length: ${input.targetLength}`,
    `Requested focus area: ${input.focusArea || "Use the most relevant current focus."}`,
    "",
    "Normalized learner context:",
    input.learnerContextJson,
    "",
    "Active roadmap:",
    input.roadmapJson || "No active roadmap yet.",
    "",
    "Current task progress:",
    input.taskProgressJson,
    "",
    "Latest performance insight:",
    input.performanceInsightJson || "No performance insight yet.",
    "",
    "Generate one high-value practice test that matches the student's present level and momentum.",
  ].join("\n");

  const result = await run(practiceTestAgent, prompt);
  return result.finalOutput as PracticeTestOutput;
}

const practiceTestEvaluationAgent = new Agent({
  name: "Practice Test Evaluation Agent",
  instructions: [
    "Evaluate a student's submitted answers for an adaptive practice test.",
    "Use the question prompt, reference answer, and evaluation criteria to score each response fairly.",
    "Accept alternate correct reasoning when it is valid, especially for coding and short-answer questions.",
    "Do not be overly strict about wording when the underlying concept is correct.",
    "Give concise, useful feedback and a model answer for each question.",
    "Use integer or half-point style scores where needed, but never exceed the max score.",
  ].join(" "),
  model: PLANNING_AGENT_MODEL,
  outputType: practiceTestEvaluationSchema,
});

export async function evaluatePracticeTest(input: {
  learnerContextJson: string;
  practiceTestJson: string;
  answersJson: string;
}) {
  const prompt = [
    "Normalized learner context:",
    input.learnerContextJson,
    "",
    "Practice test:",
    input.practiceTestJson,
    "",
    "Student submitted answers:",
    input.answersJson,
    "",
    "Evaluate the attempt and score every question.",
  ].join("\n");

  const result = await run(practiceTestEvaluationAgent, prompt);
  return result.finalOutput as PracticeTestEvaluationOutput;
}
