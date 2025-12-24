// ===== ACCOUNT ROLE =====
export const AccountRole = {
  USER: 0,
  ADMIN: 1,
  SELLER: 2,
  WAREHOUSE: 3,
} as const;

export type AccountRoleValue =
  (typeof AccountRole)[keyof typeof AccountRole];

// ===== ACCOUNT STATUS =====
export const AccountStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
  BANNED: -1,
  NOT_ACTIVE_EMAIL: 2,
} as const;

export type AccountStatusValue =
  (typeof AccountStatus)[keyof typeof AccountStatus];

// ===== SORT =====
export const StaffSortBy = {
  CREATED_AT: 'createdAt',
  EMAIL: 'email',
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  LAST_LOGIN_AT: 'lastLoginAt',
} as const;

export type StaffSortByValue =
  (typeof StaffSortBy)[keyof typeof StaffSortBy];

// ===== ORDER =====
export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrderValue =
  (typeof SortOrder)[keyof typeof SortOrder];
