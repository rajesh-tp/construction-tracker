import { requireSuperAdmin } from "@/lib/auth";
import { getAllUsers, getUserConstructionNames } from "@/lib/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireSuperAdmin();
  const allUsers = await getAllUsers();
  const constructionMap = await getUserConstructionNames();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Users</h1>
          <p className="text-sm text-text-muted">Manage all user accounts</p>
        </div>
        <Link
          href="/users/new"
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          + New User
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        {allUsers.length === 0 ? (
          <p className="text-sm text-text-muted">No users found.</p>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="space-y-3 md:hidden">
              {allUsers.map((u) => {
                const constructions = constructionMap.get(u.id);
                return (
                  <Link key={u.id} href={`/users/${u.id}`} className="block rounded-lg border border-border/50 p-3 transition-colors hover:bg-surface-alt">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-primary">{u.name}</p>
                        <p className="text-xs text-text-muted truncate">{u.email}</p>
                      </div>
                      <span
                        className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          u.role === "superadmin"
                            ? "bg-purple-50 text-purple-700"
                            : u.role === "owner"
                              ? "bg-blue-50 text-primary"
                              : "bg-accent-amber-bg text-accent-amber"
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                      {u.role === "superadmin" ? (
                        <span className="text-text-faint italic">All constructions</span>
                      ) : constructions && constructions.length > 0 ? (
                        constructions.map((name, i) => (
                          <span key={i} className="inline-block rounded bg-surface-alt px-1.5 py-0.5 text-text-primary">
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-text-faint">No constructions</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop table layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-text-muted">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Constructions</th>
                    <th className="pb-2 font-medium">Created</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => {
                    const constructions = constructionMap.get(u.id);
                    return (
                      <tr key={u.id} className="border-b border-border/50">
                        <td className="py-2.5 font-medium text-text-primary">{u.name}</td>
                        <td className="py-2.5 text-text-secondary">{u.email}</td>
                        <td className="py-2.5">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              u.role === "superadmin"
                                ? "bg-purple-50 text-purple-700"
                                : u.role === "owner"
                                  ? "bg-blue-50 text-primary"
                                  : "bg-accent-amber-bg text-accent-amber"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 text-text-secondary">
                          {u.role === "superadmin" ? (
                            <span className="text-xs text-text-faint italic">All</span>
                          ) : constructions && constructions.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {constructions.map((name, i) => (
                                <span
                                  key={i}
                                  className="inline-block rounded bg-surface-alt px-1.5 py-0.5 text-xs text-text-primary"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-text-faint">None</span>
                          )}
                        </td>
                        <td className="py-2.5 text-text-faint">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="py-2.5">
                          <Link
                            href={`/users/${u.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
