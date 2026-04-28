import { requireOwner, getActiveConstructionId } from "@/lib/auth";
import {
  getWorkerById,
  getAllContractors,
  getAttendanceForWorkerInRange,
  getWorkerWageSummary,
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
  for (const d of monthDays) {
    entriesMap.set(d.date, d.units);
    idMap.set(d.date, d.id);
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          title="Daily Wage"
          value={formatCurrency(worker.dailyWage)}
          subtitle="Current rate"
          variant="amber"
          icon={
            <svg className="h-5 w-5 text-accent-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <MonthCalendar workerId={worker.id} year={year} month={month} entries={entriesMap} />
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
