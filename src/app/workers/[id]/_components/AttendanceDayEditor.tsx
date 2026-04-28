"use client";

import { useActionState, useEffect, useState } from "react";
import { upsertAttendance, deleteAttendance, type ActionState } from "@/lib/actions";
import { ATTENDANCE_UNITS, ATTENDANCE_UNIT_LABELS } from "@/lib/validators";
import { toast } from "sonner";
import { useTransition } from "react";

const initialState: ActionState = { status: "idle", message: "" };

type Props = {
  workerId: number;
  date: string;
  defaultUnits: number | undefined;
  defaultWage: number;
  attendanceId: number | undefined;
};

export function AttendanceDayEditor({ workerId, date, defaultUnits, defaultWage, attendanceId }: Props) {
  const [state, formAction, isPending] = useActionState(upsertAttendance, initialState);
  const [units, setUnits] = useState<number>(defaultUnits ?? 1);
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    setUnits(defaultUnits ?? 1);
  }, [defaultUnits, date]);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message]);

  function handleDelete() {
    if (!attendanceId) return;
    startDelete(async () => {
      const r = await deleteAttendance(attendanceId);
      if (r.status === "success") toast.success(r.message);
      else toast.error(r.message);
    });
  }

  return (
    <form action={formAction} id="editor" className="space-y-4 rounded-lg border border-border p-4 bg-surface-alt">
      <input type="hidden" name="workerId" value={workerId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="units" value={units} />
      <input type="hidden" name="wageSnapshot" value={defaultWage} />

      <div>
        <p className="text-sm font-medium text-text-heading mb-1">
          Attendance for {date}
        </p>
        <p className="text-xs text-text-muted">Daily wage snapshot: ₹{defaultWage}</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ATTENDANCE_UNITS.map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnits(u)}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              units === u
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-secondary hover:bg-surface-alt"
            }`}
          >
            {ATTENDANCE_UNIT_LABELS[String(u)]}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Notes (optional)
        </label>
        <input
          type="text"
          id="notes"
          name="notes"
          className="w-full rounded-lg border border-border-strong px-4 py-2 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        {attendanceId && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-accent-red transition-colors hover:bg-accent-red-bg disabled:opacity-50"
          >
            Remove entry
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
