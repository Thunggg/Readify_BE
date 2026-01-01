export const OrderStatus = {
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  PAID: 'PAID',
  PREPARING: 'PREPARING',
  DELIVERED: 'DELIVERED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatusValue = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
  COD: 'COD',
  VNPAY: 'VNPAY',
  MOMO: 'MOMO',
} as const;

export type PaymentMethodValue = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatusValue = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const OrderSortBy = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  TOTAL_AMOUNT: 'totalAmount',
  FINAL_AMOUNT: 'finalAmount',
  ORDER_CODE: 'orderCode',
} as const;

export type OrderSortByValue = (typeof OrderSortBy)[keyof typeof OrderSortBy];

export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrderValue = (typeof SortOrder)[keyof typeof SortOrder];
