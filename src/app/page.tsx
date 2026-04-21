import { requireAuth, getActiveConstructionId } from "@/lib/auth";
import { getProjectSummary, getAccountSummaries, getRecentTransactions, getContractorDashboard, getMonthlyExpenses, getCategoryBreakdown, getConstructionOwnerName } from "@/lib/queries";
import { SummaryCard } from "@/components/SummaryCard";
import { DashboardCharts } from "@/components/DashboardCharts";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const constructionId = await getActiveConstructionId();

  // Contractor-specific dashboard
  if (user.role === "contractor" && user.contractorId) {
    const data = await getContractorDashboard(user.contractorId, constructionId);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Dashboard</h1>
          <p className="text-sm text-text-muted">
            Welcome back, {user.name}. Here&apos;s your account overview.
          </p>
        </div>

        {!data.account ? (
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-sm text-text-muted">No account found for your contractor profile.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCard
                title="Account Balance"
                value={formatCurrency(data.account.currentBalance)}
                subtitle={`Initial: ${formatCurrency(data.account.initialBalance)}`}
                variant="default"
                icon={
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                }
              />
              <SummaryCard
                title="Total Expenses"
                value={formatCurrency(data.totalExpenses)}
                variant="red"
                icon={
                  <svg className="h-5 w-5 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                }
              />
              <SummaryCard
                title="Total Payments"
                value={formatCurrency(data.totalPayments)}
                variant="green"
                icon={
                  <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Recent Transactions */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-heading">Recent Transactions</h2>
                <Link href="/transactions" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              {data.recentTransactions.length === 0 ? (
                <p className="text-sm text-text-muted">No transactions yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentTransactions.map((txn) => (
                    <div key={txn.id} className="rounded-lg border border-border/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-text-primary truncate">{txn.description}</p>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Owner/Superadmin dashboard
  const ownerName = await getConstructionOwnerName(constructionId);
  const ownerLabel = ownerName ?? "Owner";
  const summary = await getProjectSummary(constructionId);
  const accountSummaries = await getAccountSummaries(constructionId);
  const recentTransactions = await getRecentTransactions(constructionId, 5);
  const monthlyData = await getMonthlyExpenses(constructionId);
  const categoryData = await getCategoryBreakdown(constructionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Dashboard</h1>
        <p className="text-sm text-text-muted">
          Welcome back, {user.name}. Here&apos;s your project overview.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title={ownerName ? `Owner (${ownerName}) — Balance` : "Owner — Balance"}
          value={formatCurrency(summary.ownerBalance)}
          subtitle={`Initial: ${formatCurrency(summary.ownerInitialBalance)}`}
          variant="default"
          icon={
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(summary.totalExpenses)}
          variant="red"
          icon={
            <svg className="h-5 w-5 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          }
        />
        <SummaryCard
          title="Total Payments"
          value={formatCurrency(summary.totalPayments)}
          variant="green"
          icon={
            <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <SummaryCard
          title="Transactions"
          value={String(summary.totalTransactions)}
          variant="amber"
          icon={
            <svg className="h-5 w-5 text-accent-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <DashboardCharts monthlyData={monthlyData} categoryData={categoryData} />

      {/* Account Balances */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-heading">Account Balances</h2>
          <Link href="/accounts" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        {accountSummaries.length === 0 ? (
          <p className="text-sm text-text-muted">No accounts yet. Add a contractor to get started.</p>
        ) : (
          <div className="space-y-3">
            {accountSummaries.map((account) => (
              <Link
                key={account.id}
                href={`/accounts/${account.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-surface-alt"
              >
                <div>
                  <p className="font-medium text-text-primary">
                    {account.accountType === "primary" ? `${ownerLabel}'s Account` : account.accountName}
                  </p>
                  <p className="text-xs text-text-muted capitalize">{account.accountType}</p>
                </div>
                <p className={`font-semibold ${account.currentBalance >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {formatCurrency(account.currentBalance)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-heading">Recent Transactions</h2>
          <Link href="/transactions" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-text-muted">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((txn) => (
              <div key={txn.id} className="rounded-lg border border-border/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary truncate">{txn.description}</p>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
