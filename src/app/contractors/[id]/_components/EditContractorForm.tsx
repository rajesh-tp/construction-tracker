"use client";

import { useActionState, useEffect } from "react";
import { updateContractor, type ActionState } from "@/lib/actions";
import { CONTRACTOR_TYPES } from "@/lib/validators";
import { toast } from "sonner";
import type { Contractor } from "@/db/schema";

const initialState: ActionState = { status: "idle", message: "" };

export function EditContractorForm({ contractor }: { contractor: Contractor }) {
  const boundAction = updateContractor.bind(null, contractor.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

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
            Contractor Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={contractor.name}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="contractorType" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Contractor Type *
          </label>
          <select
            id="contractorType"
            name="contractorType"
            required
            defaultValue={contractor.contractorType}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            {CONTRACTOR_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contactPhone" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Phone
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            defaultValue={contractor.contactPhone || ""}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
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
            defaultValue={contractor.contactEmail || ""}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
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
            defaultValue={contractor.initialBalance}
            min="0"
            step="0.01"
            disabled
            className="w-full rounded-lg border border-border-strong bg-surface-alt px-4 py-2.5 text-text-muted"
          />
          <p className="mt-1 text-xs text-text-faint">Initial balance cannot be changed after creation</p>
        </div>
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
