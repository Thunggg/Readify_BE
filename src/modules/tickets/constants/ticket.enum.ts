export const TicketStatus = {
  OPEN: 'OPEN',
  WAITING_ADMIN: 'WAITING_ADMIN',
  WAITING_CUSTOMER: 'WAITING_CUSTOMER',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type TicketStatusValue = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketSenderRole = {
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF',
} as const;

export type TicketSenderRoleValue = (typeof TicketSenderRole)[keyof typeof TicketSenderRole];

export const TicketSortBy = {
  CREATED_AT: 'createdAt',
  LAST_MESSAGE_AT: 'lastMessageAt',
  UPDATED_AT: 'updatedAt',
} as const;

export type TicketSortByValue = (typeof TicketSortBy)[keyof typeof TicketSortBy];

export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrderValue = (typeof SortOrder)[keyof typeof SortOrder];

