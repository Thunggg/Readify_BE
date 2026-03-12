// ===== ACCOUNT ROLE =====
export const AccountRole = {
  USER: 0,
  ADMIN: 1,
  SELLER: 2,
  WAREHOUSE: 3,
} as const;

export type AccountRoleValue = (typeof AccountRole)[keyof typeof AccountRole];

// ===== ACCOUNT STAFF ROLE =====
export const AccountStaffRole = {
  ADMIN: 1,
  SELLER: 2,
  WAREHOUSE: 3,
} as const;

export type AccountStaffRoleValue = (typeof AccountStaffRole)[keyof typeof AccountStaffRole];

// ===== ACCOUNT STATUS =====
export const AccountStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
  BANNED: -1,
  NOT_ACTIVE_EMAIL: 2,
} as const;

export type AccountStatusValue = (typeof AccountStatus)[keyof typeof AccountStatus];

// ===== SORT =====
export const StaffSortBy = {
  CREATED_AT: 'createdAt',
  EMAIL: 'email',
  LAST_LOGIN_AT: 'lastLoginAt',
  DATE_OF_BIRTH: 'dateOfBirth',
  FULL_NAME: 'fullName',
} as const;

export type StaffSortByValue = (typeof StaffSortBy)[keyof typeof StaffSortBy];

// ===== ORDER =====
export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrderValue = (typeof SortOrder)[keyof typeof SortOrder];

// ===== PAGINATION =====
export const Pagination = {
  MIN_PAGE: 1,
  DEFAULT_PAGE: 1,

  MIN_LIMIT: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

export type PaginationValue = (typeof Pagination)[keyof typeof Pagination];

// ===== SEX =====
export const Sex = {
  UNKNOWN: 0,
  MALE: 1,
  FEMALE: 2,
} as const;

export type SexValue = (typeof Sex)[keyof typeof Sex];
