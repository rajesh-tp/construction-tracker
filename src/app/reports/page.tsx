import { requireAuth, getActiveConstructionId } from "@/lib/auth";
import { getProjectSummary, getAllContractors, getAccountSummaries } from "@/lib/queries";
import { SummaryCard } from "@/components/SummaryCard";

export const dynamic = "force-dynamic";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ReportsPage() {
  await requireAuth();
  const constructionId = await getActiveConstructionId();
  const summary = await getProjectSummary(constructionId);
  const contractors = await getAllContractors(constructionId);
  const accountSummaries = await getAccountSummaries(constructionId);

  const contractorAccounts = accountSummaries.filter((a) => a.accountType === "contractor");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Reports</h1>
          <p className="text-sm text-text-muted">Project financial overview and contractor reports</p>
        </div>
        <a
          href="/api/reports/export"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </a>
      </div>

      {/* Project Summary */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-heading">Project Summary</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Initial Budget"
            value={formatCurrency(summary.ownerInitialBalance)}
            variant="default"
            icon={
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <SummaryCard
            title="Total Spent"
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
            title="Remaining Funds"
            value={formatCurrency(summary.ownerBalance)}
            variant={summary.ownerBalance >= 0 ? "green" : "red"}
            icon={
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Contractor Reports */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-heading">Contractor Summary</h2>
        {contractorAccounts.length === 0 ? (
          <p className="text-sm text-text-muted">No contractor accounts yet.</p>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="space-y-3 md:hidden">
              {contractorAccounts.map((account) => {
                const contractor = contractors.find((c) => c.id === account.contractorId);
                const netChange = account.currentBalance - account.initialBalance;
                return (
                  <div key={account.id} className="rounded-lg border border-border/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-primary">{account.accountName}</p>
                        <p className="text-xs text-text-muted">{contractor?.contractorType || "—"}</p>
                      </div>
                      <span className={`text-sm font-semibold shrink-0 ${
                        account.currentBalance >= 0 ? "text-accent-green" : "text-accent-red"
                      }`}>
                        {formatCurrency(account.currentBalance)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
                      <span>Initial: {formatCurrency(account.initialBalance)}</span>
                      <span className={`font-medium ${netChange >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                        Net: {netChange >= 0 ? "+" : ""}{formatCurrency(netChange)}
                      </span>
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
                    <th className="pb-2 font-medium">Contractor</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 text-right font-medium">Initial Balance</th>
                    <th className="pb-2 text-right font-medium">Current Balance</th>
                    <th className="pb-2 text-right font-medium">Net Change</th>
                  </tr>
                </thead>
                <tbody>
                  {contractorAccounts.map((account) => {
                    const contractor = contractors.find((c) => c.id === account.contractorId);
                    const netChange = account.currentBalance - account.initialBalance;
                    return (
                      <tr key={account.id} className="border-b border-border/50">
                        <td className="py-2.5 font-medium text-text-primary">
                          {account.accountName}
                        </td>
                        <td className="py-2.5 text-text-secondary">
                          {contractor?.contractorType || "—"}
                        </td>
                        <td className="py-2.5 text-right text-text-secondary">
                          {formatCurrency(account.initialBalance)}
                        </td>
                        <td
                          className={`py-2.5 text-right font-medium ${
                            account.currentBalance >= 0 ? "text-accent-green" : "text-accent-red"
                          }`}
                        >
                          {formatCurrency(account.currentBalance)}
                        </td>
                        <td
                          className={`py-2.5 text-right font-medium ${
                            netChange >= 0 ? "text-accent-green" : "text-accent-red"
                          }`}
                        >
                          {netChange >= 0 ? "+" : ""}
                          {formatCurrency(netChange)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
