import { Agent, run } from "@openai/agents";
import { STUDENT_AGENT_MODEL } from "@/lib/agents/base-agent";
import { roadmapSchema, type RoadmapOutput } from "@/lib/agents/schemas";

const roadmapCurationAgent = new Agent({
  name: "Roadmap Curation Agent",
  instructions: [
    "Create a personalized learning roadmap for a college student.",
    "Use the learner context to set realistic pacing, difficulty, and milestones.",
    "Break the goal into milestones with actionable tasks.",
    "Keep the roadmap ambitious but realistic for a student balancing multiple responsibilities.",
    "Do not overcomplicate the structure.",
  ].join(" "),
  model: STUDENT_AGENT_MODEL,
  outputType: roadmapSchema,
});

export async function generateRoadmapFromContext(input: {
  learnerContextJson: string;
  currentRoadmapJson?: string | null;
  regenerationReason?: string;
}) {
  const prompt = [
    "Normalized learner context:",
    input.learnerContextJson,
    "",
    "Current roadmap version:",
    input.currentRoadmapJson || "None yet.",
    "",
    "Regeneration reason:",
    input.regenerationReason || "Generate the best first roadmap.",
  ].join("\n");

  const result = await run(roadmapCurationAgent, prompt);
  return result.finalOutput as RoadmapOutput;
}
