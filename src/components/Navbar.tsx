"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";
import { ConstructionSwitcher } from "@/components/ConstructionSwitcher";
import type { Construction } from "@/db/schema";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/contractors", label: "Contractors" },
  { href: "/accounts", label: "Accounts" },
  { href: "/transactions", label: "Transactions" },
  { href: "/reports", label: "Reports" },
  { href: "/users", label: "Users", superadminOnly: true },
];

type NavbarProps = {
  isAuthenticated: boolean;
  userName?: string;
  userRole?: string;
  constructions?: Construction[];
  activeConstructionId?: number | null;
};

export function Navbar({ isAuthenticated, userName, userRole, constructions, activeConstructionId }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const activeConstruction = constructions?.find((c) => c.id === activeConstructionId);

  const filteredLinks = navLinks.filter((link) => {
    if (link.superadminOnly && userRole !== "superadmin") return false;
    if (userRole === "contractor") {
      return ["/", "/transactions"].includes(link.href);
    }
    return true;
  });

  return (
    <nav className="bg-nav text-white shadow-lg">
      <div className="mx-auto max-w-6xl px-4">
        {/* Top row: Logo, user info, logout */}
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
            <svg className="h-7 w-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Construction Tracker
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated && constructions && constructions.length > 0 && (
              <div className="hidden md:block">
                <ConstructionSwitcher
                  constructions={constructions}
                  activeConstructionId={activeConstructionId ?? null}
                  isSuperAdmin={userRole === "superadmin"}
                />
              </div>
            )}
            {isAuthenticated && userName && (
              <span className="hidden text-sm text-slate-400 md:inline">{userName}</span>
            )}
            {isAuthenticated && userRole !== "contractor" && (
              <Link
                href="/settings"
                className={`hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors md:block ${
                  pathname === "/settings"
                    ? "bg-nav-active text-white"
                    : "text-slate-300 hover:bg-nav-hover hover:text-white"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}
            {isAuthenticated ? (
              <form action={logout} className="hidden md:block">
                <button
                  type="submit"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-nav-hover hover:text-white"
                >
                  Logout
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-nav-hover hover:text-white md:block"
              >
                Login
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-lg p-2 text-slate-300 hover:bg-nav-hover md:hidden"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Second row: Construction name + nav links (desktop) */}
        {isAuthenticated && (
          <div className="hidden border-t border-white/10 md:block">
            <div className="flex h-10 items-center justify-between">
              <div className="flex items-center gap-1">
                {filteredLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? "bg-nav-active text-white"
                        : "text-slate-300 hover:bg-nav-hover hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {activeConstruction && (
                <span className="text-xs text-slate-400">
                  {activeConstruction.name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mobile menu */}
        <div
          className={`overflow-hidden transition-all duration-300 md:hidden ${
            isOpen ? "max-h-96 pb-4" : "max-h-0"
          }`}
        >
          {isAuthenticated && constructions && constructions.length > 0 && (
            <div className="px-4 py-2">
              <ConstructionSwitcher
                constructions={constructions}
                activeConstructionId={activeConstructionId ?? null}
                isSuperAdmin={userRole === "superadmin"}
              />
            </div>
          )}
          {isAuthenticated && activeConstruction && (
            <div className="px-4 py-1.5 text-xs text-slate-400">
              {activeConstruction.name}
            </div>
          )}
          {isAuthenticated &&
            filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-nav-active text-white"
                    : "text-slate-300 hover:bg-nav-hover hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          {isAuthenticated && userRole !== "contractor" && (
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === "/settings"
                  ? "bg-nav-active text-white"
                  : "text-slate-300 hover:bg-nav-hover hover:text-white"
              }`}
            >
              Settings
            </Link>
          )}
          {isAuthenticated ? (
            <form action={logout}>
              <button
                type="submit"
                onClick={() => setIsOpen(false)}
                className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-nav-hover hover:text-white"
              >
                Logout
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-nav-hover hover:text-white"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
