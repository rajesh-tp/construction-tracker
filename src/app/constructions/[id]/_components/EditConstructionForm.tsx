"use client";

import { useActionState, useEffect } from "react";
import { updateConstruction, toggleConstructionActive, type ActionState } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Construction } from "@/db/schema";

const initialState: ActionState = { status: "idle", message: "" };

type EditConstructionFormProps = {
  construction: Construction;
};

export function EditConstructionForm({ construction }: EditConstructionFormProps) {
  const updateWithId = updateConstruction.bind(null, construction.id);
  const [state, formAction, isPending] = useActionState(updateWithId, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      router.refresh();
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message, router]);

  async function handleToggleActive() {
    await toggleConstructionActive(construction.id, !construction.isActive);
    toast.success(construction.isActive ? "Construction deactivated." : "Construction activated.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={construction.name}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
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
            defaultValue={construction.description || ""}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          />
          {state.errors?.description && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.description[0]}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleToggleActive}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              construction.isActive
                ? "text-accent-red hover:bg-accent-red-bg"
                : "text-accent-green hover:bg-accent-green-bg"
            }`}
          >
            {construction.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-focus-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
