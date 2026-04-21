"use client";

import { useActionState, useEffect } from "react";
import { updateProfile, type ActionState } from "@/lib/actions";
import { toast } from "sonner";
import type { User } from "@/db/schema";

const initialState: ActionState = { status: "idle", message: "" };

export function ProfileForm({ user }: { user: User }) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Profile Info */}
      <div>
        <h3 className="mb-4 text-base font-semibold text-text-heading">Profile Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={user.name}
              className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            />
            {state.errors?.name && (
              <p className="mt-1 text-xs text-accent-red">{state.errors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              defaultValue={user.email}
              className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            />
            {state.errors?.email && (
              <p className="mt-1 text-xs text-accent-red">{state.errors.email[0]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div>
        <h3 className="mb-4 text-base font-semibold text-text-heading">Change Password</h3>
        <p className="mb-4 text-xs text-text-muted">Leave blank to keep your current password.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            />
            {state.errors?.currentPassword && (
              <p className="mt-1 text-xs text-accent-red">{state.errors.currentPassword[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-text-secondary">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            />
            {state.errors?.newPassword && (
              <p className="mt-1 text-xs text-accent-red">{state.errors.newPassword[0]}</p>
            )}
          </div>
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
