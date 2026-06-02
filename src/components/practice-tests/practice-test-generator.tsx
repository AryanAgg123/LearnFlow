"use client";

import { useActionState } from "react";
import type { LearnerContext, PracticeTest, RoadmapVersion } from "@prisma/client";
import {
  generatePracticeTestAction,
  type PlannerActionState,
} from "@/lib/planning/actions";

const initialState: PlannerActionState = {};

type PracticeTestGeneratorProps = {
  learnerContext: LearnerContext | null;
  activeRoadmap: RoadmapVersion | null;
  latestPracticeTest: PracticeTest | null;
};

export function PracticeTestGenerator({
  learnerContext,
  activeRoadmap,
  latestPracticeTest,
}: PracticeTestGeneratorProps) {
  const [state, formAction, pending] = useActionState(
    generatePracticeTestAction,
    initialState,
  );

  const canGenerate = learnerContext?.status === "READY";

  return (
    <section className="card p-6 md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="pill">Practice test agent</div>
          <h1 className="mt-4 text-4xl font-extrabold">
            Generate a test that matches where you are right now.
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            The agent uses your learner context, roadmap progress, and latest
            performance signals to build a focused quiz, coding set, or mixed test.
          </p>
        </div>
        <div className="rounded-3xl bg-[var(--surface-soft)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--muted)]">Latest test</p>
          <p className="mt-1 text-xl font-extrabold">
            {latestPracticeTest ? latestPracticeTest.title : "Not generated"}
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <div>
          <label className="label" htmlFor="focusArea">
            Focus area
          </label>
          <input
            className="field"
            id="focusArea"
            name="focusArea"
            placeholder="Optional: recursion, arrays, dynamic programming, OS concepts, SQL joins..."
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="testFormat">
              Format
            </label>
            <select className="field" defaultValue="ADAPTIVE" id="testFormat" name="testFormat">
              <option value="ADAPTIVE">Adaptive</option>
              <option value="QUIZ">Quiz only</option>
              <option value="MIXED">Mixed</option>
              <option value="CODING">Coding-focused</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="targetLength">
              Length
            </label>
            <select className="field" defaultValue="STANDARD" id="targetLength" name="targetLength">
              <option value="SHORT">Short</option>
              <option value="STANDARD">Standard</option>
              <option value="DEEP">Deep</option>
            </select>
          </div>
        </div>

        <button
          className="btn btn-primary h-fit"
          disabled={pending || !canGenerate}
          type="submit"
        >
          {pending ? "Generating..." : "Generate test"}
        </button>
      </form>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[var(--line)] bg-white/65 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Input status
          </p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {canGenerate
              ? activeRoadmap
                ? "Learner context and roadmap are ready. The test can adapt to live progress."
                : "Learner context is ready. The test will use profile and recent insight even without a roadmap."
              : "Complete learner context first so the generated test feels personalized."}
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--line)] bg-white/65 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            What gets generated
          </p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            A compact assessment with realistic prompts, quiz questions, and coding
            tasks when they make sense for the subject and progress level.
          </p>
        </div>
      </div>

      {state.error ? (
        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}
    </section>
  );
}
