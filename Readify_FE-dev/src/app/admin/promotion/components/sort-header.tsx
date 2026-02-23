import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export type SortOrder = "asc" | "desc" | null;

interface SortableHeaderProps<T> {
  title: string;
  field: T;
  onSortChange: (field: T | null, order: SortOrder) => void;
}

export default function SortableHeader<T>({
  title,
  field,
  onSortChange,
}: SortableHeaderProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (order: SortOrder) => {
    onSortChange(field, order);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none dark:text-gray-200 dark:hover:bg-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <ChevronsUpDown className="ml-2 h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-10 mt-2 w-32 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-950 dark:ring-gray-800 border border-gray-200 dark:border-gray-800">
          <div className="py-1">
            <button
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => handleSort("asc")}
            >
              <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Asc
            </button>
            <button
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => handleSort("desc")}
            >
              <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Desc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
