import { requireOwner, getActiveConstructionId } from "@/lib/auth";
import {
  getWorkerById,
  getAllContractors,
  getAttendanceForWorkerInRange,
  getWorkerWageSummary,
  getWagePaymentsForWorker,
} from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditWorkerForm } from "./_components/EditWorkerForm";
import { DeleteWorkerButton } from "./_components/DeleteWorkerButton";
import { MonthCalendar } from "./_components/MonthCalendar";
import { AttendanceDayEditor } from "./_components/AttendanceDayEditor";
import { SummaryCard } from "@/components/SummaryCard";

export const dynamic = "force-dynamic";

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function WorkerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; month?: string; date?: string }>;
}) {
  await requireOwner();
  const constructionId = await getActiveConstructionId();
  const { id } = await params;
  const sp = await searchParams;

  const worker = await getWorkerById(Number(id), constructionId);
  if (!worker) notFound();

  const allContractors = await getAllContractors(constructionId);

  const today = new Date();
  const year = sp.year ? Number(sp.year) : today.getFullYear();
  const month = sp.month ? Number(sp.month) : today.getMonth() + 1;
  const selectedDate = sp.date || `${year}-${pad(month)}-${pad(today.getDate())}`;

  // Fetch attendance for the displayed month
  const monthStart = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`;
  const monthDays = await getAttendanceForWorkerInRange(worker.id, monthStart, monthEnd);

  const entriesMap = new Map<string, number>();
  const idMap = new Map<string, number>();
  const paidDates = new Set<string>();
  for (const d of monthDays) {
    entriesMap.set(d.date, d.units);
    idMap.set(d.date, d.id);
    if (d.paymentTransactionId !== null) paidDates.add(d.date);
  }

  // Wage summaries: this week, this month
  const monthSummary = await getWorkerWageSummary(worker.id, monthStart, monthEnd);

  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  const weekStartStr = `${weekStart.getFullYear()}-${pad(weekStart.getMonth() + 1)}-${pad(weekStart.getDate())}`;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekEndStr = `${weekEnd.getFullYear()}-${pad(weekEnd.getMonth() + 1)}-${pad(weekEnd.getDate())}`;
  const weekSummary = await getWorkerWageSummary(worker.id, weekStartStr, weekEndStr);

  // All-time wage payment history for this worker
  const paymentHistory = await getWagePaymentsForWorker(worker.id);
  const allTimeStart = "1970-01-01";
  const allTimeEnd = "2999-12-31";
  const allTimeSummary = await getWorkerWageSummary(worker.id, allTimeStart, allTimeEnd);

  const selectedUnits = entriesMap.get(selectedDate);
  const selectedAttendanceId = idMap.get(selectedDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/workers" className="text-text-muted hover:text-text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-heading">{worker.name}</h1>
          <p className="text-sm text-text-muted">
            {formatCurrency(worker.dailyWage)}/day
            {!worker.isActive && <span className="ml-2 text-accent-red">(Inactive)</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="This Week's Wage"
          value={formatCurrency(weekSummary.totalWage)}
          subtitle={`${weekSummary.totalUnits} day units`}
          variant="green"
          icon={
            <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <SummaryCard
          title="This Month's Wage"
          value={formatCurrency(monthSummary.totalWage)}
          subtitle={`${monthSummary.totalUnits} day units`}
          variant="default"
          icon={
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <SummaryCard
          title="Total Paid"
          value={formatCurrency(allTimeSummary.paidWage)}
          subtitle={`of ${formatCurrency(allTimeSummary.totalWage)} earned`}
          variant="green"
          icon={
            <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <SummaryCard
          title="Outstanding"
          value={formatCurrency(allTimeSummary.unpaidWage)}
          subtitle="Unpaid wages"
          variant={allTimeSummary.unpaidWage > 0 ? "red" : "default"}
          icon={
            <svg className="h-5 w-5 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <MonthCalendar workerId={worker.id} year={year} month={month} entries={entriesMap} paidDates={paidDates} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-text-heading">Mark Attendance</h2>
        <AttendanceDayEditor
          workerId={worker.id}
          date={selectedDate}
          defaultUnits={selectedUnits}
          defaultWage={worker.dailyWage}
          attendanceId={selectedAttendanceId}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-text-heading">Payment History</h2>
        {paymentHistory.length === 0 ? (
          <p className="text-sm text-text-muted">No payments recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {paymentHistory.map((p) => (
              <li
                key={p.transactionId}
                className="flex items-center justify-between rounded-lg border border-border/50 p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-text-primary">{p.date}</p>
                  <p className="text-xs text-text-muted">
                    {p.description} &middot; {p.attendanceCount} day(s)
                  </p>
                </div>
                <span className="font-semibold text-accent-green">
                  {formatCurrency(p.workerWage)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-heading">Edit Worker</h2>
        <EditWorkerForm worker={worker} contractors={allContractors} />
      </div>

      <div className="rounded-xl border border-accent-red/20 bg-surface p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-text-heading">Danger Zone</h2>
        <p className="mb-4 text-sm text-text-muted">
          Workers with attendance history will be deactivated; otherwise, they will be deleted permanently.
        </p>
        <DeleteWorkerButton id={worker.id} name={worker.name} />
      </div>
    </div>
  );
}
