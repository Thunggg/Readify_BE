import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const maxVisiblePages = 5;
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    let end = start + maxVisiblePages - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - maxVisiblePages + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  const renderButton = (
    label: React.ReactNode,
    page: number,
    isActive: boolean = false,
    isDisabled: boolean = false
  ) => (
    <button
      onClick={(e) => {
        e.preventDefault();
        if (!isDisabled) onPageChange(page);
      }}
      disabled={isDisabled}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "border-gray-200 bg-gray-900 text-white shadow hover:bg-gray-900/90 dark:border-gray-800 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90"
          : "border-transparent text-gray-900 hover:bg-gray-100/50 dark:text-gray-50 dark:hover:bg-gray-800/50",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {label}
    </button>
  );

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className="mx-auto flex w-full justify-center gap-1"
    >
      {renderButton(
        <div className="flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </div>,
        currentPage - 1,
        false,
        currentPage <= 1
      )}

      {visiblePages[0] > 1 && (
        <>
          {renderButton(1, 1, currentPage === 1)}
          {visiblePages[0] > 2 && (
            <span className="flex h-9 w-9 items-center justify-center">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More pages</span>
            </span>
          )}
        </>
      )}

      {visiblePages.map((pageNum) =>
        renderButton(pageNum, pageNum, currentPage === pageNum)
      )}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="flex h-9 w-9 items-center justify-center">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More pages</span>
            </span>
          )}
          {renderButton(totalPages, totalPages, currentPage === totalPages)}
        </>
      )}

      {renderButton(
        <div className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </div>,
        currentPage + 1,
        false,
        currentPage >= totalPages
      )}
    </nav>
  );
}
