import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";
import { verifySession, getSessionUser, getSessionPayload } from "@/lib/auth";
import { getAllConstructions, getUserConstructions } from "@/lib/queries";
import "./globals.css";

export const metadata: Metadata = {
  title: "Construction Tracker",
  description: "Track and manage all expenses related to your home construction project",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthenticated = await verifySession();
  const user = isAuthenticated ? await getSessionUser() : null;
  const session = isAuthenticated ? await getSessionPayload() : null;

  // Fetch constructions accessible to this user
  let constructions: Awaited<ReturnType<typeof getAllConstructions>> = [];
  if (user) {
    if (user.role === "superadmin") {
      constructions = await getAllConstructions();
    } else {
      constructions = await getUserConstructions(user.id);
    }
  }

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Navbar
          isAuthenticated={isAuthenticated}
          userName={user?.name}
          userRole={user?.role}
          constructions={constructions}
          activeConstructionId={session?.activeConstructionId ?? null}
        />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="py-6 text-center text-sm text-text-faint">
          &copy; {new Date().getFullYear()} Construction Tracker
        </footer>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
