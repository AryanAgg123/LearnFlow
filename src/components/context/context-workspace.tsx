"use client";

import { useActionState } from "react";
import type {
  FollowUpQuestion,
  LearnerContext,
  StudentProfile,
} from "@prisma/client";
import {
  analyzeLearnerContextAction,
  answerFollowUpAction,
  type PlannerActionState,
} from "@/lib/planning/actions";

const initialState: PlannerActionState = {};

type ContextWorkspaceProps = {
  profile: StudentProfile;
  learnerContext: LearnerContext | null;
  openFollowUp: FollowUpQuestion | null;
};

export function ContextWorkspace({
  profile,
  learnerContext,
  openFollowUp,
}: ContextWorkspaceProps) {
  const [analyzeState, analyzeAction, analyzing] = useActionState(
    analyzeLearnerContextAction,
    initialState,
  );
  const [answerState, answerAction, answering] = useActionState(
    answerFollowUpAction,
    initialState,
  );

  return (
    <div className="space-y-6">
      <section className="card p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="pill">Student info agent</div>
            <h1 className="mt-4 text-4xl font-extrabold">
              Turn your raw profile into planner-ready context.
            </h1>
            <p className="mt-3 text-[var(--muted)]">
              Add anything the basic form did not capture. The agent will ask only
              the single most useful follow-up question when it truly needs one.
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--surface-soft)] px-5 py-4">
            <p className="text-sm font-semibold text-[var(--muted)]">Status</p>
            <p className="mt-1 text-xl font-extrabold">
              {openFollowUp
                ? "Needs an answer"
                : learnerContext?.status === "READY"
                  ? "Ready"
                  : learnerContext
                    ? "In progress"
                    : "Not started"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            What the agent sees
          </p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">Current subject</p>
              <p className="mt-1 text-lg font-semibold">{profile.currentSubjectTopic}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">Target goal</p>
              <p className="mt-1 text-lg font-semibold">{profile.targetGoal}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">Skill level</p>
              <p className="mt-1 text-lg font-semibold">{profile.currentSkillLevel}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">Study time</p>
              <p className="mt-1 text-lg font-semibold">{profile.availableStudyTime}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">Learning style</p>
              <p className="mt-1 text-lg font-semibold">{profile.preferredLearningStyle}</p>
            </div>
          </div>
        </article>

        <article className="space-y-6">
          <div className="card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Extra notes
            </p>
            <form action={analyzeAction} className="mt-5 space-y-4">
              <textarea
                className="field min-h-40"
                name="extraNotes"
                defaultValue={learnerContext?.extraNotes ?? ""}
                placeholder="Add context like exam pressure, upcoming interviews, project deadlines, topics you keep getting stuck on, or what success looks like for you."
              />
              {analyzeState.error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {analyzeState.error}
                </p>
              ) : null}
              {analyzeState.success ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {analyzeState.success}
                </p>
              ) : null}
              <button className="btn btn-primary" disabled={analyzing} type="submit">
                {analyzing ? "Analyzing..." : "Analyze my setup"}
              </button>
            </form>
          </div>

          {openFollowUp ? (
            <div className="card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                One follow-up question
              </p>
              <h2 className="mt-4 text-2xl font-extrabold">{openFollowUp.question}</h2>
              {openFollowUp.rationale ? (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Why this matters: {openFollowUp.rationale}
                </p>
              ) : null}

              <form action={answerAction} className="mt-5 space-y-4">
                <input name="followUpId" type="hidden" value={openFollowUp.id} />
                <textarea
                  className="field min-h-32"
                  name="answer"
                  placeholder="Write a practical answer in your own words."
                  required
                />
                {answerState.error ? (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {answerState.error}
                  </p>
                ) : null}
                {answerState.success ? (
                  <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {answerState.success}
                  </p>
                ) : null}
                <button className="btn btn-primary" disabled={answering} type="submit">
                  {answering ? "Saving..." : "Submit answer"}
                </button>
              </form>
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
