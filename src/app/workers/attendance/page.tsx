import { requireOwner, getActiveConstructionId } from "@/lib/auth";
import {
  getAllContractors,
  getActiveWorkersByContractor,
  getAttendanceForDate,
} from "@/lib/queries";
import { BulkAttendanceForm } from "./_components/BulkAttendanceForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function BulkAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; contractorId?: string }>;
}) {
  await requireOwner();
  const constructionId = await getActiveConstructionId();
  const sp = await searchParams;

  const date = sp.date || todayStr();
  const contractorId = sp.contractorId ? Number(sp.contractorId) : undefined;

  const allContractors = await getAllContractors(constructionId);

  let workers: { id: number; name: string; dailyWage: number }[] = [];
  let existing: Record<number, number> = {};
  if (contractorId) {
    const activeWorkers = await getActiveWorkersByContractor(contractorId, constructionId);
    workers = activeWorkers.map((w) => ({ id: w.id, name: w.name, dailyWage: w.dailyWage }));
    const dayRows = await getAttendanceForDate(constructionId, date, contractorId);
    for (const row of dayRows) existing[row.workerId] = row.units;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/workers" className="text-text-muted hover:text-text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Mark Attendance</h1>
          <p className="text-sm text-text-muted">Pick a date and contractor, then mark each worker</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <BulkAttendanceForm
          date={date}
          contractorId={contractorId}
          contractors={allContractors.map((c) => ({
            id: c.id,
            name: c.name,
            contractorType: c.contractorType,
          }))}
          workers={workers}
          existing={existing}
        />
      </div>
    </div>
  );
}
