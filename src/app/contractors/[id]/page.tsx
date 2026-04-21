import { requireOwner, getActiveConstructionId, getSessionPayload } from "@/lib/auth";
import { getContractorById } from "@/lib/queries";
import { notFound } from "next/navigation";
import { EditContractorForm } from "./_components/EditContractorForm";
import { DeleteContractorButton } from "./_components/DeleteContractorButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditContractorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwner();
  const session = await getSessionPayload();
  const constructionId = await getActiveConstructionId();
  const { id } = await params;
  const contractor = await getContractorById(Number(id), constructionId);

  if (!contractor) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/contractors" className="text-text-muted hover:text-text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Edit Contractor</h1>
          <p className="text-sm text-text-muted">{contractor.name}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <EditContractorForm contractor={contractor} />
      </div>

      {session?.role === "superadmin" && (
        <div className="rounded-xl border border-accent-red/20 bg-surface p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-text-heading">Danger Zone</h2>
          <p className="mb-4 text-sm text-text-muted">
            Permanently delete this contractor and their account. Contractors with transactions cannot be deleted.
          </p>
          <DeleteContractorButton id={contractor.id} name={contractor.name} />
        </div>
      )}
    </div>
  );
}
