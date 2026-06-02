import { Agent, run } from "@openai/agents";
import { PLANNING_AGENT_MODEL } from "@/lib/agents/base-agent";
import {
  performanceInsightSchema,
  type PerformanceInsightOutput,
} from "@/lib/agents/schemas";

const performanceTrackingAgent = new Agent({
  name: "Performance Tracking Agent",
  instructions: [
    "Review planned versus actual student progress.",
    "Update the learner's skill estimate based on completion behavior, consistency, and resource usage.",
    "Flag weak areas, suggest roadmap refinements, and recommend where more support is needed.",
    "Keep insights concise, practical, and motivational rather than overly analytical.",
  ].join(" "),
  model: PLANNING_AGENT_MODEL,
  outputType: performanceInsightSchema,
});

export async function evaluatePerformance(input: {
  learnerContextJson: string;
  roadmapJson: string;
  taskProgressJson: string;
  existingInsightJson?: string | null;
}) {
  const prompt = [
    "Normalized learner context:",
    input.learnerContextJson,
    "",
    "Active roadmap:",
    input.roadmapJson,
    "",
    "Task and resource progress:",
    input.taskProgressJson,
    "",
    "Existing performance insight:",
    input.existingInsightJson || "None yet.",
  ].join("\n");

  const result = await run(performanceTrackingAgent, prompt);
  return result.finalOutput as PerformanceInsightOutput;
}
