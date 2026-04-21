"use client";

import { useActionState, useEffect, useRef } from "react";
import { createConstruction, type ActionState } from "@/lib/actions";
import { toast } from "sonner";

const initialState: ActionState = { status: "idle", message: "" };

export function ConstructionForm() {
  const [state, formAction, isPending] = useActionState(createConstruction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Construction Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          placeholder="e.g., Rajesh's Home"
        />
        {state.errors?.name && (
          <p className="mt-1 text-xs text-accent-red">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          placeholder="Brief description of the construction project..."
        />
        {state.errors?.description && (
          <p className="mt-1 text-xs text-accent-red">{state.errors.description[0]}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-focus-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create Construction"}
        </button>
      </div>
    </form>
  );
}
