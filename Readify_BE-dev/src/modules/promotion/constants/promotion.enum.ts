// ===== DISCOUNT TYPE =====
export const DiscountType = {
  PERCENT: 'PERCENT',
  FIXED: 'FIXED',
} as const;

export type DiscountTypeValue = (typeof DiscountType)[keyof typeof DiscountType];

export const PromotionStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  EXPIRED: 'EXPIRED',
} as const;

export type PromotionStatusValue = (typeof PromotionStatus)[keyof typeof PromotionStatus];

export const ApplyScope = {
  ORDER: 'ORDER',
  PRODUCT: 'PRODUCT',
  CATEGORY: 'CATEGORY',
} as const;

export type ApplyScopeValue = (typeof ApplyScope)[keyof typeof ApplyScope];

export const PromotionSortBy = {
  CREATED_AT: 'createdAt',
  START_DATE: 'startDate',
  END_DATE: 'endDate',
  DISCOUNT_VALUE: 'discountValue',
  USAGE_LIMIT: 'usageLimit',
  USED_COUNT: 'usedCount',
} as const;

export type PromotionSortByValue = (typeof PromotionSortBy)[keyof typeof PromotionSortBy];

export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrderValue = (typeof SortOrder)[keyof typeof SortOrder];
