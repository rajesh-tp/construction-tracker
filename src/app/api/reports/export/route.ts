import { getSessionPayload, getActiveConstructionId } from "@/lib/auth";
import { getFilteredTransactions, getAllAccounts, getAllContractors } from "@/lib/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let constructionId: number;
  try {
    constructionId = await getActiveConstructionId();
  } catch {
    return NextResponse.json({ error: "No active construction" }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const filters = {
    accountId: searchParams.get("accountId") ? Number(searchParams.get("accountId")) : undefined,
    contractorId: searchParams.get("contractorId") ? Number(searchParams.get("contractorId")) : undefined,
    type: searchParams.get("type") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
  };

  const txns = await getFilteredTransactions(constructionId, filters);
  const allAccounts = await getAllAccounts(constructionId);
  const allContractors = await getAllContractors(constructionId);

  const accountMap = new Map(allAccounts.map((a) => [a.id, a.accountName]));
  const contractorMap = new Map(allContractors.map((c) => [c.id, c.name]));

  // Build CSV
  const headers = ["Date", "Description", "Account", "Contractor", "Category", "Type", "Amount", "Notes"];
  const rows = txns.map((txn) => [
    txn.date,
    `"${(txn.description || "").replace(/"/g, '""')}"`,
    `"${(accountMap.get(txn.accountId) || "").replace(/"/g, '""')}"`,
    `"${(contractorMap.get(txn.contractorId ?? 0) || "—").replace(/"/g, '""')}"`,
    txn.category,
    txn.type,
    txn.amount.toString(),
    `"${(txn.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
