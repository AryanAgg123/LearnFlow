"use client";

import { useActionState } from "react";
import {
  findResourcesAction,
  refreshPerformanceInsightsAction,
  syncCalendarAction,
  type PlannerActionState,
} from "@/lib/planning/actions";

const initialState: PlannerActionState = {};

export function PlanningActionsPanel() {
  const [resourceState, resourceAction, resourcePending] = useActionState(
    findResourcesAction,
    initialState,
  );
  const [calendarState, calendarAction, calendarPending] = useActionState(
    syncCalendarAction,
    initialState,
  );
  const [insightState, insightAction, insightPending] = useActionState(
    refreshPerformanceInsightsAction,
    initialState,
  );

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <form action={resourceAction} className="card p-6">
        <p className="text-lg font-bold">Find curated resources</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Use the resource agent to attach a small set of strong learning materials to active tasks.
        </p>
        <button className="btn btn-primary mt-5 w-full" disabled={resourcePending} type="submit">
          {resourcePending ? "Curating..." : "Find resources"}
        </button>
        {resourceState.error ? (
          <p className="mt-3 text-sm text-red-700">{resourceState.error}</p>
        ) : null}
        {resourceState.success ? (
          <p className="mt-3 text-sm text-emerald-700">{resourceState.success}</p>
        ) : null}
      </form>

      <form action={calendarAction} className="card p-6">
        <p className="text-lg font-bold">Sync schedule</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Use the scheduler agent to convert active tasks into calendar events and push them to Google Calendar.
        </p>
        <button className="btn btn-primary mt-5 w-full" disabled={calendarPending} type="submit">
          {calendarPending ? "Syncing..." : "Sync calendar"}
        </button>
        {calendarState.error ? (
          <p className="mt-3 text-sm text-red-700">{calendarState.error}</p>
        ) : null}
        {calendarState.success ? (
          <p className="mt-3 text-sm text-emerald-700">{calendarState.success}</p>
        ) : null}
      </form>

      <form action={insightAction} className="card p-6">
        <p className="text-lg font-bold">Refresh performance insight</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Ask the performance agent to compare planned versus actual progress and suggest refinements.
        </p>
        <button className="btn btn-primary mt-5 w-full" disabled={insightPending} type="submit">
          {insightPending ? "Refreshing..." : "Refresh insight"}
        </button>
        {insightState.error ? (
          <p className="mt-3 text-sm text-red-700">{insightState.error}</p>
        ) : null}
        {insightState.success ? (
          <p className="mt-3 text-sm text-emerald-700">{insightState.success}</p>
        ) : null}
      </form>
    </section>
  );
}
