"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BanIcon,
  CheckCircleIcon,
  CircleMinusIcon,
  Filter,
  MailIcon,
} from "lucide-react";
import { JSX, useEffect } from "react";

type FilterOption<K extends string, V extends number> = {
  type: "status" | "sex";
  key: K;
  label: string;
  value: V;
  icon?: JSX.Element;
};

export type FilterState = {
  status: string[];
  sex: string[];
};

export type StatusKey = "active" | "inactive" | "banned" | "unverified";
export type StatusValue = 1 | 0 | -1 | 2;

export const STATUS_MAP: Record<StatusKey, StatusValue> = {
  active: 1,
  inactive: 0,
  banned: -1,
  unverified: 2,
};

export type SexKey = "male" | "female" | "unknown";
export type SexValue = 0 | 1 | 2;

const statusTags: FilterOption<StatusKey, StatusValue>[] = [
  {
    type: "status",
    key: "active",
    label: "Active",
    value: 1,
    icon: <CheckCircleIcon className="size-3" />,
  },
  {
    type: "status",
    key: "inactive",
    label: "Inactive",
    value: 0,
    icon: <CircleMinusIcon className="size-3" />,
  },
  {
    type: "status",
    key: "banned",
    label: "Banned",
    value: -1,
    icon: <BanIcon className="size-3" />,
  },
  {
    type: "status",
    key: "unverified",
    label: "Email not verified",
    value: 2,
    icon: <MailIcon className="size-3" />,
  },
];

export const convertStatus = (k: StatusKey): StatusValue => STATUS_MAP[k];

const sexTags: FilterOption<SexKey, SexValue>[] = [
  {
    type: "sex",
    key: "male",
    label: "Male",
    value: 1,
    icon: <span className="text-blue-600">♂</span>,
  },
  {
    type: "sex",
    key: "female",
    label: "Female",
    value: 2,
    icon: <span className="text-rose-600">♀</span>,
  },
  {
    type: "sex",
    key: "unknown",
    label: "Unknown",
    value: 0,
  },
];

export const SEX_MAP: Record<SexKey, SexValue> = {
  male: 1,
  female: 2,
  unknown: 0,
};
export const convertSex = (k: SexKey): SexValue => SEX_MAP[k];

export default function FilterDropdown({
  filters,
  setLocalsFilters,
}: {
  filters: FilterState;
  setLocalsFilters: (
    filters: FilterState | ((prev: FilterState) => FilterState)
  ) => void;
}) {
  useEffect(() => {
    const setTags = () => {
      if (!filters.sex.length && !filters.status.length) return;

      console.log(filters);
    };

    setTags();
  }, [filters]);

  const handleTagChange = (tag: string, type: string, checked: boolean) => {
    // Trả ra callback
    setLocalsFilters((prev: FilterState) => {
      if (checked) {
        if (type === "status") {
          return {
            ...prev,
            status: prev.status.includes(tag)
              ? prev.status
              : [...prev.status, tag],
          };
        } else if (type === "sex") {
          return {
            ...prev,
            sex: prev.sex.includes(tag) ? prev.sex : [...prev.sex, tag],
          };
        }
      } else {
        if (type === "status") {
          return {
            ...prev,
            status: prev.status.filter((s) => s !== tag),
          };
        }

        if (type === "sex") {
          return {
            ...prev,
            sex: prev.sex.filter((s) => s !== tag),
          };
        }
      }
      return prev;
    });
  };

  const handleClear = () => {
    setLocalsFilters({
      sex: [],
      status: [],
    });
  };

  const total = (filters.status?.length ?? 0) + (filters.sex?.length ?? 0);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
          <Badge
            variant="secondary"
            className="ml-2 rounded-sm px-1 font-normal"
          >
            {total}
          </Badge>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Filters</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Status Filter */}
        <DropdownMenuGroup>
          <div className="px-2 py-1.5 text-sm font-semibold">Status</div>
          {statusTags.map((tag) => (
            <DropdownMenuCheckboxItem
              className="cursor-pointer"
              checked={filters.status.includes(tag.key)}
              key={tag.key}
              onCheckedChange={(checked) =>
                handleTagChange(tag.key, tag.type, checked)
              }
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {tag.icon}
                  <span>{tag.label}</span>
                </div>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Sex Filter */}
        <DropdownMenuGroup>
          <div className="px-2 py-1.5 text-sm font-semibold">Gender</div>
          {sexTags.map((tag) => (
            <DropdownMenuCheckboxItem
              className="cursor-pointer"
              checked={filters.sex.includes(tag.key)}
              key={tag.key}
              onCheckedChange={(checked) =>
                handleTagChange(tag.key, tag.type, checked)
              }
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {tag.icon}
                  <span>{tag.label}</span>
                </div>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Clear All */}
        {total > 0 ? (
          <>
            <DropdownMenuCheckboxItem
              onSelect={handleClear}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              Clear all filters
            </DropdownMenuCheckboxItem>
          </>
        ) : (
          <></>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
