import { requireSuperAdmin } from "@/lib/auth";
import { getConstructionById, getConstructionUsers, getAllUsers } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { UserAssignment } from "./_components/UserAssignment";
import { EditConstructionForm } from "./_components/EditConstructionForm";
import { DeleteConstructionButton } from "./_components/DeleteConstructionButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ConstructionDetailPage({ params }: Props) {
  await requireSuperAdmin();

  const { id } = await params;
  const constructionId = parseInt(id);
  const construction = await getConstructionById(constructionId);

  if (!construction) notFound();

  const assignedUsers = await getConstructionUsers(constructionId);
  const allUsers = await getAllUsers();

  // Filter out already-assigned users and superadmins (they have implicit access)
  const availableUsers = allUsers.filter(
    (u) => u.role !== "superadmin" && !assignedUsers.some((au) => au.id === u.id)
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/constructions" className="text-sm text-primary hover:underline">
          &larr; Back to Constructions
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-text-heading">{construction.name}</h1>
        {construction.description && (
          <p className="text-sm text-text-muted">{construction.description}</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-heading">Edit Construction</h2>
        <EditConstructionForm construction={construction} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-heading">User Assignments</h2>
        <UserAssignment
          constructionId={constructionId}
          assignedUsers={assignedUsers}
          availableUsers={availableUsers}
        />
      </div>

      <div className="rounded-xl border border-accent-red/20 bg-surface p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-text-heading">Danger Zone</h2>
        <p className="mb-4 text-sm text-text-muted">
          Permanently delete this construction and all associated data (except transactions).
        </p>
        <DeleteConstructionButton id={constructionId} name={construction.name} />
      </div>
    </div>
  );
}
