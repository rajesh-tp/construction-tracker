import { requireOwner } from "@/lib/auth";
import { ProfileForm } from "./_components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireOwner();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Settings</h1>
        <p className="text-sm text-text-muted">Manage your account settings</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
