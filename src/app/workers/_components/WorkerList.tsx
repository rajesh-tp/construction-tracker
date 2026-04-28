"use client";

import { toggleWorkerActive } from "@/lib/actions";
import Link from "next/link";
import { toast } from "sonner";
import { useTransition } from "react";

type WorkerRow = {
  id: number;
  name: string;
  contractorId: number;
  contractorName: string;
  contractorType: string;
  dailyWage: number;
  phone: string | null;
  isActive: boolean;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function WorkerList({ workers }: { workers: WorkerRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (workers.length === 0) {
    return <p className="text-sm text-text-muted">No workers added yet.</p>;
  }

  function handleToggle(id: number, currentActive: boolean) {
    startTransition(async () => {
      await toggleWorkerActive(id, !currentActive);
      toast.success(currentActive ? "Worker deactivated" : "Worker activated");
    });
  }

  return (
    <>
      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {workers.map((w) => (
          <div key={w.id} className="rounded-lg border border-border/50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link href={`/workers/${w.id}`} className="font-medium text-text-primary hover:underline">
                  {w.name}
                </Link>
                <p className="text-xs text-text-muted">{w.contractorName} &middot; {w.contractorType}</p>
              </div>
              <span
                className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  w.isActive
                    ? "bg-accent-green-bg text-accent-green"
                    : "bg-accent-red-bg text-accent-red"
                }`}
              >
                {w.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
              <span>{formatCurrency(w.dailyWage)}/day</span>
              <span>{w.phone || "No phone"}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <Link href={`/workers/${w.id}`} className="text-primary hover:underline">
                Open
              </Link>
              <button
                onClick={() => handleToggle(w.id, w.isActive)}
                disabled={isPending}
                className="text-text-muted hover:text-text-primary disabled:opacity-50"
              >
                {w.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Contractor</th>
              <th className="pb-2 font-medium">Daily Wage</th>
              <th className="pb-2 font-medium">Phone</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id} className="border-b border-border/50">
                <td className="py-2.5 font-medium text-text-primary">{w.name}</td>
                <td className="py-2.5 text-text-secondary">{w.contractorName}</td>
                <td className="py-2.5 text-text-secondary">{formatCurrency(w.dailyWage)}</td>
                <td className="py-2.5 text-text-secondary">{w.phone || "—"}</td>
                <td className="py-2.5">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      w.isActive
                        ? "bg-accent-green-bg text-accent-green"
                        : "bg-accent-red-bg text-accent-red"
                    }`}
                  >
                    {w.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <Link href={`/workers/${w.id}`} className="text-primary hover:underline">
                      Open
                    </Link>
                    <button
                      onClick={() => handleToggle(w.id, w.isActive)}
                      disabled={isPending}
                      className="text-text-muted hover:text-text-primary disabled:opacity-50"
                    >
                      {w.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
