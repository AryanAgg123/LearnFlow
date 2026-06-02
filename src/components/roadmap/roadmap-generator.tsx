"use client";

import { useActionState } from "react";
import type { LearnerContext, RoadmapVersion } from "@prisma/client";
import {
  generateRoadmapAction,
  type PlannerActionState,
} from "@/lib/planning/actions";
import { parseLearnerContextJson } from "@/lib/planning/helpers";

const initialState: PlannerActionState = {};

type RoadmapGeneratorProps = {
  learnerContext: LearnerContext | null;
  activeRoadmap: RoadmapVersion | null;
};

export function RoadmapGenerator({
  learnerContext,
  activeRoadmap,
}: RoadmapGeneratorProps) {
  const [state, formAction, pending] = useActionState(
    generateRoadmapAction,
    initialState,
  );

  const parsedContext = learnerContext
    ? parseLearnerContextJson(learnerContext.normalizedJson)
    : null;
  const canGenerate = learnerContext?.status === "READY";

  return (
    <section className="card p-6 md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="pill">Roadmap agent</div>
          <h1 className="mt-4 text-4xl font-extrabold">
            Generate a roadmap that feels realistic, not robotic.
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            The roadmap agent uses your normalized learner context to create a
            pacing-aware plan with milestones and tasks you can actually work through.
          </p>
        </div>
        <div className="rounded-3xl bg-[var(--surface-soft)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--muted)]">Current status</p>
          <p className="mt-1 text-xl font-extrabold">
            {activeRoadmap ? `Version ${activeRoadmap.versionNumber}` : "Not generated"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[28px] border border-[var(--line)] bg-white/65 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Planning inputs
          </p>
          {parsedContext ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Goal</p>
                <p className="mt-1 font-semibold">{parsedContext.primaryGoal}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Pacing</p>
                <p className="mt-1 font-semibold">{parsedContext.recommendedPacing}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Skill level</p>
                <p className="mt-1 font-semibold">{parsedContext.skillLevel}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Study capacity</p>
                <p className="mt-1 font-semibold">{parsedContext.availableStudyCapacity}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Finish the learner context step first.
            </p>
          )}
        </div>

        <form action={formAction} className="space-y-4">
          <label className="label" htmlFor="regenerationReason">
            Regeneration note
          </label>
          <textarea
            className="field min-h-32"
            id="regenerationReason"
            name="regenerationReason"
            placeholder="Optional: ask for a lighter pace, more interview prep, shorter tasks, or stronger focus on weak areas."
          />
          {state.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {state.success}
            </p>
          ) : null}
          <button
            className="btn btn-primary"
            disabled={pending || !canGenerate}
            type="submit"
          >
            {pending
              ? "Generating..."
              : activeRoadmap
                ? "Regenerate roadmap"
                : "Generate roadmap"}
          </button>
        </form>
      </div>
    </section>
  );
}
