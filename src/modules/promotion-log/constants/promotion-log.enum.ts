export enum PromotionLogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPLY = 'APPLY',
}

export enum PromotionLogSortBy {
  CREATED_AT = 'createdAt',
  ACTION = 'action',
  PROMOTION_CODE = 'promotionCode',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
