"use client";

import { toggleContractorActive } from "@/lib/actions";
import type { Contractor } from "@/db/schema";
import Link from "next/link";
import { toast } from "sonner";
import { useTransition } from "react";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ContractorList({ contractors }: { contractors: Contractor[] }) {
  const [isPending, startTransition] = useTransition();

  if (contractors.length === 0) {
    return <p className="text-sm text-text-muted">No contractors added yet.</p>;
  }

  function handleToggle(id: number, currentActive: boolean) {
    startTransition(async () => {
      await toggleContractorActive(id, !currentActive);
      toast.success(currentActive ? "Contractor deactivated" : "Contractor activated");
    });
  }

  return (
    <>
      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {contractors.map((c) => (
          <div key={c.id} className="rounded-lg border border-border/50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary">{c.name}</p>
                <p className="text-xs text-text-muted">{c.contractorType}</p>
              </div>
              <span
                className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.isActive
                    ? "bg-accent-green-bg text-accent-green"
                    : "bg-accent-red-bg text-accent-red"
                }`}
              >
                {c.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
              <span>{c.contactPhone || "No phone"} &middot; {formatCurrency(c.initialBalance)}</span>
              <span>{formatDate(c.createdAt)}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <Link href={`/contractors/${c.id}`} className="text-primary hover:underline">
                Edit
              </Link>
              <button
                onClick={() => handleToggle(c.id, c.isActive)}
                disabled={isPending}
                className="text-text-muted hover:text-text-primary disabled:opacity-50"
              >
                {c.isActive ? "Deactivate" : "Activate"}
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
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Phone</th>
              <th className="pb-2 font-medium">Initial Balance</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Added</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contractors.map((c) => (
              <tr key={c.id} className="border-b border-border/50">
                <td className="py-2.5 font-medium text-text-primary">{c.name}</td>
                <td className="py-2.5 text-text-secondary">{c.contractorType}</td>
                <td className="py-2.5 text-text-secondary">{c.contactPhone || "—"}</td>
                <td className="py-2.5 text-text-secondary">{formatCurrency(c.initialBalance)}</td>
                <td className="py-2.5">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.isActive
                        ? "bg-accent-green-bg text-accent-green"
                        : "bg-accent-red-bg text-accent-red"
                    }`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-2.5 text-text-secondary">{formatDate(c.createdAt)}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/contractors/${c.id}`}
                      className="text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleToggle(c.id, c.isActive)}
                      disabled={isPending}
                      className="text-text-muted hover:text-text-primary disabled:opacity-50"
                    >
                      {c.isActive ? "Deactivate" : "Activate"}
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
