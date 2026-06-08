import { requireOwner, getActiveConstructionId } from "@/lib/auth";
import { getWorkerById, getWorkerWageSummary, getWagePaymentsForWorker } from "@/lib/queries";
import { ATTENDANCE_UNIT_LABELS } from "@/lib/validators";
import { SummaryCard } from "@/components/SummaryCard";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ALL_TIME_START = "1970-01-01";
const ALL_TIME_END = "2999-12-31";

type Status = "all" | "paid" | "unpaid";

function parseStatus(raw: string | undefined): Status {
  return raw === "paid" || raw === "unpaid" ? raw : "all";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function unitsLabel(units: number): string {
  return ATTENDANCE_UNIT_LABELS[String(units)] ?? String(units);
}

export default async function WorkerWagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  await requireOwner();
  const constructionId = await getActiveConstructionId();
  const { id } = await params;
  const sp = await searchParams;
  const status = parseStatus(sp.status);

  const worker = await getWorkerById(Number(id), constructionId);
  if (!worker) notFound();

  const summary = await getWorkerWageSummary(worker.id, ALL_TIME_START, ALL_TIME_END);
  const payments = await getWagePaymentsForWorker(worker.id);

  const allDays = [...summary.days].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const filteredDays = allDays.filter((d) => {
    if (status === "paid") return d.paymentTransactionId !== null;
    if (status === "unpaid") return d.paymentTransactionId === null;
    return true;
  });

  const tabs: { label: string; value: Status }[] = [
    { label: "All", value: "all" },
    { label: "Paid", value: "paid" },
    { label: "Unpaid", value: "unpaid" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/workers/${worker.id}`} className="text-text-muted hover:text-text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-heading">{worker.name} — Wage Days</h1>
          <p className="text-sm text-text-muted">
            Per-day attendance with payment status
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Days Worked"
          value={String(summary.daysWorked)}
          subtitle={`${summary.totalUnits} day units`}
          variant="default"
          icon={
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <SummaryCard
          title="Total Paid"
          value={formatCurrency(summary.paidWage)}
          subtitle={`of ${formatCurrency(summary.totalWage)} earned`}
          variant="green"
          icon={
            <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <SummaryCard
          title="Outstanding"
          value={formatCurrency(summary.unpaidWage)}
          subtitle="Unpaid wages"
          variant={summary.unpaidWage > 0 ? "red" : "default"}
          icon={
            <svg className="h-5 w-5 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {tabs.map((t) => {
              const active = status === t.value;
              return (
                <Link
                  key={t.value}
                  href={`/workers/${worker.id}/wages?status=${t.value}`}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-surface-alt"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
          <p className="text-xs text-text-muted">
            {filteredDays.length} {filteredDays.length === 1 ? "day" : "days"}
          </p>
        </div>

        {filteredDays.length === 0 ? (
          <p className="text-sm text-text-muted">No matching days.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filteredDays.map((d) => {
                const dailyTotal = d.units * d.wageSnapshot;
                const isPaid = d.paymentTransactionId !== null;
                return (
                  <div key={d.id} className="rounded-lg border border-border/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-primary">{d.date}</p>
                        <p className="text-xs text-text-muted">
                          {unitsLabel(d.units)} · {formatCurrency(d.wageSnapshot)}/day
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-sm font-semibold text-text-heading">
                          {formatCurrency(dailyTotal)}
                        </span>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            isPaid
                              ? "bg-accent-green-bg text-accent-green"
                              : "bg-accent-red-bg text-accent-red"
                          }`}
                        >
                          {isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>
                    {d.notes && (
                      <p className="mt-2 text-xs text-text-faint italic">{d.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-text-muted">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Units</th>
                    <th className="pb-2 text-right font-medium">Daily Wage</th>
                    <th className="pb-2 text-right font-medium">Daily Total</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDays.map((d) => {
                    const dailyTotal = d.units * d.wageSnapshot;
                    const isPaid = d.paymentTransactionId !== null;
                    return (
                      <tr key={d.id} className="border-b border-border/50">
                        <td className="py-2.5 font-medium text-text-primary">{d.date}</td>
                        <td className="py-2.5 text-text-secondary">{unitsLabel(d.units)}</td>
                        <td className="py-2.5 text-right text-text-secondary">
                          {formatCurrency(d.wageSnapshot)}
                        </td>
                        <td className="py-2.5 text-right font-medium text-text-heading">
                          {formatCurrency(dailyTotal)}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              isPaid
                                ? "bg-accent-green-bg text-accent-green"
                                : "bg-accent-red-bg text-accent-red"
                            }`}
                          >
                            {isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-text-faint">{d.notes || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-text-heading">Wage Payments</h2>
        <p className="mb-3 text-xs text-text-muted">
          Payments that covered this worker&apos;s attendance. Advance (if any) is paid to the
          contractor at the payment level, not allocated per day.
        </p>
        {payments.length === 0 ? (
          <p className="text-sm text-text-muted">No payments recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {payments.map((p) => (
              <li
                key={p.transactionId}
                className="flex items-center justify-between rounded-lg border border-border/50 p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-text-primary">{p.date}</p>
                  <p className="text-xs text-text-muted">
                    {p.description} &middot; {p.attendanceCount} day(s) for this worker
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-text-heading">
                    {formatCurrency(p.amount)}
                  </span>
                  {p.extraAmount > 0 && (
                    <p className="text-xs text-accent-amber">
                      incl. {formatCurrency(p.extraAmount)} advance
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
