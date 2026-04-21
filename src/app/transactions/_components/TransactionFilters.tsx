"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { Account, Contractor } from "@/db/schema";

type TransactionFiltersProps = {
  accounts: Account[];
  contractors: Contractor[];
  currentFilters: {
    accountId?: string;
    contractorId?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  };
};

export function TransactionFilters({
  accounts,
  contractors,
  currentFilters,
}: TransactionFiltersProps) {
  const router = useRouter();

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams();

      const filters = { ...currentFilters, [key]: value };

      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });

      router.push(`/transactions?${params.toString()}`);
    },
    [currentFilters, router]
  );

  const clearFilters = useCallback(() => {
    router.push("/transactions");
  }, [router]);

  const hasFilters = Object.values(currentFilters).some(Boolean);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[150px] flex-1">
          <label className="mb-1 block text-xs font-medium text-text-muted">Account</label>
          <select
            value={currentFilters.accountId || ""}
            onChange={(e) => updateFilters("accountId", e.target.value)}
            className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm text-text-heading focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            <option value="">All accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.accountName}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px] flex-1">
          <label className="mb-1 block text-xs font-medium text-text-muted">Contractor</label>
          <select
            value={currentFilters.contractorId || ""}
            onChange={(e) => updateFilters("contractorId", e.target.value)}
            className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm text-text-heading focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            <option value="">All contractors</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[120px] flex-1">
          <label className="mb-1 block text-xs font-medium text-text-muted">Type</label>
          <select
            value={currentFilters.type || ""}
            onChange={(e) => updateFilters("type", e.target.value)}
            className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm text-text-heading focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            <option value="">All types</option>
            <option value="expense">Expense</option>
            <option value="payment">Payment</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-medium text-text-muted">From Date</label>
          <input
            type="date"
            value={currentFilters.dateFrom || ""}
            onChange={(e) => updateFilters("dateFrom", e.target.value)}
            className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm text-text-heading focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          />
        </div>

        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-medium text-text-muted">To Date</label>
          <input
            type="date"
            value={currentFilters.dateTo || ""}
            onChange={(e) => updateFilters("dateTo", e.target.value)}
            className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm text-text-heading focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-border-strong px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
