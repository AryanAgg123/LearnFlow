import type { FollowUpQuestion, LearnerContext } from "@prisma/client";
import { parseLearnerContextJson } from "@/lib/planning/helpers";

type LearnerContextPreviewProps = {
  learnerContext: LearnerContext | null;
  followUpHistory: FollowUpQuestion[];
};

export function LearnerContextPreview({
  learnerContext,
  followUpHistory,
}: LearnerContextPreviewProps) {
  const parsedContext = learnerContext
    ? parseLearnerContextJson(learnerContext.normalizedJson)
    : null;

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <article className="card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Normalized learner context
        </p>
        {parsedContext ? (
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">Summary</p>
              <p className="mt-2 text-lg leading-8">{parsedContext.summary}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Intent</p>
                <p className="mt-2 font-semibold">{parsedContext.intent}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Recommended pacing</p>
                <p className="mt-2 font-semibold">{parsedContext.recommendedPacing}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Study capacity</p>
                <p className="mt-2 font-semibold">{parsedContext.availableStudyCapacity}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Confidence</p>
                <p className="mt-2 font-semibold">{parsedContext.confidenceLabel}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-[var(--surface-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--muted)]">Skill gaps</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {parsedContext.inferredSkillGaps.length ? (
                    parsedContext.inferredSkillGaps.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>No major gaps inferred yet.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-3xl bg-[var(--surface-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--muted)]">Constraints</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {parsedContext.inferredConstraints.length ? (
                    parsedContext.inferredConstraints.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>No major constraints inferred yet.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-3xl bg-[var(--surface-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--muted)]">Missing info</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {parsedContext.missingInformation.length ? (
                    parsedContext.missingInformation.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>Enough information for roadmap planning.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[24px] bg-[var(--surface-soft)] p-5">
            <p className="font-semibold">No normalized context yet.</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Run the student info agent once your profile feels accurate.
            </p>
          </div>
        )}
      </article>

      <article className="card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Follow-up history
        </p>
        <div className="mt-5 space-y-4">
          {followUpHistory.length ? (
            followUpHistory.map((item) => (
              <div className="rounded-3xl border border-[var(--line)] bg-white/70 p-4" key={item.id}>
                <p className="font-semibold">{item.question}</p>
                {item.answer ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">Answer: {item.answer}</p>
                ) : (
                  <p className="mt-2 text-sm text-[var(--muted)]">Status: {item.status}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--muted)]">
              No follow-up questions yet.
            </p>
          )}
        </div>
      </article>
    </section>
  );
}
