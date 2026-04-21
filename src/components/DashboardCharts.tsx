"use client";

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
            {monthlyData.slice(-12).map((d) => (
              <div key={d.month} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text-secondary">{formatMonth(d.month)}</span>
                  <div className="flex gap-3">
                    <span className="text-accent-red">{formatCurrency(d.totalExpenses)}</span>
                    <span className="text-accent-green">{formatCurrency(d.totalPayments)}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div
                    className="h-3 rounded-sm bg-accent-red/80 transition-all"
                    style={{ width: `${(d.totalExpenses / maxMonthly) * 100}%`, minWidth: d.totalExpenses > 0 ? "4px" : "0" }}
                  />
                  <div
                    className="h-3 rounded-sm bg-accent-green/80 transition-all"
                    style={{ width: `${(d.totalPayments / maxMonthly) * 100}%`, minWidth: d.totalPayments > 0 ? "4px" : "0" }}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 border-t border-border pt-2 text-xs text-text-faint">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent-red/80" /> Expenses
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent-green/80" /> Payments
              </span>
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
              return (
                <div key={d.category} className="space-y-1">
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
