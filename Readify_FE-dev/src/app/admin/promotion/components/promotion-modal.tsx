"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PromotionForm from "./promotion-form";
import { PromotionFormInput } from "@/validation/promotion-schemas";
import { PromotionApiRequest } from "@/api-request/promotion";
import { handleErrorApi } from "@/lib/utils";
import { toast } from "sonner";
import { Promotion } from "@/types/promotion";
import { X } from "lucide-react";

type PromotionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion?: Promotion;
  onSuccess?: () => void;
};

export default function PromotionModal({
  open,
  onOpenChange,
  promotion,
  onSuccess,
}: PromotionModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: PromotionFormInput) => {
    setIsSubmitting(true);
    try {
      if (promotion) {
        const isLocked =
          promotion.status === "ACTIVE" ||
          new Date() >= new Date(promotion.startDate) ||
          promotion.usedCount > 0;

        const updateData: any = {
          name: data.name,
          description: data.description,
          endDate: new Date(data.endDate).toISOString(),
          usageLimit: data.usageLimit || undefined,
        };

        if (data.status && data.status !== "EXPIRED") {
          updateData.status = data.status;
        }

        if (!isLocked) {
          updateData.discountType = data.discountType;
          updateData.discountValue = data.discountValue;
          updateData.minOrderValue = data.minOrderValue || undefined;
          updateData.maxDiscount = data.maxDiscount || undefined;
        }

        const response = await PromotionApiRequest.updatePromotion(
          promotion._id,
          updateData,
        );
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

        toast.success("Promotion updated successfully");
      } else {
        const response = await PromotionApiRequest.createPromotion({
          code: data.code,
          name: data.name,
          description: data.description,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderValue: data.minOrderValue || undefined,
          maxDiscount: data.maxDiscount || undefined,
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
          usageLimit: data.usageLimit || undefined,
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

        toast.success("Promotion created successfully");
      }

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (error) {
      handleErrorApi({ error, setError: () => { }, duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col rounded-lg bg-white shadow-xl dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-semibold leading-none tracking-tight">
            {promotion ? "Edit Promotion" : "Create Promotion"}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <PromotionForm
            promotion={promotion}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitButtonText={
              promotion ? "Update Promotion" : "Create Promotion"
            }
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </div>
    </div>
  );
}
