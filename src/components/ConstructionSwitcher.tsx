"use client";

import { useState, useRef, useEffect } from "react";
import { switchConstruction } from "@/lib/actions";
import type { Construction } from "@/db/schema";

type ConstructionSwitcherProps = {
  constructions: Construction[];
  activeConstructionId: number | null;
  isSuperAdmin: boolean;
};

export function ConstructionSwitcher({
  constructions,
  activeConstructionId,
  isSuperAdmin,
}: ConstructionSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeConstruction = constructions.find((c) => c.id === activeConstructionId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (constructions.length === 0) {
    return (
      <span className="text-xs text-slate-400">No constructions</span>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg bg-nav-hover px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-nav-active"
      >
        <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="max-w-[150px] truncate">
          {activeConstruction?.name || "Select..."}
        </span>
        <svg className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-border bg-surface shadow-lg">
          <div className="p-1">
            {constructions.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  if (c.id !== activeConstructionId) {
                    switchConstruction(c.id);
                  }
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  c.id === activeConstructionId
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-text-primary hover:bg-surface-alt"
                }`}
              >
                {c.id === activeConstructionId && (
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className={c.id === activeConstructionId ? "" : "ml-5.5"}>{c.name}</span>
              </button>
            ))}
          </div>
          {isSuperAdmin && (
            <>
              <div className="border-t border-border" />
              <div className="p-1">
                <a
                  href="/constructions"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-alt"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Manage Constructions
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
