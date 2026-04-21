"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
};

export function Pagination({ currentPage, totalPages, totalItems }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  }

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <p className="text-sm text-text-muted">
        {totalItems} total
      </p>
      <div className="flex items-center gap-1">
        {currentPage > 1 && (
          <Link
            href={buildHref(currentPage - 1)}
            className="rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-alt"
          >
            Prev
          </Link>
        )}
        {pages.map((page, i) =>
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-sm text-text-faint">...</span>
          ) : (
            <Link
              key={page}
              href={buildHref(page)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                page === currentPage
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-surface-alt"
              }`}
            >
              {page}
            </Link>
          )
        )}
        {currentPage < totalPages && (
          <Link
            href={buildHref(currentPage + 1)}
            className="rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-alt"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
