"use client";

import { useActionState } from "react";
import type { PracticeTest, PracticeTestAttempt } from "@prisma/client";
import {
  latestPracticeTestAttemptSummary,
  parsePracticeTestJson,
} from "@/lib/planning/helpers";
import {
  submitPracticeTestAction,
  type PracticeTestActionState,
} from "@/lib/planning/actions";

const initialState: PracticeTestActionState = {};

type PracticeTestViewerProps = {
  practiceTest: PracticeTest;
  latestAttempt: PracticeTestAttempt | null;
};

export function PracticeTestViewer({
  practiceTest,
  latestAttempt,
}: PracticeTestViewerProps) {
  const parsed = parsePracticeTestJson(practiceTest.contentJson);
  const [state, formAction, pending] = useActionState(
    submitPracticeTestAction,
    initialState,
  );
  const result = latestPracticeTestAttemptSummary(latestAttempt);

  return (
    <section className="card p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <div className="pill">Generated test</div>
          <h2 className="mt-4 text-3xl font-extrabold">{parsed.title}</h2>
          <p className="mt-3 text-[var(--muted)]">{parsed.summary}</p>
        </div>
        <div className="grid gap-3 text-sm md:text-right">
          <p className="font-semibold text-[var(--muted)]">
            {parsed.recommendedMode} test
          </p>
          <p className="font-semibold text-[var(--muted)]">
            {parsed.estimatedTotalMinutes} min
          </p>
          <p className="font-semibold text-[var(--muted)]">{parsed.focusLabel}</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-[var(--surface-soft)] p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Instructions
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">{parsed.instructions}</p>
      </div>

      <form action={formAction} className="mt-8 space-y-4">
        <input name="practiceTestId" type="hidden" value={practiceTest.id} />

        {parsed.questions.map((question, index) => (
          <article
            className="rounded-3xl border border-[var(--line)] bg-white/70 p-5"
            key={question.id}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Question {index + 1} - {question.type.replaceAll("_", " ")}
                </p>
                <h3 className="mt-2 text-xl font-bold">{question.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-[var(--muted)]">
                <span className="rounded-full bg-[var(--surface-soft)] px-3 py-2">
                  {question.skillFocus}
                </span>
                <span className="rounded-full bg-[var(--surface-soft)] px-3 py-2">
                  {question.difficulty}
                </span>
                <span className="rounded-full bg-[var(--surface-soft)] px-3 py-2">
                  {question.estimatedMinutes} min
                </span>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--muted)]">
              {question.prompt}
            </p>

            {question.options.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm"
                    key={`${question.id}-${optionIndex}`}
                  >
                    <input
                      name={`answer_${question.id}`}
                      type="radio"
                      value={option}
                    />
                    <span>
                      {String.fromCharCode(65 + optionIndex)}. {option}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="field mt-4 min-h-36"
                name={`answer_${question.id}`}
                placeholder={
                  question.type === "CODING"
                    ? "Write your solution, explain your approach, or paste code here."
                    : "Write your answer here."
                }
              />
            )}

            {question.starterCode ? (
              <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
                <pre className="whitespace-pre-wrap font-mono">{question.starterCode}</pre>
              </div>
            ) : null}
          </article>
        ))}

        {state.error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <p className="font-semibold">{state.success}</p>
            {typeof state.scorePercent === "number" ? (
              <p className="mt-1">Latest score: {state.scorePercent}%</p>
            ) : null}
            {state.summary ? <p className="mt-1">{state.summary}</p> : null}
          </div>
        ) : null}

        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Evaluating..." : "Submit answers and score test"}
        </button>
      </form>

      {result ? (
        <section className="mt-8 rounded-3xl border border-[var(--line)] bg-white/70 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Latest result
              </p>
              <h3 className="mt-2 text-3xl font-extrabold">
                {result.scorePercent}% score
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{result.summary}</p>
            </div>
            <div className="text-sm font-semibold text-[var(--muted)]">
              {result.earnedPoints}/{result.totalPoints} points
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--muted)]">Strengths</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {result.result.strengths.map((item, index) => (
                  <li key={`strength-${index}`}>- {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--muted)]">Weak areas</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {result.result.weakAreas.map((item, index) => (
                  <li key={`weak-${index}`}>- {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--muted)]">Next steps</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {result.result.nextSteps.map((item, index) => (
                  <li key={`next-${index}`}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {parsed.questions.map((question, index) => {
              const questionResult = result.result.results.find(
                (item) => item.questionId === question.id,
              );

              if (!questionResult) {
                return null;
              }

              return (
                <article
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4"
                  key={`result-${question.id}`}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Question {index + 1}
                      </p>
                      <p className="mt-2 font-bold">{question.title}</p>
                    </div>
                    <div className="text-sm font-semibold text-[var(--muted)]">
                      {questionResult.score}/{questionResult.maxScore} - {questionResult.verdict}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    {questionResult.feedback}
                  </p>
                  <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white/80 p-4">
                    <p className="text-sm font-semibold text-[var(--muted)]">
                      Model answer
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)]">
                      {questionResult.modelAnswer}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </section>
  );
}
