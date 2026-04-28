import { requireOwner, getActiveConstructionId } from "@/lib/auth";
import { getAllWorkers, getAllContractors } from "@/lib/queries";
import { WorkerForm } from "./_components/WorkerForm";
import { WorkerList } from "./_components/WorkerList";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WorkersPage() {
  await requireOwner();
  const constructionId = await getActiveConstructionId();
  const allWorkers = await getAllWorkers(constructionId);
  const allContractors = await getAllContractors(constructionId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Workers</h1>
          <p className="text-sm text-text-muted">Daily-wage workers under each labour contract</p>
        </div>
        <Link
          href="/workers/attendance"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Mark Attendance
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-heading">Add New Worker</h2>
        <WorkerForm contractors={allContractors} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-heading">
          All Workers ({allWorkers.length})
        </h2>
        <WorkerList workers={allWorkers} />
      </div>
    </div>
  );
}
