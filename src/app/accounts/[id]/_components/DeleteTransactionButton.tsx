"use client";

import { deleteTransaction } from "@/lib/actions";
import { toast } from "sonner";
import { useTransition, useState, useEffect, useCallback } from "react";

export function DeleteTransactionButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);

  const handleClose = useCallback(() => {
    if (!isPending) setShowModal(false);
  }, [isPending]);

  useEffect(() => {
    if (!showModal) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showModal, handleClose]);

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteTransaction(id);
      if (result.status === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setShowModal(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="text-accent-red disabled:opacity-50"
        title="Delete transaction"
      >
        {isPending ? (
          <span className="text-xs">...</span>
        ) : (
          <>
            <svg className="h-4 w-4 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden text-xs hover:underline md:inline">Delete</span>
          </>
        )}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleClose}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-red-bg">
                <svg className="h-5 w-5 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-heading">Delete Transaction</h3>
                <p className="text-sm text-text-muted">This action cannot be undone.</p>
              </div>
            </div>

            <p className="mb-6 text-sm text-text-secondary">
              Are you sure you want to delete this transaction? The account balance will be recalculated accordingly.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isPending}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-alt disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-lg bg-accent-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
