"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { payContractorWages, type ActionState } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

const initialState: ActionState = { status: "idle", message: "" };

type Day = { attendanceId: number; date: string; units: number; wageSnapshot: number };
type WorkerGroup = {
  workerId: number;
  workerName: string;
  workerActive: boolean;
  days: Day[];
  totalWage: number;
};

type ContractorOption = {
  id: number;
  name: string;
  contractorType: string;
};

type Props = {
  contractorId: number | undefined;
  contractors: ContractorOption[];
  groups: WorkerGroup[];
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function PayWagesForm({ contractorId, contractors, groups }: Props) {
  const [state, formAction, isPending] = useActionState(payContractorWages, initialState);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => {
    const all = new Set<number>();
    for (const g of groups) for (const d of g.days) all.add(d.attendanceId);
    return all;
  });
  const [paymentDate, setPaymentDate] = useState<string>(todayStr());
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    // Reset selection on contractor change
    const all = new Set<number>();
    for (const g of groups) for (const d of g.days) all.add(d.attendanceId);
    setSelectedIds(all);
  }, [groups, contractorId]);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      router.push("/workers");
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message, router]);

  function handleContractorChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) params.set("contractorId", e.target.value);
    else params.delete("contractorId");
    router.push(`/workers/pay?${params.toString()}`);
  }

  function toggleId(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleWorker(g: WorkerGroup) {
    const allSelected = g.days.every((d) => selectedIds.has(d.attendanceId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const d of g.days) {
        if (allSelected) next.delete(d.attendanceId);
        else next.add(d.attendanceId);
      }
      return next;
    });
  }

  const totalSelected = useMemo(() => {
    let total = 0;
    for (const g of groups) {
      for (const d of g.days) {
        if (selectedIds.has(d.attendanceId)) total += d.units * d.wageSnapshot;
      }
    }
    return total;
  }, [groups, selectedIds]);

  const idsArr = Array.from(selectedIds);

  return (
    <div className="space-y-5">
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

      {contractorId && groups.length === 0 && (
        <p className="text-sm text-text-muted">
          No unpaid attendance for this contractor&apos;s workers.
        </p>
      )}

      {contractorId && groups.length > 0 && (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="contractorId" value={contractorId} />
          <input type="hidden" name="date" value={paymentDate} />
          <input type="hidden" name="notes" value={notes} />
          <input type="hidden" name="attendanceIds" value={JSON.stringify(idsArr)} />

          <div className="space-y-3">
            {groups.map((g) => {
              const selectedCount = g.days.filter((d) => selectedIds.has(d.attendanceId)).length;
              const selectedWage = g.days.reduce(
                (s, d) => (selectedIds.has(d.attendanceId) ? s + d.units * d.wageSnapshot : s),
                0
              );
              return (
                <div key={g.workerId} className="rounded-lg border border-border/50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={g.days.every((d) => selectedIds.has(d.attendanceId))}
                        onChange={() => toggleWorker(g)}
                      />
                      <span className="font-medium text-text-primary">
                        {g.workerName}
                        {!g.workerActive && (
                          <span className="ml-1 text-xs text-text-faint">(Inactive)</span>
                        )}
                      </span>
                    </label>
                    <span className="text-sm font-semibold text-accent-green">
                      {formatCurrency(selectedWage)} <span className="text-text-faint font-normal">/ {formatCurrency(g.totalWage)}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                    {g.days.map((d) => {
                      const checked = selectedIds.has(d.attendanceId);
                      return (
                        <label
                          key={d.attendanceId}
                          className={`flex cursor-pointer items-center gap-2 rounded border px-2 py-1 text-xs transition-colors ${
                            checked
                              ? "border-primary bg-blue-50 text-primary"
                              : "border-border bg-surface text-text-secondary hover:bg-surface-alt"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleId(d.attendanceId)}
                            className="h-3 w-3"
                          />
                          <span className="font-mono">{d.date}</span>
                          <span className="ml-auto text-text-faint">{d.units}×</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-xs text-text-faint">
                    {selectedCount} of {g.days.length} days selected
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Payment date *
              </label>
              <input
                type="date"
                id="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Notes (optional)
              </label>
              <input
                type="text"
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm text-text-secondary">Total to pay</p>
              <p className="text-xl font-semibold text-accent-green">{formatCurrency(totalSelected)}</p>
              <p className="text-xs text-text-faint">{idsArr.length} attendance entries</p>
            </div>
            <button
              type="submit"
              disabled={isPending || idsArr.length === 0 || totalSelected <= 0}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {isPending ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
