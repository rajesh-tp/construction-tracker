"use client";

import Link from "next/link";

type MonthlyData = {
  month: string;
  totalExpenses: number;
  totalPayments: number;
};

type CategoryData = {
  category: string;
  total: number;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} ${year.slice(2)}`;
}

function monthRange(month: string): { from: string; to: string } {
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr);
  const m = parseInt(monthStr);
  const lastDay = new Date(year, m, 0).getDate();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return {
    from: `${year}-${pad(m)}-01`,
    to: `${year}-${pad(m)}-${pad(lastDay)}`,
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  "Material Purchase": "bg-blue-500",
  "Labour Payment": "bg-amber-500",
  "Contractor Payment": "bg-purple-500",
  "Transport": "bg-green-500",
  "Equipment Rental": "bg-cyan-500",
  "Permits & Fees": "bg-rose-500",
  "Utilities": "bg-orange-500",
  "Miscellaneous": "bg-slate-500",
};

export function DashboardCharts({
  monthlyData,
  categoryData,
}: {
  monthlyData: MonthlyData[];
  categoryData: CategoryData[];
}) {
  const maxMonthly = Math.max(...monthlyData.map((d) => Math.max(d.totalExpenses, d.totalPayments)), 1);
  const totalCategoryAmount = categoryData.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Monthly Expenses Chart */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-text-heading">Monthly Expenses & Payments</h3>
        {monthlyData.length === 0 ? (
          <p className="text-sm text-text-muted">No transaction data yet.</p>
        ) : (
          <div className="space-y-3">
            {monthlyData.slice(-12).map((d) => {
              const range = monthRange(d.month);
              const baseHref = `/transactions?dateFrom=${range.from}&dateTo=${range.to}`;
              return (
                <div key={d.month} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <Link
                      href={baseHref}
                      className="font-medium text-text-secondary hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-focus-ring rounded-sm"
                      aria-label={`View all ${formatMonth(d.month)} transactions`}
                    >
                      {formatMonth(d.month)}
                    </Link>
                    <div className="flex gap-3">
                      <Link
                        href={`${baseHref}&type=expense`}
                        className="text-accent-red hover:underline focus:outline-none focus:ring-2 focus:ring-focus-ring rounded-sm"
                        aria-label={`View ${formatMonth(d.month)} expenses`}
                      >
                        {formatCurrency(d.totalExpenses)}
                      </Link>
                      <Link
                        href={`${baseHref}&type=payment`}
                        className="text-accent-green hover:underline focus:outline-none focus:ring-2 focus:ring-focus-ring rounded-sm"
                        aria-label={`View ${formatMonth(d.month)} payments`}
                      >
                        {formatCurrency(d.totalPayments)}
                      </Link>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      href={`${baseHref}&type=expense`}
                      className="h-3 rounded-sm bg-accent-red/80 transition-all hover:bg-accent-red focus:outline-none focus:ring-2 focus:ring-focus-ring"
                      style={{ width: `${(d.totalExpenses / maxMonthly) * 100}%`, minWidth: d.totalExpenses > 0 ? "4px" : "0" }}
                      aria-label={`View ${formatMonth(d.month)} expenses`}
                    />
                    <Link
                      href={`${baseHref}&type=payment`}
                      className="h-3 rounded-sm bg-accent-green/80 transition-all hover:bg-accent-green focus:outline-none focus:ring-2 focus:ring-focus-ring"
                      style={{ width: `${(d.totalPayments / maxMonthly) * 100}%`, minWidth: d.totalPayments > 0 ? "4px" : "0" }}
                      aria-label={`View ${formatMonth(d.month)} payments`}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-4 border-t border-border pt-2 text-xs text-text-faint">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent-red/80" /> Expenses
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent-green/80" /> Payments
              </span>
              <span className="ml-auto text-text-faint">Click a month or amount to filter.</span>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-text-heading">Expense by Category</h3>
        {categoryData.length === 0 ? (
          <p className="text-sm text-text-muted">No expense data yet.</p>
        ) : (
          <div className="space-y-3">
            {categoryData.map((d) => {
              const pct = totalCategoryAmount > 0 ? (d.total / totalCategoryAmount) * 100 : 0;
              const colorClass = CATEGORY_COLORS[d.category] || "bg-slate-400";
              const href = `/transactions?type=expense&category=${encodeURIComponent(d.category)}`;
              return (
                <Link
                  key={d.category}
                  href={href}
                  className="block space-y-1 rounded-md p-1 -m-1 transition-colors hover:bg-surface-alt focus:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  aria-label={`View ${d.category} expenses`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary">{d.category}</span>
                    <span className="text-text-muted">
                      {formatCurrency(d.total)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-sm bg-surface-alt">
                    <div
                      className={`h-3 rounded-sm ${colorClass} transition-all`}
                      style={{ width: `${pct}%`, minWidth: pct > 0 ? "4px" : "0" }}
                    />
                  </div>
                </Link>
              );
            })}
            <p className="border-t border-border pt-2 text-xs text-text-faint">
              Click a category to view its expense transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
