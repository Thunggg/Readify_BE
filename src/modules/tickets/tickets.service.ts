import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AccountRole } from '../staff/constants/staff.enum';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { PaginatedResponse } from 'src/shared/responses/paginated.response';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { SortOrder, TicketSenderRole, TicketSortBy, TicketStatus } from './constants/ticket.enum';
import type { SortOrderValue, TicketSortByValue, TicketStatusValue } from './constants/ticket.enum';
import { Ticket, TicketDocument } from './schemas/ticket.schema';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
  ) {}
}
