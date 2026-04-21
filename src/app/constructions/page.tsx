import { requireAuth } from "@/lib/auth";
import { getAllConstructions, getUserConstructions } from "@/lib/queries";
import { switchConstruction } from "@/lib/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConstructionsPage() {
  const user = await requireAuth();

  const constructions =
    user.role === "superadmin"
      ? await getAllConstructions()
      : await getUserConstructions(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Constructions</h1>
          <p className="text-sm text-text-muted">
            {user.role === "superadmin"
              ? "Manage all construction projects."
              : "Select a construction project to work with."}
          </p>
        </div>
        {user.role === "superadmin" && (
          <Link
            href="/constructions/new"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            + New Construction
          </Link>
        )}
      </div>

      {constructions.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-text-muted">
            {user.role === "superadmin"
              ? "No constructions yet. Create one to get started."
              : "You have not been assigned to any constructions yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {constructions.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-surface shadow-sm">
              <form action={switchConstruction.bind(null, c.id)}>
                <button
                  type="submit"
                  className="w-full p-5 text-left transition-colors hover:bg-surface-alt rounded-t-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-text-heading">{c.name}</h3>
                      {c.description && (
                        <p className="mt-1 text-sm text-text-muted">{c.description}</p>
                      )}
                    </div>
                    <span
                      className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.isActive
                          ? "bg-accent-green-bg text-accent-green"
                          : "bg-accent-red-bg text-accent-red"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-text-faint">
                    Created {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </button>
              </form>
              {user.role === "superadmin" && (
                <div className="border-t border-border px-5 py-2.5">
                  <Link
                    href={`/constructions/${c.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Manage
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
