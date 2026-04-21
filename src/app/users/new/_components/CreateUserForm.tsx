"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createUser, type ActionState } from "@/lib/actions";
import { USER_ROLES } from "@/lib/validators";
import { toast } from "sonner";

const initialState: ActionState = { status: "idle", message: "" };

type ContractorOption = {
  id: number;
  name: string;
  constructionId: number;
};

type CreateUserFormProps = {
  contractors: ContractorOption[];
  constructions: { id: number; name: string }[];
};

export function CreateUserForm({ contractors, constructions }: CreateUserFormProps) {
  const [state, formAction, isPending] = useActionState(createUser, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
      setSelectedRole("");
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message]);

  const constructionMap = new Map(constructions.map((c) => [c.id, c.name]));

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
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
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            placeholder="e.g., John Doe"
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
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            placeholder="e.g., john@example.com"
          />
          {state.errors?.email && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Role *
          </label>
          <select
            id="role"
            name="role"
            required
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            <option value="">Select role...</option>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
          {state.errors?.role && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.role[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            placeholder="Min 6 characters"
          />
          {state.errors?.password && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.password[0]}</p>
          )}
        </div>

        {selectedRole === "contractor" && (
          <div className="sm:col-span-2">
            <label htmlFor="contractorId" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Link to Contractor
            </label>
            <select
              id="contractorId"
              name="contractorId"
              className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            >
              <option value="">No contractor linked</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({constructionMap.get(c.constructionId) || `Construction #${c.constructionId}`})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-faint">
              Link this user to a contractor so they can view their own account data.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-focus-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create User"}
        </button>
      </div>
    </form>
  );
}
