"use client";

import {
  CheckCircleIcon,
  CircleMinusIcon,
  XCircleIcon,
  PercentIcon,
  DollarSignIcon,
  Package,
  BookOpen,
  FolderTree,
  X,
} from "lucide-react";
import {
  PromotionStatus,
  PromotionDiscountType,
  PromotionApplyScope,
} from "@/types/promotion";
import { FilterState } from "./filter-dropdown";
import { JSX } from "react";

type FilterTag = {
  type: "status" | "discountType" | "applyScope";
  value: string;
  label: string;
  icon?: JSX.Element;
};

const getFilterTags = (filters: FilterState): FilterTag[] => {
  const tags: FilterTag[] = [];

  filters.status.forEach((value) => {
    if (value === PromotionStatus.ACTIVE) {
      tags.push({
        type: "status",
        value,
        label: "Active",
        icon: <CheckCircleIcon className="size-3" />,
      });
    } else if (value === PromotionStatus.INACTIVE) {
      tags.push({
        type: "status",
        value,
        label: "Inactive",
        icon: <CircleMinusIcon className="size-3" />,
      });
    } else if (value === PromotionStatus.EXPIRED) {
      tags.push({
        type: "status",
        value,
        label: "Expired",
        icon: <XCircleIcon className="size-3" />,
      });
    }
  });

  filters.discountType.forEach((value) => {
    if (value === PromotionDiscountType.PERCENT) {
      tags.push({
        type: "discountType",
        value,
        label: "Percent",
        icon: <PercentIcon className="size-3" />,
      });
    } else if (value === PromotionDiscountType.FIXED) {
      tags.push({
        type: "discountType",
        value,
        label: "Fixed",
        icon: <DollarSignIcon className="size-3" />,
      });
    }
  });

  filters.applyScope.forEach((value) => {
    if (value === PromotionApplyScope.ORDER) {
      tags.push({
        type: "applyScope",
        value,
        label: "Order",
        icon: <Package className="size-3" />,
      });
    } else if (value === PromotionApplyScope.SPECIFIC_BOOKS) {
      tags.push({
        type: "applyScope",
        value,
        label: "Specific Books",
        icon: <BookOpen className="size-3" />,
      });
    } else if (value === PromotionApplyScope.CATEGORY) {
      tags.push({
        type: "applyScope",
        value,
        label: "Category",
        icon: <FolderTree className="size-3" />,
      });
    }
  });

  return tags;
};

export default function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
}: {
  filters: FilterState;
  onRemoveFilter: (
    type: "status" | "discountType" | "applyScope",
    value: string
  ) => void;
  onClearAll: () => void;
}) {
  const filterTags = getFilterTags(filters);

  if (filterTags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 font-sans">
      <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
      {filterTags.map((tag) => (
        <span
          key={`${tag.type}-${tag.value}`}
          className="inline-flex items-center gap-1 rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 pr-1"
        >
          {tag.icon}
          <span>{tag.label}</span>
          <button
            type="button"
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            onClick={() => onRemoveFilter(tag.type, tag.value)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove</span>
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="h-7 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Clear all
      </button>
    </div>
  );
}
