import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./_components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const isAuthenticated = await verifySession();
  if (isAuthenticated) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-heading">Welcome Back</h1>
          <p className="mt-1 text-sm text-text-muted">
            Sign in to manage your construction expenses
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
