"use client";

import { RotateCcw, Plus } from "lucide-react";
import FilterDropdown, { FilterState } from "./filter-dropdown";
import SearchInput from "./search-input";
import ActiveFilters from "./active-filters";

export default function PromotionsToolbar({
  searchValue,
  setSearchValue,
  filters,
  setLocalFilters,
  onResetAll,
  onCreateClick,
  searchPlaceholder = "Search promotions...",
}: {
  searchValue: string;
  setSearchValue: (value: string) => void;
  filters: FilterState;
  setLocalFilters: (
    filters: FilterState | ((prev: FilterState) => FilterState)
  ) => void;
  onResetAll: () => void;
  onCreateClick: () => void;
  searchPlaceholder?: string;
}) {
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleRemoveFilter = (
    type: "status" | "discountType" | "applyScope",
    value: string
  ) => {
    setLocalFilters((prev) => ({
      ...prev,
      [type]: prev[type].filter((v) => v !== value),
    }));
  };

  const handleClearAllFilters = () => {
    onResetAll();
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.discountType.length > 0 ||
    filters.applyScope.length > 0;

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-1 gap-2">
          <SearchInput
            value={searchValue}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="flex-1"
          />

          <FilterDropdown filters={filters} setLocalFilters={setLocalFilters} />

          <button
            onClick={onResetAll}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900 gap-2 h-10"
          >
            <RotateCcw className="size-4" />
            Reset
          </button>
        </div>

        <button
          onClick={onCreateClick}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-900/90 focus:outline-none dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 gap-2 w-full sm:w-auto h-10"
        >
          <Plus className="size-4" />
          Create Promotion
        </button>
      </div>

      {hasActiveFilters && (
        <ActiveFilters
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />
      )}
    </div>
  );
}
