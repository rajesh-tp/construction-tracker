"use client";

import { useActionState, useEffect } from "react";
import { updateWorker, type ActionState } from "@/lib/actions";
import { toast } from "sonner";
import type { Worker, Contractor } from "@/db/schema";

const initialState: ActionState = { status: "idle", message: "" };

export function EditWorkerForm({
  worker,
  contractors,
}: {
  worker: Worker;
  contractors: Contractor[];
}) {
  const updateWithId = updateWorker.bind(null, worker.id);
  const [state, formAction, isPending] = useActionState(updateWithId, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Worker Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={worker.name}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          />
          {state.errors?.name && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="contractorId" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Contractor *
          </label>
          <select
            id="contractorId"
            name="contractorId"
            required
            defaultValue={worker.contractorId}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.contractorType})
              </option>
            ))}
          </select>
          {state.errors?.contractorId && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.contractorId[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="dailyWage" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Daily Wage (INR) *
          </label>
          <input
            type="number"
            id="dailyWage"
            name="dailyWage"
            required
            min="0"
            step="0.01"
            defaultValue={worker.dailyWage}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          />
          <p className="mt-1 text-xs text-text-faint">
            Wage changes only affect future attendance entries; past entries keep their snapshot.
          </p>
          {state.errors?.dailyWage && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.dailyWage[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            defaultValue={worker.phone || ""}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={worker.notes || ""}
          className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-focus-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
