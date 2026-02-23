"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  promotionFormSchema,
  PromotionFormInput,
} from "@/validation/promotion-schemas";
import {
  PromotionStatus,
  PromotionDiscountType,
  Promotion,
} from "@/types/promotion";
import { Loader2 } from "lucide-react";
import dayjs from "dayjs";

type PromotionFormProps = {
  promotion?: Promotion;
  onSubmit: (data: PromotionFormInput) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText: string;
  onCancel?: () => void;
};

export default function PromotionForm({
  promotion,
  onSubmit,
  isSubmitting,
  submitButtonText,
  onCancel,
}: PromotionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PromotionFormInput>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: promotion
      ? {
        code: promotion.code,
        name: promotion.name,
        description: promotion.description || "",
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        minOrderValue: promotion.minOrderValue || 0,
        maxDiscount: promotion.maxDiscount || 0,
        startDate: dayjs(promotion.startDate).format("YYYY-MM-DD"),
        endDate: dayjs(promotion.endDate).format("YYYY-MM-DD"),
        usageLimit: promotion.usageLimit || 0,
        status: promotion.status,
      }
      : {
        code: "",
        name: "",
        description: "",
        discountType: PromotionDiscountType.PERCENT,
        discountValue: 0,
        minOrderValue: 0,
        maxDiscount: 0,
        startDate: "",
        endDate: "",
        usageLimit: 0,
        status: PromotionStatus.ACTIVE,
      },
  });

  const watchDiscountType = watch("discountType");

  // Check if promotion is locked (active/started/used)
  const isPromotionLocked = promotion
    ? promotion.status === PromotionStatus.ACTIVE ||
    new Date() >= new Date(promotion.startDate) ||
    promotion.usedCount > 0
    : false;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <h3 className="text-lg font-semibold leading-none tracking-tight">Basic Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Code *
              </label>
              <input
                placeholder="SUMMER2024"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-gray-800"
                {...register("code")}
                disabled={!!promotion}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {promotion
                  ? "Code cannot be changed after creation"
                  : "Uppercase letters, numbers, hyphens and underscores only"}
              </p>
              {errors.code && (
                <p className="text-xs font-medium text-red-500">{errors.code.message}</p>
              )}
            </div>

            {promotion && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Status
                </label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-gray-800"
                  {...register("status")}
                  disabled={promotion.status === PromotionStatus.EXPIRED}
                >
                  <option value={PromotionStatus.ACTIVE}>Active</option>
                  <option value={PromotionStatus.INACTIVE}>Inactive</option>
                  {promotion.status === PromotionStatus.EXPIRED && (
                    <option value={PromotionStatus.EXPIRED} disabled>
                      Expired
                    </option>
                  )}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {promotion.status === PromotionStatus.EXPIRED
                    ? "Expired promotions cannot be reactivated"
                    : "Change status to activate or deactivate"}
                </p>
                {errors.status && (
                  <p className="text-xs font-medium text-red-500">{errors.status.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Name *
            </label>
            <input
              placeholder="Summer Sale 2024"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-gray-800"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs font-medium text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Description
            </label>
            <textarea
              placeholder="Enter promotion description..."
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-gray-800 resize-none"
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs font-medium text-red-500">{errors.description.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Discount Settings */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <h3 className="text-lg font-semibold leading-none tracking-tight">Discount Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Discount Type *
              </label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-gray-800"
                {...register("discountType")}
                disabled={isPromotionLocked}
              >
                <option value={PromotionDiscountType.PERCENT}>Percentage (%)</option>
                <option value={PromotionDiscountType.FIXED}>Fixed Amount (VND)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPromotionLocked
                  ? "Cannot change discount type while promotion is active/started/used"
                  : "The default is Percentage"}
              </p>
              {errors.discountType && (
                <p className="text-xs font-medium text-red-500">{errors.discountType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Discount Value *
              </label>
              <input
                type="number"
                placeholder={
                  watchDiscountType === PromotionDiscountType.PERCENT ? "10" : "100000"
                }
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-gray-800"
                {...register("discountValue", { valueAsNumber: true })}
                disabled={isPromotionLocked}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPromotionLocked
                  ? "Cannot change value while promotion is active/started/used"
                  : watchDiscountType === PromotionDiscountType.PERCENT
                    ? "Enter percentage (1-100)"
                    : "Enter fixed amount in VND"}
              </p>
              {errors.discountValue && (
                <p className="text-xs font-medium text-red-500">{errors.discountValue.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Min Order Value
              </label>
              <input
                type="number"
                placeholder="0"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-gray-800"
                {...register("minOrderValue", { valueAsNumber: true })}
                disabled={isPromotionLocked}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPromotionLocked
                  ? "Cannot change while promotion is active/started/used"
                  : "Minimum order amount to apply (VND)"}
              </p>
              {errors.minOrderValue && (
                <p className="text-xs font-medium text-red-500">{errors.minOrderValue.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Max Discount
              </label>
              <input
                type="number"
                placeholder="0"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-gray-800"
                {...register("maxDiscount", { valueAsNumber: true })}
                disabled={isPromotionLocked}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPromotionLocked
                  ? "Cannot change while promotion is active/started/used"
                  : "Maximum discount amount (VND), 0 for unlimited"}
              </p>
              {errors.maxDiscount && (
                <p className="text-xs font-medium text-red-500">{errors.maxDiscount.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Validity Period & Usage */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <h3 className="text-lg font-semibold leading-none tracking-tight">Validity Period & Usage</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Start Date *
              </label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-gray-800"
                {...register("startDate")}
                disabled={!!promotion}
              />
              {errors.startDate && (
                <p className="text-xs font-medium text-red-500">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                End Date *
              </label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-gray-800"
                {...register("endDate")}
              />
              {errors.endDate && (
                <p className="text-xs font-medium text-red-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Usage Limit
            </label>
            <input
              type="number"
              placeholder="0"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:focus:ring-gray-800"
              {...register("usageLimit", { valueAsNumber: true })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Maximum number of times this promotion can be used, 0 for unlimited
            </p>
            {errors.usageLimit && (
              <p className="text-xs font-medium text-red-500">{errors.usageLimit.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900 disabled:pointer-events-none disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-900/90 focus:outline-none dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 disabled:pointer-events-none disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </button>
      </div>
    </form>
  );
}
