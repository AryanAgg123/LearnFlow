import { Agent, run } from "@openai/agents";
import { PLANNING_AGENT_MODEL } from "@/lib/agents/base-agent";
import {
  schedulePlanSchema,
  type SchedulePlanOutput,
} from "@/lib/agents/schemas";

const schedulerAgent = new Agent({
  name: "Calendar Scheduler Agent",
  instructions: [
    "Turn roadmap tasks into a practical calendar schedule for a college student.",
    "Respect the learner context, available study time, due windows, and current date.",
    "Keep the schedule understandable and realistic.",
    "Prefer one focused calendar block per task rather than complicated splitting.",
    "Output ISO timestamps for events.",
  ].join(" "),
  model: PLANNING_AGENT_MODEL,
  outputType: schedulePlanSchema,
});

export async function createSchedulePlan(input: {
  learnerContextJson: string;
  tasksJson: string;
  timezone: string;
  nowIso: string;
}) {
  const prompt = [
    `Current time: ${input.nowIso}`,
    `Calendar timezone: ${input.timezone}`,
    "",
    "Normalized learner context:",
    input.learnerContextJson,
    "",
    "Tasks to schedule:",
    input.tasksJson,
    "",
    "Schedule these tasks into clear calendar events.",
  ].join("\n");

  const result = await run(schedulerAgent, prompt);
  return result.finalOutput as SchedulePlanOutput;
}
