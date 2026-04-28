import { requireOwner, getActiveConstructionId } from "@/lib/auth";
import { getAllContractors, getUnpaidAttendanceByContractor } from "@/lib/queries";
import { PayWagesForm } from "./_components/PayWagesForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PayWagesPage({
  searchParams,
}: {
  searchParams: Promise<{ contractorId?: string }>;
}) {
  await requireOwner();
  const constructionId = await getActiveConstructionId();
  const sp = await searchParams;

  const contractorId = sp.contractorId ? Number(sp.contractorId) : undefined;
  const allContractors = await getAllContractors(constructionId);

  const groups = contractorId
    ? await getUnpaidAttendanceByContractor(contractorId, constructionId)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/workers" className="text-text-muted hover:text-text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Pay Wages</h1>
          <p className="text-sm text-text-muted">
            Pay a contractor for the unpaid attendance of their workers. The amount is deducted from the owner&apos;s account.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <PayWagesForm
          contractorId={contractorId}
          contractors={allContractors.map((c) => ({
            id: c.id,
            name: c.name,
            contractorType: c.contractorType,
          }))}
          groups={groups}
        />
      </div>
    </div>
  );
}
