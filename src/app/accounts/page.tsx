import { requireAuth, getActiveConstructionId } from "@/lib/auth";
import { getAllAccounts, getAllContractors, getConstructionOwnerName } from "@/lib/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AccountsPage() {
  await requireAuth();
  const constructionId = await getActiveConstructionId();
  const ownerName = await getConstructionOwnerName(constructionId);
  const allAccounts = await getAllAccounts(constructionId);
  const allContractors = await getAllContractors(constructionId);

  const contractorMap = new Map(allContractors.map((c) => [c.id, c]));
  const ownerLabel = ownerName ?? "Owner";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Accounts</h1>
        <p className="text-sm text-text-muted">Overview of all financial accounts</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allAccounts.map((account) => {
          const contractor = account.contractorId
            ? contractorMap.get(account.contractorId)
            : null;

          return (
            <Link
              key={account.id}
              href={`/accounts/${account.id}`}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-text-heading">
                    {account.accountType === "primary" ? `${ownerLabel}'s Account` : account.accountName}
                  </h3>
                  <p className="text-xs text-text-muted capitalize">
                    {account.accountType}
                    {contractor ? ` — ${contractor.contractorType}` : ""}
                  </p>
                </div>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    account.accountType === "primary"
                      ? "bg-blue-50 text-primary"
                      : "bg-accent-amber-bg text-accent-amber"
                  }`}
                >
                  {account.accountType === "primary" ? "Owner" : "Contractor"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Current Balance</span>
                  <span
                    className={`font-semibold ${
                      account.currentBalance >= 0 ? "text-accent-green" : "text-accent-red"
                    }`}
                  >
                    {formatCurrency(account.currentBalance)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Initial Balance</span>
                  <span className="text-text-secondary">
                    {formatCurrency(account.initialBalance)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {allAccounts.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
          <p className="text-text-muted">No accounts yet.</p>
          <p className="mt-1 text-sm text-text-faint">
            <Link href="/contractors" className="text-primary hover:underline">
              Add a contractor
            </Link>{" "}
            to automatically create an account.
          </p>
        </div>
      )}
    </div>
  );
}
