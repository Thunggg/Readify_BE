"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import StatusFilterDropdown from "./status-filter-dropdown";
import RoleFilterDropdown from "./role-filter-dropdown";
import SearchInput from "./search-input";

export type FilterState = {
  status: string[];
  role: string[];
};

export default function AccountsToolbar({
  searchValue,
  setSearchValue,

  filters,
  setLocalsFilters,

  onCreateClick,
  searchPlaceholder = "Search accounts...",
}: {
  searchValue: string;
  setSearchValue: (value: string) => void;
  filters: FilterState;
  setLocalsFilters: (
    filters: FilterState | ((prev: FilterState) => FilterState)
  ) => void;
  onCreateClick: () => void;
  searchPlaceholder?: string;
}) {
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleStatusChange = (statuses: string[]) => {
    setLocalsFilters((prev) => ({ ...prev, status: statuses }));
  };

  const handleRoleChange = (roles: string[]) => {
    setLocalsFilters((prev) => ({ ...prev, role: roles }));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex flex-1 gap-2">
        <SearchInput
          value={searchValue}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          className="flex-1"
        />

        <StatusFilterDropdown
          selectedStatuses={filters.status}
          onStatusChange={handleStatusChange}
        />

        <RoleFilterDropdown
          selectedRoles={filters.role}
          onRoleChange={handleRoleChange}
        />
      </div>

      <Button onClick={onCreateClick} className="sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        Create account
      </Button>
    </div>
  );
}
