"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateTransaction, type ActionState } from "@/lib/actions";
import { TRANSACTION_CATEGORIES, TRANSACTION_TYPES } from "@/lib/validators";
import { parseReceiptPaths, serializeReceiptPaths } from "@/lib/receipts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Account, Transaction } from "@/db/schema";

type Receipt = { path: string; name: string };

const initialState: ActionState = { status: "idle", message: "" };

type EditTransactionFormProps = {
  transaction: Transaction;
  accounts: Account[];
};

export function EditTransactionForm({ transaction, accounts }: EditTransactionFormProps) {
  const updateWithId = updateTransaction.bind(null, transaction.id);
  const [state, formAction, isPending] = useActionState(updateWithId, initialState);
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>(() =>
    parseReceiptPaths(transaction.receiptPath).map((p) => ({ path: p, name: p }))
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      router.push(`/accounts/${transaction.accountId}`);
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.timestamp, state.status, state.message, router, transaction.accountId]);

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
    <form action={formAction} className="space-y-4">
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
            defaultValue={transaction.date}
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
          <input type="hidden" name="accountId" value={transaction.accountId} />
          <select
            id="accountId"
            aria-label="Account"
            required
            defaultValue={transaction.accountId}
            disabled
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none disabled:opacity-60"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.accountName}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-text-faint">Account cannot be changed after creation.</p>
        </div>

        <div>
          <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Transaction Type *
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue={transaction.type}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
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
            defaultValue={transaction.category}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          >
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
            defaultValue={transaction.amount}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
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
            defaultValue={transaction.description}
            className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
          />
          {state.errors?.description && (
            <p className="mt-1 text-xs text-accent-red">{state.errors.description[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={transaction.notes || ""}
          className="w-full rounded-lg border border-border-strong px-4 py-2.5 text-text-heading transition-colors focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
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
                <a
                  href={`/api/receipts/${r.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View
                </a>
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

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-alt"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || uploading}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-focus-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
