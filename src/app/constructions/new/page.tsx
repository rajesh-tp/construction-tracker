import { requireSuperAdmin } from "@/lib/auth";
import { ConstructionForm } from "./_components/ConstructionForm";
import Link from "next/link";

export default async function NewConstructionPage() {
  await requireSuperAdmin();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/constructions" className="text-sm text-primary hover:underline">
          &larr; Back to Constructions
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-text-heading">New Construction</h1>
        <p className="text-sm text-text-muted">
          Create a new construction project. A primary owner account will be automatically created.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <ConstructionForm />
      </div>
    </div>
  );
}
