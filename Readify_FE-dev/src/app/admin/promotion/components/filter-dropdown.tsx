"use client";

import {
  CheckCircleIcon,
  CircleMinusIcon,
  XCircleIcon,
  PercentIcon,
  DollarSignIcon,
  Filter,
  Package,
  BookOpen,
  FolderTree,
} from "lucide-react";
import { JSX, useState, useRef, useEffect } from "react";
import {
  PromotionStatus,
  PromotionDiscountType,
  PromotionApplyScope,
} from "@/types/promotion";

type FilterOption<K extends string, V extends string> = {
  type: "status" | "discountType" | "applyScope";
  key: K;
  label: string;
  value: V;
  icon?: JSX.Element;
};

export type FilterState = {
  status: string[];
  discountType: string[];
  applyScope: string[];
};

export type StatusKey = "active" | "inactive" | "expired";

const statusTags: FilterOption<StatusKey, PromotionStatus>[] = [
  {
    type: "status",
    key: "active",
    label: "Active",
    value: PromotionStatus.ACTIVE,
    icon: <CheckCircleIcon className="size-3" />,
  },
  {
    type: "status",
    key: "inactive",
    label: "Inactive",
    value: PromotionStatus.INACTIVE,
    icon: <CircleMinusIcon className="size-3" />,
  },
  {
    type: "status",
    key: "expired",
    label: "Expired",
    value: PromotionStatus.EXPIRED,
    icon: <XCircleIcon className="size-3" />,
  },
];

export type DiscountTypeKey = "percent" | "fixed";

const discountTypeTags: FilterOption<DiscountTypeKey, PromotionDiscountType>[] =
  [
    {
      type: "discountType",
      key: "percent",
      label: "Percent",
      value: PromotionDiscountType.PERCENT,
      icon: <PercentIcon className="size-3" />,
    },
    {
      type: "discountType",
      key: "fixed",
      label: "Fixed",
      value: PromotionDiscountType.FIXED,
      icon: <DollarSignIcon className="size-3" />,
    },
  ];

export type ApplyScopeKey = "order" | "books" | "category";

const applyScopeTags: FilterOption<ApplyScopeKey, PromotionApplyScope>[] = [
  {
    type: "applyScope",
    key: "order",
    label: "Order",
    value: PromotionApplyScope.ORDER,
    icon: <Package className="size-3" />,
  },
  {
    type: "applyScope",
    key: "books",
    label: "Specific Books",
    value: PromotionApplyScope.SPECIFIC_BOOKS,
    icon: <BookOpen className="size-3" />,
  },
  {
    type: "applyScope",
    key: "category",
    label: "Category",
    value: PromotionApplyScope.CATEGORY,
    icon: <FolderTree className="size-3" />,
  },
];

export default function FilterDropdown({
  filters,
  setLocalFilters,
}: {
  filters: FilterState;
  setLocalFilters: (
    filters: FilterState | ((prev: FilterState) => FilterState)
  ) => void;
}) {
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

  const toggleFilter = (
    type: "status" | "discountType" | "applyScope",
    value: string
  ) => {
    setLocalFilters((prev: FilterState) => {
      const currentFilters = prev[type];
      const isSelected = currentFilters.includes(value);

      return {
        ...prev,
        [type]: isSelected
          ? currentFilters.filter((v) => v !== value)
          : [...currentFilters, value],
      };
    });
  };

  const activeFilterCount =
    filters.status.length +
    filters.discountType.length +
    filters.applyScope.length;

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        className="relative inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900 h-10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter className="mr-2 size-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-950 dark:ring-gray-700 max-h-[80vh] overflow-y-auto">
          <div className="py-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
              Status
            </div>
            {statusTags.map((tag) => (
              <label
                key={tag.key}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900"
                  checked={filters.status.includes(tag.value)}
                  onChange={() => toggleFilter("status", tag.value)}
                />
                <span className="ml-2 flex items-center">
                  {tag.icon}
                  <span className="ml-2">{tag.label}</span>
                </span>
              </label>
            ))}

            <div className="border-t border-gray-100 my-1 dark:border-gray-800"></div>

            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
              Discount Type
            </div>
            {discountTypeTags.map((tag) => (
              <label
                key={tag.key}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900"
                  checked={filters.discountType.includes(tag.value)}
                  onChange={() => toggleFilter("discountType", tag.value)}
                />
                <span className="ml-2 flex items-center">
                  {tag.icon}
                  <span className="ml-2">{tag.label}</span>
                </span>
              </label>
            ))}

            <div className="border-t border-gray-100 my-1 dark:border-gray-800"></div>

            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
              Apply Scope
            </div>
            {applyScopeTags.map((tag) => (
              <label
                key={tag.key}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900"
                  checked={filters.applyScope.includes(tag.value)}
                  onChange={() => toggleFilter("applyScope", tag.value)}
                />
                <span className="ml-2 flex items-center">
                  {tag.icon}
                  <span className="ml-2">{tag.label}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
