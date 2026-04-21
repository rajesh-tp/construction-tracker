import { requireOwner, getActiveConstructionId } from "@/lib/auth";
import { getTransactionById, getAllAccounts } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditTransactionForm } from "./_components/EditTransactionForm";

export const dynamic = "force-dynamic";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwner();
  const constructionId = await getActiveConstructionId();
  const { id } = await params;
  const transaction = await getTransactionById(Number(id), constructionId);

  if (!transaction) {
    notFound();
  }

  const allAccounts = await getAllAccounts(constructionId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/accounts/${transaction.accountId}`} className="text-text-muted hover:text-text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Edit Transaction</h1>
          <p className="text-sm text-text-muted">Modify transaction details</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-5 shadow-sm">
        <EditTransactionForm transaction={transaction} accounts={allAccounts} />
      </div>
    </div>
  );
}
