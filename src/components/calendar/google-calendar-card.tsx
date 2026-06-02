import Link from "next/link";
import type { CalendarSync } from "@prisma/client";
import { disconnectGoogleCalendarFormAction } from "@/lib/planning/actions";

type GoogleCalendarCardProps = {
  calendarSync: CalendarSync | null;
};

export function GoogleCalendarCard({ calendarSync }: GoogleCalendarCardProps) {
  return (
    <section className="card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="pill">Google Calendar</div>
          <h2 className="mt-4 text-3xl font-extrabold">
            {calendarSync?.isConnected ? "Calendar connected" : "Connect your calendar"}
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Use Google Calendar only for scheduling. Pathly will sync roadmap tasks
            into understandable study blocks and keep them aligned with your plan.
          </p>
        </div>
        <div className="rounded-3xl bg-[var(--surface-soft)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--muted)]">Sync status</p>
          <p className="mt-1 text-xl font-extrabold">
            {calendarSync?.isConnected ? "Connected" : "Not connected"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {calendarSync?.isConnected ? (
          <form action={disconnectGoogleCalendarFormAction}>
            <button className="btn btn-secondary" type="submit">
              Disconnect calendar
            </button>
          </form>
        ) : (
          <Link className="btn btn-primary" href="/api/google/connect">
            Connect Google Calendar
          </Link>
        )}
      </div>
    </section>
  );
}
