import { requireAuth, getActiveConstructionId } from "@/lib/auth";
import { getAccountById, getTransactionsByAccountId, getConstructionOwnerName } from "@/lib/queries";
import { parseReceiptPaths } from "@/lib/receipts";
import { SummaryCard } from "@/components/SummaryCard";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DeleteTransactionButton } from "./_components/DeleteTransactionButton";
import { EditBalanceForm } from "./_components/EditBalanceForm";

export const dynamic = "force-dynamic";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const constructionId = await getActiveConstructionId();
  const { id } = await params;
  const account = await getAccountById(Number(id), constructionId);

  if (!account) {
    notFound();
  }

  const ownerName = await getConstructionOwnerName(constructionId);
  const txns = await getTransactionsByAccountId(account.id, constructionId);

  const displayName = account.accountType === "primary"
    ? `${ownerName ?? "Owner"}'s Account`
    : account.accountName;

  const totalExpenses = txns
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPayments = txns
    .filter((t) => t.type === "payment")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/accounts" className="text-text-muted hover:text-text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-heading">{displayName}</h1>
          <p className="text-sm text-text-muted capitalize">{account.accountType} account</p>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Current Balance"
          value={formatCurrency(account.currentBalance)}
          variant={account.currentBalance >= 0 ? "green" : "red"}
          icon={
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <div>
          <SummaryCard
            title="Initial Balance"
            value={formatCurrency(account.initialBalance)}
            variant="default"
            icon={
              <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          {(user.role === "owner" || user.role === "superadmin") && (
            <div className="mt-2 px-1">
              <EditBalanceForm accountId={account.id} currentInitialBalance={account.initialBalance} />
            </div>
          )}
        </div>
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          variant="red"
          icon={
            <svg className="h-5 w-5 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          }
        />
        <SummaryCard
          title="Total Payments"
          value={formatCurrency(totalPayments)}
          variant="green"
          icon={
            <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Transactions */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-heading">
            Transactions ({txns.length})
          </h2>
          <Link
            href={`/transactions/new?accountId=${account.id}`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Add Transaction
          </Link>
        </div>

        {txns.length === 0 ? (
          <p className="text-sm text-text-muted">No transactions for this account yet.</p>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="space-y-3 md:hidden">
              {txns.map((txn) => (
                <div key={txn.id} className="rounded-lg border border-border/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary truncate">
                        {txn.description}
                        {txn.notes && (
                          <span className="ml-1 text-xs text-text-faint">({txn.notes})</span>
                        )}
                      </p>
                      <p className="text-xs text-text-muted">{txn.date} &middot; {txn.category}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-sm font-semibold ${
                        txn.type === "expense" ? "text-accent-red" : "text-accent-green"
                      }`}>
                        {txn.type === "expense" ? "-" : "+"}{formatCurrency(txn.amount)}
                      </span>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          txn.type === "expense"
                            ? "bg-accent-red-bg text-accent-red"
                            : txn.type === "payment"
                              ? "bg-accent-green-bg text-accent-green"
                              : "bg-accent-amber-bg text-accent-amber"
                        }`}
                      >
                        {txn.type}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {parseReceiptPaths(txn.receiptPath).map((path, i, arr) => (
                      <a
                        key={path}
                        href={`/api/receipts/${path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {arr.length > 1 ? `Receipt ${i + 1}` : "Receipt"}
                      </a>
                    ))}
                    {txn.createdByName && (
                      <span className="text-text-faint">by {txn.createdByName}</span>
                    )}
                    {(user.role === "superadmin" || user.role === "owner") && (
                      <div className="ml-auto flex items-center gap-2">
                        <Link href={`/transactions/${txn.id}/edit`} className="text-primary hover:underline">
                          Edit
                        </Link>
                        {user.role === "superadmin" && (
                          <DeleteTransactionButton id={txn.id} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-text-muted">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                    <th className="pb-2 font-medium">Receipt</th>
                    <th className="pb-2 font-medium">Added by</th>
                    {(user.role === "superadmin" || user.role === "owner") && <th className="pb-2 font-medium"></th>}
                  </tr>
                </thead>
                <tbody>
                  {txns.map((txn) => (
                    <tr key={txn.id} className="border-b border-border/50">
                      <td className="py-2.5 text-text-secondary">{txn.date}</td>
                      <td className="py-2.5 text-text-primary">
                        {txn.description}
                        {txn.notes && (
                          <span className="ml-1 text-xs text-text-faint">({txn.notes})</span>
                        )}
                      </td>
                      <td className="py-2.5 text-text-secondary">{txn.category}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            txn.type === "expense"
                              ? "bg-accent-red-bg text-accent-red"
                              : txn.type === "payment"
                                ? "bg-accent-green-bg text-accent-green"
                                : "bg-accent-amber-bg text-accent-amber"
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 text-right font-medium ${
                          txn.type === "expense" ? "text-accent-red" : "text-accent-green"
                        }`}
                      >
                        {txn.type === "expense" ? "-" : "+"}
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="py-2.5">
                        {(() => {
                          const paths = parseReceiptPaths(txn.receiptPath);
                          if (paths.length === 0) return <span className="text-xs text-text-faint">—</span>;
                          return (
                            <div className="flex flex-col gap-0.5">
                              {paths.map((path, i) => (
                                <a
                                  key={path}
                                  href={`/api/receipts/${path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                  </svg>
                                  {paths.length > 1 ? `View ${i + 1}` : "View"}
                                </a>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2.5 text-xs text-text-faint">
                        {txn.createdByName || "—"}
                      </td>
                      {(user.role === "superadmin" || user.role === "owner") && (
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/transactions/${txn.id}/edit`}
                              className="text-xs text-primary hover:underline"
                            >
                              Edit
                            </Link>
                            {user.role === "superadmin" && (
                              <DeleteTransactionButton id={txn.id} />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
