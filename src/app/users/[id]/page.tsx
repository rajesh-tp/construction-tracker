import { requireSuperAdmin } from "@/lib/auth";
import { getUserById, getAllContractorsGlobal, getAllConstructions } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditUserForm } from "./_components/EditUserForm";
import { DeleteUserButton } from "./_components/DeleteUserButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditUserPage({ params }: Props) {
  await requireSuperAdmin();

  const { id } = await params;
  const user = await getUserById(Number(id));

  if (!user) notFound();

  const contractors = await getAllContractorsGlobal();
  const constructions = await getAllConstructions();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/users" className="text-sm text-primary hover:underline">
          &larr; Back to Users
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-text-heading">Edit User</h1>
        <p className="text-sm text-text-muted">{user.email}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <EditUserForm
          user={user}
          contractors={contractors}
          constructions={constructions.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>

      <div className="rounded-xl border border-accent-red/20 bg-surface p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-text-heading">Danger Zone</h2>
        <p className="mb-4 text-sm text-text-muted">
          Permanently delete this user and remove all construction assignments.
        </p>
        <DeleteUserButton id={user.id} name={user.name} />
      </div>
    </div>
  );
}
