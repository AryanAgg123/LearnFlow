"use client";

import { useActionState, useMemo, useState } from "react";
import type { RoadmapVersion } from "@prisma/client";
import type { RoadmapOutput } from "@/lib/agents/schemas";
import {
  saveRoadmapEditsAction,
  type PlannerActionState,
} from "@/lib/planning/actions";

const initialState: PlannerActionState = {};

type RoadmapEditorProps = {
  roadmapVersion: RoadmapVersion;
  roadmap: RoadmapOutput;
};

export function RoadmapEditor({
  roadmapVersion,
  roadmap,
}: RoadmapEditorProps) {
  const [draft, setDraft] = useState<RoadmapOutput>(roadmap);
  const [state, formAction, pending] = useActionState(
    saveRoadmapEditsAction,
    initialState,
  );

  const serializedDraft = useMemo(() => JSON.stringify(draft), [draft]);

  return (
    <section className="space-y-6">
      <div className="card p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="pill">Editable roadmap</div>
            <h2 className="mt-4 text-3xl font-extrabold">{draft.goal}</h2>
            <p className="mt-3 max-w-3xl text-[var(--muted)]">{draft.summary}</p>
          </div>
          <div className="rounded-3xl bg-[var(--surface-soft)] px-5 py-4">
            <p className="text-sm font-semibold text-[var(--muted)]">Version</p>
            <p className="mt-1 text-xl font-extrabold">{roadmapVersion.versionNumber}</p>
          </div>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        <input name="roadmapId" type="hidden" value={roadmapVersion.id} />
        <input name="contentJson" type="hidden" value={serializedDraft} />

        <section className="card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Goal</label>
              <input
                className="field"
                value={draft.goal}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, goal: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Summary</label>
              <input
                className="field"
                value={draft.summary}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, summary: event.target.value }))
                }
              />
            </div>
          </div>
        </section>

        {draft.milestones.map((milestone, milestoneIndex) => (
          <section className="card p-6" key={`${milestone.title}-${milestoneIndex}`}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Milestone title</label>
                <input
                  className="field"
                  value={milestone.title}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      milestones: current.milestones.map((item, index) =>
                        index === milestoneIndex
                          ? { ...item, title: event.target.value }
                          : item,
                      ),
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">Outcome</label>
                <input
                  className="field"
                  value={milestone.outcome}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      milestones: current.milestones.map((item, index) =>
                        index === milestoneIndex
                          ? { ...item, outcome: event.target.value }
                          : item,
                      ),
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">Estimated time</label>
                <input
                  className="field"
                  value={milestone.estimatedTime}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      milestones: current.milestones.map((item, index) =>
                        index === milestoneIndex
                          ? { ...item, estimatedTime: event.target.value }
                          : item,
                      ),
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">Due window</label>
                <input
                  className="field"
                  value={milestone.dueWindow}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      milestones: current.milestones.map((item, index) =>
                        index === milestoneIndex
                          ? { ...item, dueWindow: event.target.value }
                          : item,
                      ),
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Tasks
              </p>
              {milestone.tasks.map((task, taskIndex) => (
                <div
                  className="grid gap-4 rounded-3xl border border-[var(--line)] bg-white/70 p-4 md:grid-cols-2"
                  key={`${task.title}-${taskIndex}`}
                >
                  <div>
                    <label className="label">Task title</label>
                    <input
                      className="field"
                      value={task.title}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          milestones: current.milestones.map((item, index) =>
                            index === milestoneIndex
                              ? {
                                  ...item,
                                  tasks: item.tasks.map((entry, entryIndex) =>
                                    entryIndex === taskIndex
                                      ? { ...entry, title: event.target.value }
                                      : entry,
                                  ),
                                }
                              : item,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Details</label>
                    <input
                      className="field"
                      value={task.details}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          milestones: current.milestones.map((item, index) =>
                            index === milestoneIndex
                              ? {
                                  ...item,
                                  tasks: item.tasks.map((entry, entryIndex) =>
                                    entryIndex === taskIndex
                                      ? { ...entry, details: event.target.value }
                                      : entry,
                                  ),
                                }
                              : item,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Estimated time</label>
                    <input
                      className="field"
                      value={task.estimatedTime}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          milestones: current.milestones.map((item, index) =>
                            index === milestoneIndex
                              ? {
                                  ...item,
                                  tasks: item.tasks.map((entry, entryIndex) =>
                                    entryIndex === taskIndex
                                      ? { ...entry, estimatedTime: event.target.value }
                                      : entry,
                                  ),
                                }
                              : item,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Due window</label>
                    <input
                      className="field"
                      value={task.dueWindow}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          milestones: current.milestones.map((item, index) =>
                            index === milestoneIndex
                              ? {
                                  ...item,
                                  tasks: item.tasks.map((entry, entryIndex) =>
                                    entryIndex === taskIndex
                                      ? { ...entry, dueWindow: event.target.value }
                                      : entry,
                                  ),
                                }
                              : item,
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

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

        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Saving..." : "Save roadmap edits"}
        </button>
      </form>
    </section>
  );
}
