import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { SortField, SortOrder } from "../accounts-table";



export default function SortableHeader({
  title,
  field,
  onSortChange,
  currentField,
  currentOrder
}: {
  title: string;
  field: SortField;
  onSortChange: (field: SortField, order: SortOrder) => void;
  currentField?: SortField;
  currentOrder?: SortOrder;
}) {

    const [isOpen, setIsOpen] = useState(false);
    const isActive = currentField === field;

    const setSort = (field: SortField, order: SortOrder) => {
        if(order === null){
            onSortChange(null, null);
        } else {
            onSortChange(field, order);
        }
        setIsOpen(false);
    }

    const getSortIcon = () => {
      if (!isActive) {
        return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
      }
      if (currentOrder === "asc") {
        return <ArrowUp className="ml-2 h-4 w-4" />;
      }
      return <ArrowDown className="ml-2 h-4 w-4" />;
    };


  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 font-medium hover:bg-accent ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {title}
          {getSortIcon()}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-32">

        <DropdownMenuItem onClick={() => setSort(field, "asc")}>
          <ArrowUp className="mr-2 size-4" />
          Ascending
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setSort(field, "desc")}>
          <ArrowDown className="mr-2 size-4" />
          Descending
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}

