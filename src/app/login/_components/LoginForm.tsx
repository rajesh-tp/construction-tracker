"use client";

import { useActionState, useEffect } from "react";
import { login, type ActionState } from "@/lib/actions";
import { toast } from "sonner";

const initialState: ActionState = { status: "idle", message: "" };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  useEffect(() => {
    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message]);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-text-secondary"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-text-secondary"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
        />
      </div>

      {state.status === "error" && (
        <p className="text-center text-sm text-accent-red">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-focus-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
