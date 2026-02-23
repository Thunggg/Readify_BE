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
import { Filter, ShieldAlert, ShoppingCart, Package } from "lucide-react";
import { JSX } from "react";

type RoleOption = {
  key: RoleKey;
  label: string;
  value: RoleValue;
  icon?: JSX.Element;
};

export type RoleKey = "seller" | "warehouse";
export type RoleValue = 2 | 3;

export const ROLE_MAP: Record<RoleKey, RoleValue> = {
  seller: 2,
  warehouse: 3,
};

const roleOptions: RoleOption[] = [
  {
    key: "seller",
    label: "Seller",
    value: 2,
    icon: <ShoppingCart className="size-3" />,
  },
  {
    key: "warehouse",
    label: "Warehouse",
    value: 3,
    icon: <Package className="size-3" />,
  },
];

export const convertRole = (k: RoleKey): RoleValue => ROLE_MAP[k];

export default function RoleFilterDropdown({
  selectedRoles,
  onRoleChange,
}: {
  selectedRoles: string[];
  onRoleChange: (roles: string[]) => void;
}) {
  const handleRoleToggle = (roleKey: string, checked: boolean) => {
    if (checked) {
      onRoleChange([...selectedRoles, roleKey]);
    } else {
      onRoleChange(selectedRoles.filter((r) => r !== roleKey));
    }
  };

  const handleClear = () => {
    onRoleChange([]);
  };

  const total = selectedRoles.length;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Role
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
        <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {roleOptions.map((option) => (
            <DropdownMenuCheckboxItem
              className="cursor-pointer"
              checked={selectedRoles.includes(option.key)}
              key={option.key}
              onCheckedChange={(checked) =>
                handleRoleToggle(option.key, checked)
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
              Clear role filters
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
