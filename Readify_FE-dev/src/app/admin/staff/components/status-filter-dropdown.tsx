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
import { JSX } from "react";

type StatusOption = {
  key: StatusKey;
  label: string;
  value: StatusValue;
  icon?: JSX.Element;
};

export type StatusKey = "active" | "inactive" | "banned" | "unverified";
export type StatusValue = 1 | 0 | -1 | 2;

export const STATUS_MAP: Record<StatusKey, StatusValue> = {
  active: 1,
  inactive: 0,
  banned: -1,
  unverified: 2,
};

const statusOptions: StatusOption[] = [
  {
    key: "active",
    label: "Active",
    value: 1,
    icon: <CheckCircleIcon className="size-3" />,
  },
  {
    key: "inactive",
    label: "Inactive",
    value: 0,
    icon: <CircleMinusIcon className="size-3" />,
  },
  {
    key: "banned",
    label: "Banned",
    value: -1,
    icon: <BanIcon className="size-3" />,
  },
  {
    key: "unverified",
    label: "Email not verified",
    value: 2,
    icon: <MailIcon className="size-3" />,
  },
];

export const convertStatus = (k: StatusKey): StatusValue => STATUS_MAP[k];

export default function StatusFilterDropdown({
  selectedStatuses,
  onStatusChange,
}: {
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
}) {
  const handleStatusToggle = (statusKey: string, checked: boolean) => {
    if (checked) {
      onStatusChange([...selectedStatuses, statusKey]);
    } else {
      onStatusChange(selectedStatuses.filter((s) => s !== statusKey));
    }
  };

  const handleClear = () => {
    onStatusChange([]);
  };

  const total = selectedStatuses.length;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Status
          {total > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 rounded-sm px-1 font-normal"
            >
              {total}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {statusOptions.map((option) => (
            <DropdownMenuCheckboxItem
              className="cursor-pointer"
              checked={selectedStatuses.includes(option.key)}
              key={option.key}
              onCheckedChange={(checked) =>
                handleStatusToggle(option.key, checked)
              }
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>

        {total > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              onSelect={handleClear}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              Clear status filters
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
