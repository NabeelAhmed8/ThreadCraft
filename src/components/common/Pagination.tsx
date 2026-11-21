"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const delta = 1;

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);

    if (left > 2) {
      pages.push("...");
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages - 1) {
      pages.push("...");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={`flex items-center justify-center gap-1.5 sm:gap-2 select-none ${className}`}
    >
      {/* First Page */}
      {totalPages > 4 && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Go to first page"
          title="First page"
          className="p-2 rounded-md border border-neutral-200 text-neutral-600 hover:text-black hover:border-black disabled:opacity-30 disabled:pointer-events-none transition bg-white"
        >
          <ChevronsLeft size={16} />
        </button>
      )}

      {/* Previous Page */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
        title="Previous page"
        className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-md border border-neutral-200 text-neutral-700 hover:text-black hover:border-black disabled:opacity-30 disabled:pointer-events-none transition bg-white"
      >
        <ChevronLeft size={14} />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="w-8 sm:w-9 h-8 sm:h-9 flex items-center justify-center text-xs text-neutral-400 select-none"
              >
                &hellip;
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Page ${pageNum}`}
              className={`w-8 sm:w-9 h-8 sm:h-9 text-xs font-medium rounded-md transition flex items-center justify-center ${
                isActive
                  ? "bg-black text-white font-semibold shadow-sm"
                  : "border border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:text-black bg-white"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next Page */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
        title="Next page"
        className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-md border border-neutral-200 text-neutral-700 hover:text-black hover:border-black disabled:opacity-30 disabled:pointer-events-none transition bg-white"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={14} />
      </button>

      {/* Last Page */}
      {totalPages > 4 && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Go to last page"
          title="Last page"
          className="p-2 rounded-md border border-neutral-200 text-neutral-600 hover:text-black hover:border-black disabled:opacity-30 disabled:pointer-events-none transition bg-white"
        >
          <ChevronsRight size={16} />
        </button>
      )}
    </nav>
  );
}
