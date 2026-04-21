import { requireOwner, getActiveConstructionId } from "@/lib/auth";
import { getAllContractors } from "@/lib/queries";
import { ContractorForm } from "@/components/ContractorForm";
import { ContractorList } from "./_components/ContractorList";

export const dynamic = "force-dynamic";

export default async function ContractorsPage() {
  await requireOwner();
  const constructionId = await getActiveConstructionId();
  const contractorList = await getAllContractors(constructionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Contractors</h1>
        <p className="text-sm text-text-muted">Manage your construction contractors</p>
      </div>

      {/* Add Contractor Form */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-heading">Add New Contractor</h2>
        <ContractorForm />
      </div>

      {/* Contractor List */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-heading">
          All Contractors ({contractorList.length})
        </h2>
        <ContractorList contractors={contractorList} />
      </div>
    </div>
  );
}
