"use client";

import { assignUserToConstruction, removeUserFromConstruction } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@/db/schema";

type UserAssignmentProps = {
  constructionId: number;
  assignedUsers: User[];
  availableUsers: User[];
};

export function UserAssignment({ constructionId, assignedUsers, availableUsers }: UserAssignmentProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  async function handleAssign() {
    if (!selectedUserId) return;
    setIsAssigning(true);
    const result = await assignUserToConstruction(Number(selectedUserId), constructionId);
    if (result.status === "success") {
      toast.success(result.message);
      setSelectedUserId("");
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setIsAssigning(false);
  }

  async function handleRemove(userId: number) {
    const result = await removeUserFromConstruction(userId, constructionId);
    if (result.status === "success") {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="space-y-4">
      {/* Add user form */}
      {availableUsers.length > 0 && (
        <div className="flex gap-2">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            <option value="">Select a user to assign...</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email}) - {u.role}
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedUserId || isAssigning}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAssigning ? "Adding..." : "Add"}
          </button>
        </div>
      )}

      {/* Assigned users list */}
      {assignedUsers.length === 0 ? (
        <p className="text-sm text-text-muted">No users assigned yet.</p>
      ) : (
        <div className="space-y-2">
          {assignedUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div>
                <p className="font-medium text-text-primary">{u.name}</p>
                <p className="text-xs text-text-muted">
                  {u.email} &middot; <span className="capitalize">{u.role}</span>
                </p>
              </div>
              <button
                onClick={() => handleRemove(u.id)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent-red transition-colors hover:bg-accent-red-bg"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
