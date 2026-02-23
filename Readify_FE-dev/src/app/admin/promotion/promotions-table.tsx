"use client";

import { PromotionApiRequest } from "@/api-request/promotion";
import { handleErrorApi } from "@/lib/utils";
import { Promotion } from "@/types/promotion";
import {
  PromotionStatus,
  PromotionDiscountType,
  PromotionApplyScope,
  PromotionSortBy,
  SortOrder as ApiSortOrder,
} from "@/types/promotion";
import dayjs from "dayjs";
import {
  MoreHorizontalIcon,
  CheckCircleIcon,
  CircleMinusIcon,
  XCircleIcon,
  PercentIcon,
  DollarSignIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import PromotionsToolbar from "./components/promotions-toolbar";
import DeletePromotionModal from "./components/delete-promotion-modal";
import PromotionModal from "./components/promotion-modal";
import { FilterState } from "./components/filter-dropdown";
import SortableHeader from "./components/sort-header";
import PaginationControls from "./components/pagination-controls";

// Sort field types (matching API PromotionSortBy)
export type SortField =
  | "startDate"
  | "endDate"
  | "discountValue"
  | "usageLimit"
  | "usedCount"
  | null;
export type SortOrder = "asc" | "desc" | null;

export default function PromotionsTable() {
  // Modal states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null
  );

  // Data states
  const [localPromotions, setLocalPromotions] = useState<Promotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null
  );
  // State for Action Dropdowns
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Filter and sort states
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchValue, setSearchValue] = useState("");
  const [filters, setLocalFilters] = useState<FilterState>({
    status: [],
    discountType: [],
    applyScope: [],
  });

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Badge rendering functions
  const statusBadge = (status: PromotionStatus) => {
    if (status === PromotionStatus.ACTIVE) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400">
          <CheckCircleIcon className="mr-1 size-3" />
          Active
        </span>
      );
    }
    if (status === PromotionStatus.INACTIVE) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-600/10 text-gray-600 dark:bg-gray-400/10 dark:text-gray-400">
          <CircleMinusIcon className="mr-1 size-3" />
          Inactive
        </span>
      );
    }
    if (status === PromotionStatus.EXPIRED) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400">
          <XCircleIcon className="mr-1 size-3" />
          Expired
        </span>
      );
    }
    return null;
  };

  const discountTypeBadge = (type: PromotionDiscountType) => {
    if (type === PromotionDiscountType.PERCENT) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
          <PercentIcon className="mr-1 size-3" />
          Percent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-purple-600/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400">
        <DollarSignIcon className="mr-1 size-3" />
        Fixed
      </span>
    );
  };

  const applyScopeBadge = (scope: PromotionApplyScope) => {
    const scopeConfig = {
      [PromotionApplyScope.ORDER]: { label: "Order", color: "orange" },
      [PromotionApplyScope.SPECIFIC_BOOKS]: { label: "Books", color: "teal" },
      [PromotionApplyScope.CATEGORY]: { label: "Category", color: "indigo" },
    };

    const config = scopeConfig[scope];
    // Map colors to class names explicitly because dynamic colors like `bg-${color}-600` might not be safe listed in Tailwind
    let colorClass = "";
    if (config.color === "orange") colorClass = "bg-orange-600/10 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400";
    else if (config.color === "teal") colorClass = "bg-teal-600/10 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400";
    else if (config.color === "indigo") colorClass = "bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400";
    else colorClass = "bg-gray-100 text-gray-800";


    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Sort handler
  const onSortChange = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
  };

  // Reset all filters and sort
  const resetAllFiltersAndSort = () => {
    setLocalFilters({
      status: [],
      discountType: [],
      applyScope: [],
    });
    setSortField(null);
    setSortOrder("desc");
  };

  // Fetch promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await PromotionApiRequest.getPromotionList({
          q: searchValue || undefined,
          limit: limit,
          page: page,
          status:
            filters.status.length > 0
              ? (filters.status[0] as PromotionStatus)
              : undefined,
          discountType:
            filters.discountType.length > 0
              ? (filters.discountType[0] as PromotionDiscountType)
              : undefined,
          applyScope:
            filters.applyScope.length > 0
              ? (filters.applyScope[0] as PromotionApplyScope)
              : undefined,
          sortBy: sortField as PromotionSortBy | undefined,
          order: sortOrder
            ? sortOrder === "asc"
              ? ApiSortOrder.ASC
              : ApiSortOrder.DESC
            : undefined,
        });
        if (!response) {
          throw new Error("API returned undefined response");
        }

        if (!response.status || !response.payload.success) {
          handleErrorApi({
            error: response.payload.message,
            setError: () => { },
            duration: 5000,
          });
          return;
        }

        setLocalPromotions(response.payload.data.items);
        setTotal(response.payload.data.meta?.total || 0);
      } catch (error) {
        handleErrorApi({ error, setError: () => { }, duration: 5000 });
      }
    };
    fetchPromotions();
  }, [sortField, sortOrder, searchValue, filters, page, limit]);

  const handleCreateClick = () => {
    setEditingPromotion(null);
    setShowPromotionModal(true);
  };

  const handleEditClick = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setShowPromotionModal(true);
    setOpenDropdownId(null);
  };

  const handleModalSuccess = () => {
    // Refresh the list after create/update
    const fetchPromotions = async () => {
      try {
        const response = await PromotionApiRequest.getPromotionList({
          q: searchValue || undefined,
          limit: limit,
          page: page,
          status:
            filters.status.length > 0
              ? (filters.status[0] as PromotionStatus)
              : undefined,
          discountType:
            filters.discountType.length > 0
              ? (filters.discountType[0] as PromotionDiscountType)
              : undefined,
          applyScope:
            filters.applyScope.length > 0
              ? (filters.applyScope[0] as PromotionApplyScope)
              : undefined,
          sortBy: sortField as PromotionSortBy | undefined,
          order: sortOrder
            ? sortOrder === "asc"
              ? ApiSortOrder.ASC
              : ApiSortOrder.DESC
            : undefined,
        });
        if (!response) {
          throw new Error("API returned undefined response");
        }

        if (response.status && response.payload.success) {
          setLocalPromotions(response.payload.data.items);
          setTotal(response.payload.data.meta?.total || 0);
        }
      } catch (error) {
        console.error("Error fetching promotions:", error);
      }
    };
    fetchPromotions();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && !(event.target as Element).closest('.action-dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  return (
    <>
      <PromotionModal
        open={showPromotionModal}
        onOpenChange={setShowPromotionModal}
        promotion={editingPromotion || undefined}
        onSuccess={handleModalSuccess}
      />

      <DeletePromotionModal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedPromotion={selectedPromotion}
        onDeletePromotion={() => {
          setLocalPromotions(
            localPromotions.filter(
              (promotion) => promotion._id !== selectedPromotion?._id
            )
          );
        }}
      />

      <PromotionsToolbar
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        filters={filters}
        setLocalFilters={setLocalFilters}
        onResetAll={resetAllFiltersAndSort}
        onCreateClick={handleCreateClick}
      />

      <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900 dark:text-gray-400">
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th scope="col" className="px-4 py-3 font-medium h-12 align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0">Code</th>
                <th scope="col" className="px-4 py-3 font-medium h-12 align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0">Name</th>
                <th scope="col" className="px-4 py-3 font-medium h-12 align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  <SortableHeader
                    title="Discount Value"
                    field="discountValue"
                    onSortChange={onSortChange}
                  />
                </th>
                <th scope="col" className="px-4 py-3 font-medium h-12 align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0">Apply Scope</th>
                <th scope="col" className="px-4 py-3 font-medium h-12 align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  <SortableHeader
                    title="Start Date"
                    field="startDate"
                    onSortChange={onSortChange}
                  />
                </th>
                <th scope="col" className="px-4 py-3 font-medium h-12 align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  <SortableHeader
                    title="End Date"
                    field="endDate"
                    onSortChange={onSortChange}
                  />
                </th>
                <th scope="col" className="px-4 py-3 font-medium h-12 align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  <SortableHeader
                    title="Usage"
                    field="usedCount"
                    onSortChange={onSortChange}
                  />
                </th>
                <th scope="col" className="px-4 py-3 font-medium h-12 align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0">Status</th>
                <th scope="col" className="px-4 py-3 font-medium h-12 align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {localPromotions.map((promotion) => (
                <tr key={promotion._id} className="bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900 transition-colors">
                  <td className="px-4 py-3 font-medium">{promotion.code}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-50">
                      <div className="font-medium truncate">{promotion.name}</div>
                      {promotion.description && (
                        <div className="text-sm text-gray-500 truncate dark:text-gray-400">
                          {promotion.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {discountTypeBadge(promotion.discountType)}
                      <span className="font-medium">
                        {promotion.discountType === PromotionDiscountType.PERCENT
                          ? `${promotion.discountValue}%`
                          : formatCurrency(promotion.discountValue)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{applyScopeBadge(promotion.applyScope)}</td>
                  <td className="px-4 py-3">
                    {dayjs(promotion.startDate).format("DD/MM/YYYY")}
                  </td>
                  <td className="px-4 py-3">
                    {dayjs(promotion.endDate).format("DD/MM/YYYY")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="font-medium">
                        {promotion.usedCount} / {promotion.usageLimit || "∞"}
                      </div>
                      {promotion.usageLimit && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {(
                            (promotion.usedCount / promotion.usageLimit) *
                            100
                          ).toFixed(0)}
                          %
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{statusBadge(promotion.status)}</td>
                  <td className="px-4 py-3 relative action-dropdown-container">
                    <button
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-50 h-8 w-8 text-gray-500"
                      onClick={() => setOpenDropdownId(openDropdownId === promotion._id ? null : promotion._id)}
                    >
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </button>
                    {openDropdownId === promotion._id && (
                      <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-950 dark:ring-gray-800 border border-gray-200 dark:border-gray-800">
                        <div className="py-1">
                          <button
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            onClick={() => handleEditClick(promotion)}
                          >
                            Edit Promotion
                          </button>
                          <button
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            onClick={() => {
                              setShowDeleteDialog(true);
                              setSelectedPromotion(promotion);
                              setOpenDropdownId(null);
                            }}
                          >
                            Delete Promotion
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {total > limit && (
        <PaginationControls
          currentPage={page}
          totalPages={Math.ceil(total / limit)}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
