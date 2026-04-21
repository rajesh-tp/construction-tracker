"use client";

import { useActionState, useEffect, useState } from "react";
import { updateAccountBalance, type ActionState } from "@/lib/actions";
import { toast } from "sonner";

const initialState: ActionState = { status: "idle", message: "" };

export function EditBalanceForm({
  accountId,
  currentInitialBalance,
}: {
  accountId: number;
  currentInitialBalance: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const boundAction = updateAccountBalance.bind(null, accountId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      setIsEditing(false);
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message]);

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-xs text-primary hover:text-primary-hover transition-colors"
        title="Edit initial balance"
      >
        Edit
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex items-center gap-2">
      <input
        type="number"
        name="initialBalance"
        defaultValue={currentInitialBalance}
        min="0"
        step="0.01"
        className="w-32 rounded-lg border border-border-strong px-3 py-1.5 text-sm text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save"}
      </button>
      <button
        type="button"
        onClick={() => setIsEditing(false)}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
      >
        Cancel
      </button>
    </form>
  );
}
