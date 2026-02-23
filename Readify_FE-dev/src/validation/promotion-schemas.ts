import { z } from "zod";
import { PromotionStatus, PromotionDiscountType } from "@/types/promotion";

export const promotionFormSchema = z
  .object({
    code: z
      .string()
      .min(1, "Code cannot be empty")
      .max(50, "Code must be less than 50 characters")
      .regex(
        /^[A-Z0-9_-]+$/,
        "Code must contain only uppercase letters, numbers, hyphens and underscores",
      ),

    name: z
      .string()
      .min(1, "Name cannot be empty")
      .max(255, "Name must be less than 255 characters"),

    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .optional(),

    discountType: z.nativeEnum(PromotionDiscountType, {
      message: "Please select a discount type",
    }),

    discountValue: z
      .number({ message: "Discount value must be a number" })
      .positive("Discount value must be positive"),

    minOrderValue: z
      .number({ message: "Min order value must be a number" })
      .min(0, "Min order value must be non-negative")
      .optional()
      .or(z.literal(0)),

    maxDiscount: z
      .number({ message: "Max discount must be a number" })
      .min(0, "Max discount must be non-negative")
      .optional()
      .or(z.literal(0)),

    startDate: z.string().min(1, "Start date is required"),

    endDate: z.string().min(1, "End date is required"),

    usageLimit: z
      .number({ message: "Usage limit must be a number" })
      .int("Usage limit must be an integer")
      .positive("Usage limit must be positive")
      .optional()
      .or(z.literal(0)),

    status: z
      .nativeEnum(PromotionStatus, {
        message: "Please select a status",
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.discountType === PromotionDiscountType.PERCENT) {
        return data.discountValue > 0 && data.discountValue <= 100;
      }
      return true;
    },
    {
      message: "Percentage discount must be between 1 and 100",
      path: ["discountValue"],
    },
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );
export type PromotionFormInput = z.infer<typeof promotionFormSchema>;
