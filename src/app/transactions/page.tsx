import { requireAuth, getActiveConstructionId } from "@/lib/auth";
import { getAllAccounts, getFilteredTransactions, getFilteredTransactionCount, getAllContractors, getAccountByContractorId } from "@/lib/queries";
import Link from "next/link";
import { TransactionFilters } from "./_components/TransactionFilters";
import { Pagination } from "@/components/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    accountId?: string;
    contractorId?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}) {
  const user = await requireAuth();
  const constructionId = await getActiveConstructionId();
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page) || 1);

  // For contractors, force filter to their own account
  const isContractor = user.role === "contractor" && user.contractorId;
  let contractorAccountId: number | undefined;
  if (isContractor) {
    const contractorAccount = await getAccountByContractorId(user.contractorId!, constructionId);
    contractorAccountId = contractorAccount?.id;
  }

  const filters = {
    accountId: isContractor ? contractorAccountId : (params.accountId ? Number(params.accountId) : undefined),
    contractorId: params.contractorId ? Number(params.contractorId) : undefined,
    type: params.type || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
  };

  const totalCount = await getFilteredTransactionCount(constructionId, filters);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const txns = await getFilteredTransactions(constructionId, filters, { page: currentPage, pageSize: PAGE_SIZE });
  const allAccounts = await getAllAccounts(constructionId);
  const allContractors = await getAllContractors(constructionId);

  const accountMap = new Map(allAccounts.map((a) => [a.id, a]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Transactions</h1>
          <p className="text-sm text-text-muted">View and filter all transactions</p>
        </div>
        {user.role !== "contractor" && (
          <Link
            href="/transactions/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Add Transaction
          </Link>
        )}
      </div>

      {/* Filters - hidden for contractors */}
      {!isContractor && (
        <TransactionFilters
          accounts={allAccounts}
          contractors={allContractors}
          currentFilters={params}
        />
      )}

      {/* Transaction List */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-heading">
          Results ({totalCount} transaction{totalCount !== 1 ? "s" : ""})
        </h2>

        {txns.length === 0 ? (
          <p className="text-sm text-text-muted">No transactions found matching your filters.</p>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="space-y-3 md:hidden">
              {txns.map((txn) => {
                const account = accountMap.get(txn.accountId);
                return (
                  <div key={txn.id} className="rounded-lg border border-border/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-primary truncate">
                          {txn.description}
                          {txn.notes && (
                            <span className="ml-1 text-xs text-text-faint">({txn.notes})</span>
                          )}
                        </p>
                        <p className="text-xs text-text-muted">
                          {txn.date} &middot; {txn.category}
                        </p>
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
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      {account && (
                        <Link href={`/accounts/${account.id}`} className="text-primary hover:underline">
                          {account.accountName}
                        </Link>
                      )}
                      {txn.receiptPath && (
                        <a
                          href={`/api/receipts/${txn.receiptPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Receipt
                        </a>
                      )}
                      {txn.createdByName && (
                        <span className="text-text-faint">by {txn.createdByName}</span>
                      )}
                      {user.role !== "contractor" && (
                        <Link href={`/transactions/${txn.id}/edit`} className="ml-auto text-primary hover:underline">
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-text-muted">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Account</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                    <th className="pb-2 font-medium">Receipt</th>
                    <th className="pb-2 font-medium">Added by</th>
                    {user.role !== "contractor" && <th className="pb-2 font-medium"></th>}
                  </tr>
                </thead>
                <tbody>
                  {txns.map((txn) => {
                    const account = accountMap.get(txn.accountId);
                    return (
                      <tr key={txn.id} className="border-b border-border/50">
                        <td className="py-2.5 text-text-secondary">{txn.date}</td>
                        <td className="py-2.5 text-text-primary">
                          {txn.description}
                          {txn.notes && (
                            <span className="ml-1 text-xs text-text-faint">({txn.notes})</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          {account ? (
                            <Link
                              href={`/accounts/${account.id}`}
                              className="text-primary hover:underline"
                            >
                              {account.accountName}
                            </Link>
                          ) : (
                            <span className="text-text-muted">—</span>
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
                          {txn.receiptPath ? (
                            <a
                              href={`/api/receipts/${txn.receiptPath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-text-faint">—</span>
                          )}
                        </td>
                        <td className="py-2.5 text-xs text-text-faint">
                          {txn.createdByName || "—"}
                        </td>
                        {user.role !== "contractor" && (
                          <td className="py-2.5">
                            <Link
                              href={`/transactions/${txn.id}/edit`}
                              className="text-xs text-primary hover:underline"
                            >
                              Edit
                            </Link>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalCount} />
      </div>
    </div>
  );
}
