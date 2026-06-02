import type { RoadmapTask, TaskResource } from "@prisma/client";
import {
  updateTaskResourceStatusFormAction,
  updateTaskStatusFormAction,
} from "@/lib/planning/actions";

type TaskWithResources = RoadmapTask & {
  resources: TaskResource[];
};

type TaskBoardProps = {
  tasks: TaskWithResources[];
};

export function TaskBoard({ tasks }: TaskBoardProps) {
  const grouped = tasks.reduce(
    (acc, task) => {
      const key = `${task.milestoneIndex}:${task.milestoneTitle}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(task);
      return acc;
    },
    {} as Record<string, TaskWithResources[]>,
  );

  return (
    <section className="space-y-6">
      {Object.entries(grouped).map(([groupKey, milestoneTasks]) => (
        <article className="card p-6" key={groupKey}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="pill">Milestone</div>
              <h3 className="mt-3 text-2xl font-extrabold">
                {milestoneTasks[0]?.milestoneTitle}
              </h3>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {milestoneTasks.filter((task) => task.status === "COMPLETED").length}/
              {milestoneTasks.length} tasks completed
            </p>
          </div>

          <div className="space-y-4">
            {milestoneTasks.map((task) => (
              <div
                className="rounded-3xl border border-[var(--line)] bg-white/70 p-5"
                key={task.id}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-bold">{task.title}</p>
                    <p className="text-sm text-[var(--muted)]">{task.details}</p>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-[var(--muted)]">
                      <span className="rounded-full bg-[var(--surface-soft)] px-3 py-2">
                        {task.estimatedTime}
                      </span>
                      <span className="rounded-full bg-[var(--surface-soft)] px-3 py-2">
                        {task.priority}
                      </span>
                      <span className="rounded-full bg-[var(--surface-soft)] px-3 py-2">
                        {task.dueWindow}
                      </span>
                      <span className="rounded-full bg-[var(--surface-soft)] px-3 py-2">
                        {task.calendarStatus}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      {task.scheduledStart && task.scheduledEnd
                        ? `Scheduled: ${new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(task.scheduledStart)} to ${new Intl.DateTimeFormat("en-US", {
                            timeStyle: "short",
                          }).format(task.scheduledEnd)}`
                        : "Not scheduled yet"}
                    </p>
                    {task.syncError ? (
                      <p className="text-sm text-red-700">Sync issue: {task.syncError}</p>
                    ) : null}
                  </div>

                    <div className="flex flex-wrap gap-2">
                      {(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const).map((status) => (
                      <form action={updateTaskStatusFormAction} key={status}>
                        <input name="taskId" type="hidden" value={task.id} />
                        <input name="status" type="hidden" value={status} />
                        <button
                          className={`btn ${task.status === status ? "btn-primary" : "btn-secondary"}`}
                          type="submit"
                        >
                          {status.replaceAll("_", " ")}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Resources
                  </p>
                  {task.resources.length ? (
                    task.resources.map((resource) => (
                      <div
                        className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4"
                        key={resource.id}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <a
                              className="text-base font-bold text-[var(--brand-strong)]"
                              href={resource.url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {resource.title}
                            </a>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                              {resource.whyRelevant}
                            </p>
                          </div>

                          <form action={updateTaskResourceStatusFormAction}>
                            <input name="resourceId" type="hidden" value={resource.id} />
                            <input
                              name="status"
                              type="hidden"
                              value={resource.status === "COMPLETED" ? "SAVED" : "COMPLETED"}
                            />
                            <button className="btn btn-secondary" type="submit">
                              {resource.status === "COMPLETED"
                                ? "Mark incomplete"
                                : "Mark complete"}
                            </button>
                          </form>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--muted)]">
                      No resources attached yet. Use the resource agent above.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
