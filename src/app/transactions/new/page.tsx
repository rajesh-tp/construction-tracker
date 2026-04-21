import { requireAuth, getActiveConstructionId } from "@/lib/auth";
import { getAllAccounts } from "@/lib/queries";
import { TransactionForm } from "./_components/TransactionForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string }>;
}) {
  await requireAuth();
  const constructionId = await getActiveConstructionId();
  const allAccounts = await getAllAccounts(constructionId);
  const { accountId } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/transactions" className="text-text-muted hover:text-text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Add Transaction</h1>
          <p className="text-sm text-text-muted">Record a new expense, payment, or adjustment</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-5 shadow-sm">
        <TransactionForm
          accounts={allAccounts}
          defaultAccountId={accountId ? Number(accountId) : undefined}
        />
      </div>
    </div>
  );
}
