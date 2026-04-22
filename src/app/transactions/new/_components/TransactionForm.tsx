"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createTransaction, type ActionState } from "@/lib/actions";
import { TRANSACTION_CATEGORIES, TRANSACTION_TYPES } from "@/lib/validators";
import { serializeReceiptPaths } from "@/lib/receipts";
import { toast } from "sonner";
import type { Account } from "@/db/schema";

type Receipt = { path: string; name: string };

const initialState: ActionState = { status: "idle", message: "" };

type TransactionFormProps = {
  accounts: Account[];
  defaultAccountId?: number;
};

export function TransactionForm({ accounts, defaultAccountId }: TransactionFormProps) {
  const [state, formAction, isPending] = useActionState(createTransaction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(defaultAccountId);
  const [selectedType, setSelectedType] = useState<string>("");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const isDoubleEntry = selectedType === "payment" && selectedAccount?.accountType === "contractor";

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
      setReceipts([]);
      setSelectedType("");
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message]);

  const today = new Date().toISOString().split("T")[0];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: too large (max 5MB)`);
          continue;
        }
        const formData = new FormData();
        formData.append("receipt", file);
        const res = await fetch("/api/receipts/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          toast.error(`${file.name}: ${data.error || "upload failed"}`);
          continue;
        }
        setReceipts((prev) => [...prev, { path: data.filename, name: file.name }]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeReceipt(path: string) {
    setReceipts((prev) => prev.filter((r) => r.path !== path));
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="receiptPath" value={serializeReceiptPaths(receipts.map((r) => r.path)) || ""} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            defaultValue={today}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          />
          {state.errors?.date && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.date[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="accountId" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Account *
          </label>
          <select
            id="accountId"
            name="accountId"
            required
            defaultValue={defaultAccountId || ""}
            onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            <option value="">Select account...</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.accountName}
              </option>
            ))}
          </select>
          {state.errors?.accountId && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.accountId[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Transaction Type *
          </label>
          <select
            id="type"
            name="type"
            required
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            <option value="">Select type...</option>
            {TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          {state.errors?.type && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.type[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Category *
          </label>
          <select
            id="category"
            name="category"
            required
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
            <option value="">Select category...</option>
            {TRANSACTION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {state.errors?.category && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.category[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Amount (INR) *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            required
            min="0.01"
            step="0.01"
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            placeholder="e.g., 5000"
          />
          {state.errors?.amount && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.amount[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Description *
          </label>
          <input
            type="text"
            id="description"
            name="description"
            required
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
            placeholder="e.g., Cement bags purchase"
          />
          {state.errors?.description && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.description[0]}</p>
          )}
        </div>
      </div>

      {isDoubleEntry && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          This payment will be deducted from the Owner&apos;s primary account.
        </div>
      )}

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          placeholder="Any additional notes..."
        />
      </div>

      {/* Receipt Upload */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Receipts / Attachments (optional)
        </label>
        {receipts.length > 0 && (
          <ul className="mb-2 space-y-2">
            {receipts.map((r) => (
              <li key={r.path} className="flex items-center gap-3 rounded-lg border border-border bg-surface-alt px-4 py-2.5">
                <svg className="h-5 w-5 shrink-0 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="flex-1 truncate text-sm text-text-primary">{r.name}</span>
                <button
                  type="button"
                  onClick={() => removeReceipt(r.path)}
                  className="text-xs text-accent-red hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={fileInputRef}
          type="file"
          id="receipt"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="w-full rounded-lg border border-border-strong px-4 py-2 text-sm text-text-heading file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-sm file:text-white file:cursor-pointer"
        />
        {uploading && (
          <p className="mt-1 text-xs text-text-muted">Uploading...</p>
        )}
        <p className="mt-1 text-xs text-text-faint">JPG, PNG, WebP, or PDF. Max 5MB each. Select multiple files at once.</p>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || uploading}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-focus-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Add Transaction"}
        </button>
      </div>
    </form>
  );
}
