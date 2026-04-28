"use client";

import { useActionState, useEffect, useRef } from "react";
import { createWorker, type ActionState } from "@/lib/actions";
import { toast } from "sonner";
import type { Contractor } from "@/db/schema";

const initialState: ActionState = { status: "idle", message: "" };

export function WorkerForm({ contractors }: { contractors: Contractor[] }) {
  const [state, formAction, isPending] = useActionState(createWorker, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message]);

  if (contractors.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Please add a contractor first before adding workers.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
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
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            placeholder="e.g., Suresh Kumar"
          />
          {state.errors?.name && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="contractorId" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Contractor (Labour Contract) *
          </label>
          <select
            id="contractorId"
            name="contractorId"
            required
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            <option value="">Select contractor...</option>
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
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            placeholder="e.g., 800"
          />
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
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            placeholder="e.g., 9876543210"
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
          className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-focus-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Adding..." : "Add Worker"}
        </button>
      </div>
    </form>
  );
}
