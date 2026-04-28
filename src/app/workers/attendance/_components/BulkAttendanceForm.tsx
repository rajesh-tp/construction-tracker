"use client";

import { useActionState, useEffect, useState } from "react";
import { bulkUpsertAttendance, type ActionState } from "@/lib/actions";
import { ATTENDANCE_UNITS, ATTENDANCE_UNIT_LABELS } from "@/lib/validators";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

const initialState: ActionState = { status: "idle", message: "" };

type WorkerOption = {
  id: number;
  name: string;
  dailyWage: number;
};

type ContractorOption = {
  id: number;
  name: string;
  contractorType: string;
};

type Props = {
  date: string;
  contractorId: number | undefined;
  contractors: ContractorOption[];
  workers: WorkerOption[];
  existing: Record<number, number>;
};

function unitsClass(units: number, isSelected: boolean): string {
  if (!isSelected) return "border-border bg-surface text-text-secondary hover:bg-surface-alt";
  if (units === 0) return "border-accent-red bg-accent-red-bg text-accent-red";
  if (units === 0.5) return "border-accent-amber bg-accent-amber-bg text-accent-amber";
  if (units === 1) return "border-accent-green bg-accent-green-bg text-accent-green";
  if (units === 1.5) return "border-primary bg-blue-100 text-primary";
  return "border-border bg-surface text-text-secondary";
}

export function BulkAttendanceForm({ date, contractorId, contractors, workers, existing }: Props) {
  const [state, formAction, isPending] = useActionState(bulkUpsertAttendance, initialState);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selections, setSelections] = useState<Record<number, number>>(existing);

  useEffect(() => {
    setSelections(existing);
  }, [existing, date, contractorId]);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message]);

  function setForAll(units: number) {
    const next: Record<number, number> = {};
    for (const w of workers) next[w.id] = units;
    setSelections(next);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", e.target.value);
    router.push(`/workers/attendance?${params.toString()}`);
  }

  function handleContractorChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) params.set("contractorId", e.target.value);
    else params.delete("contractorId");
    router.push(`/workers/attendance?${params.toString()}`);
  }

  const entries = Object.entries(selections).map(([workerId, units]) => ({
    workerId: Number(workerId),
    units,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Date *
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={handleDateChange}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="contractorId" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Contractor *
          </label>
          <select
            id="contractorId"
            value={contractorId ?? ""}
            onChange={handleContractorChange}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            <option value="">Select contractor...</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.contractorType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {contractorId && workers.length === 0 && (
        <p className="text-sm text-text-muted">
          No active workers under this contractor. Add workers first.
        </p>
      )}

      {contractorId && workers.length > 0 && (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="contractorId" value={contractorId} />
          <input type="hidden" name="entries" value={JSON.stringify(entries)} />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-secondary">Quick set all:</span>
            {ATTENDANCE_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setForAll(u)}
                className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-text-secondary hover:bg-surface-alt"
              >
                {ATTENDANCE_UNIT_LABELS[String(u)]}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {workers.map((w) => {
              const current = selections[w.id];
              return (
                <div
                  key={w.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary">{w.name}</p>
                    <p className="text-xs text-text-muted">₹{w.dailyWage}/day</p>
                  </div>
                  <div className="grid grid-cols-4 gap-1 sm:flex sm:gap-2">
                    {ATTENDANCE_UNITS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() =>
                          setSelections((prev) => ({ ...prev, [w.id]: u }))
                        }
                        className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${unitsClass(u, current === u)}`}
                      >
                        {ATTENDANCE_UNIT_LABELS[String(u)]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending || entries.length === 0}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {isPending ? "Saving..." : `Save Attendance (${entries.length})`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
