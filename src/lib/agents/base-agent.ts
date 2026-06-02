import { Agent } from "@openai/agents";

const DEFAULT_AGENT_MODEL = process.env.OPENAI_AGENT_MODEL ?? "gpt-5-mini";

export const STUDENT_AGENT_MODEL =
  process.env.OPENAI_STUDENT_AGENT_MODEL ?? DEFAULT_AGENT_MODEL;
export const RESOURCE_AGENT_MODEL =
  process.env.OPENAI_RESOURCE_AGENT_MODEL ?? "gpt-5.4-mini";
export const PLANNING_AGENT_MODEL =
  process.env.OPENAI_PLANNING_AGENT_MODEL ?? DEFAULT_AGENT_MODEL;

export function createStudentAgent(name: string, instructions: string) {
  return new Agent({
    name,
    instructions,
    model: STUDENT_AGENT_MODEL,
  });
}
