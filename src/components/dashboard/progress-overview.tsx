type ProgressOverviewProps = {
  completionRate: number;
  resourceCompletionRate: number;
  scheduledCount: number;
  latestInsight: {
    summary: string;
    onTrackStatus: string;
    updatedSkillEstimate: string;
    weakAreas: string[];
    suggestions: string[];
    recommendedFocus: string[];
  } | null;
};

export function ProgressOverview({
  completionRate,
  resourceCompletionRate,
  scheduledCount,
  latestInsight,
}: ProgressOverviewProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <article className="card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Progress analytics
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--muted)]">Task completion</p>
            <p className="mt-2 text-3xl font-extrabold">
              {Math.round(completionRate * 100)}%
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--muted)]">Resource completion</p>
            <p className="mt-2 text-3xl font-extrabold">
              {Math.round(resourceCompletionRate * 100)}%
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--muted)]">Scheduled tasks</p>
            <p className="mt-2 text-3xl font-extrabold">{scheduledCount}</p>
          </div>
        </div>
      </article>

      <article className="card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Performance insight
        </p>
        {latestInsight ? (
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-2xl font-extrabold">{latestInsight.onTrackStatus}</p>
              <p className="mt-2 text-[var(--muted)]">{latestInsight.summary}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Skill estimate</p>
                <p className="mt-2 font-semibold">{latestInsight.updatedSkillEstimate}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Weak areas</p>
                <p className="mt-2 font-semibold">
                  {latestInsight.weakAreas.join(", ") || "No strong signal yet"}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Suggested focus</p>
                <p className="mt-2 font-semibold">
                  {latestInsight.recommendedFocus.join(", ") || "Stay consistent"}
                </p>
              </div>
            </div>
            {latestInsight.suggestions.length ? (
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Roadmap suggestions</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {latestInsight.suggestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-5 text-sm text-[var(--muted)]">
            No performance insight yet. Generate a roadmap and update a few tasks to create a useful signal.
          </p>
        )}
      </article>
    </section>
  );
}
