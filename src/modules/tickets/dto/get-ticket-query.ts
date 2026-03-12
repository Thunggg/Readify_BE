import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SortOrder, TicketSortBy, TicketStatus } from '../constants/ticket.enum';

import type { TicketStatusValue, TicketSortByValue, SortOrderValue } from '../constants/ticket.enum';

export class GetTicketsQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // search by ticketID, Customer name (first name + last name), email, subject

  @IsOptional()
  @IsEnum(TicketStatus, { each: true })
  statusFilter?: TicketStatusValue[];

  @IsOptional()
  @IsEnum(TicketSortBy)
  sortBy?: TicketSortByValue; // sort by createdAt, updatedAt, subject, status

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrderValue; // sort order

  @IsOptional()
  @IsString()
  page?: number; // page number

  @IsOptional()
  @IsString()
  limit?: number; // number of tickets per page
}
