"use client";

import { useActionState, useEffect } from "react";
import { createContractor, type ActionState } from "@/lib/actions";
import { CONTRACTOR_TYPES } from "@/lib/validators";
import { toast } from "sonner";

const initialState: ActionState = { status: "idle", message: "" };

export function ContractorForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, isPending] = useActionState(createContractor, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      onSuccess?.();
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Contractor Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            placeholder="e.g., Ravi & Sons"
          />
          {state.errors?.name && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="contractorType" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Contractor Type *
          </label>
          <select
            id="contractorType"
            name="contractorType"
            required
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            <option value="">Select type...</option>
            {CONTRACTOR_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {state.errors?.contractorType && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.contractorType[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="contactPhone" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Phone
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            placeholder="e.g., 9876543210"
          />
        </div>

        <div>
          <label htmlFor="contactEmail" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Email
          </label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            placeholder="e.g., contractor@example.com"
          />
        </div>

        <div>
          <label htmlFor="initialBalance" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Initial Balance (INR)
          </label>
          <input
            type="number"
            id="initialBalance"
            name="initialBalance"
            defaultValue="0"
            min="0"
            step="0.01"
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-focus-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Adding..." : "Add Contractor"}
        </button>
      </div>
    </form>
  );
}
