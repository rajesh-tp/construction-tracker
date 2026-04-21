import { requireSuperAdmin } from "@/lib/auth";
import { getAllContractorsGlobal, getAllConstructions } from "@/lib/queries";
import { CreateUserForm } from "./_components/CreateUserForm";
import Link from "next/link";

export default async function NewUserPage() {
  await requireSuperAdmin();
  const contractors = await getAllContractorsGlobal();
  const constructions = await getAllConstructions();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/users" className="text-sm text-primary hover:underline">
          &larr; Back to Users
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-text-heading">New User</h1>
        <p className="text-sm text-text-muted">Create a new user account</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <CreateUserForm
          contractors={contractors}
          constructions={constructions.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </div>
  );
}
