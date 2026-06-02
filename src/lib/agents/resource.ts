import { Agent, run, webSearchTool } from "@openai/agents";
import { RESOURCE_AGENT_MODEL } from "@/lib/agents/base-agent";
import {
  resourceBatchSchema,
  type ResourceBatchOutput,
} from "@/lib/agents/schemas";

const resourceFindingAgent = new Agent({
  name: "Resource Finding Agent",
  instructions: [
    "Find a small curated set of learning resources for roadmap tasks.",
    "Prefer trustworthy, high-signal resources over generic listicles.",
    "Use built-in web search when current information or direct links are needed.",
    "Return at most three resources per task and explain why each one fits.",
    "Avoid overwhelming the student with too many options.",
    "Every resource URL must be a direct absolute http or https link.",
  ].join(" "),
  model: RESOURCE_AGENT_MODEL,
  tools: [webSearchTool()],
  outputType: resourceBatchSchema,
});

export async function curateTaskResources(input: {
  learnerContextJson: string;
  taskBatchJson: string;
}) {
  const prompt = [
    "Normalized learner context:",
    input.learnerContextJson,
    "",
    "Roadmap tasks that need curated resources:",
    input.taskBatchJson,
    "",
    "Use web search when it helps you get relevant, current, high-quality resources.",
    "Return direct absolute http or https URLs for every resource.",
  ].join("\n");

  const result = await run(resourceFindingAgent, prompt);
  return result.finalOutput as ResourceBatchOutput;
}
