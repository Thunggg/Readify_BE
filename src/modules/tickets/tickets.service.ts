import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { PipelineStage } from 'mongoose';
import { AccountRole } from '../staff/constants/staff.enum';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { PaginatedResponse } from 'src/shared/responses/paginated.response';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { SortOrder, TicketSenderRole, TicketSortBy, TicketStatus } from './constants/ticket.enum';
import type { SortOrderValue, TicketSortByValue, TicketStatusValue } from './constants/ticket.enum';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { CreateTicketDto } from './dto/create-ticket-customer';
import { ReplyTicketDto } from './dto/reply-ticket';
import { GetTicketsQueryDto } from './dto/get-ticket-query';
import escapeStringRegexp from 'escape-string-regexp';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
  ) {}

  async getTickets(query: GetTicketsQueryDto) {
    const { search, statusFilter, sortBy, order, page, limit } = query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageSize = Math.max(Number(limit) || 10, 1);
    const skip = (currentPage - 1) * pageSize;

    const pipeline: PipelineStage[] = [];

    // Filter by status
    if (Array.isArray(statusFilter) && statusFilter.length > 0) {
      pipeline.push({ $match: { status: { $in: statusFilter } } });
    }

    // Populate customerId and assignedToId (for search/sort)
    pipeline.push(
      {
        $lookup: {
          from: 'accounts',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customerId',
        },
      },
      {
        $unwind: {
          path: '$customerId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'accounts',
          localField: 'assignedToId',
          foreignField: '_id',
          as: 'assignedToId',
        },
      },
      {
        $unwind: {
          path: '$assignedToId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          email: '$customerId.email',
          customerFullName: {
            $concat: [{ $ifNull: ['$customerId.firstName', ''] }, ' ', { $ifNull: ['$customerId.lastName', ''] }],
          },
        },
      },
      // ẩn password
      {
        $project: {
          'customerId.password': 0,
          'assignedToId.password': 0,
        },
      },
    );

    // search by ticketID, Customer name (first name + last name), email, subject
    const normalizedSearch = typeof search === 'string' ? search.trim() : '';
    if (normalizedSearch) {
      const rx = new RegExp(escapeStringRegexp(normalizedSearch), 'i');

      const or: any[] = [{ subject: { $regex: rx } }, { email: { $regex: rx } }, { customerFullName: { $regex: rx } }];

      if (Types.ObjectId.isValid(normalizedSearch)) {
        or.push({ _id: new Types.ObjectId(normalizedSearch) });
      }

      pipeline.push({ $match: { $or: or } });
    }

    // sort by createdAt, lastMessageAt, subject, email and default sort by createdAt DESC
    const sortField = (sortBy ?? TicketSortBy.CREATED_AT) as TicketSortByValue;
    const sortDirection: 1 | -1 = order === SortOrder.ASC ? 1 : -1;

    pipeline.push({
      $sort: {
        [sortField]: sortDirection,
      },
    });

    // remove helper fields from returned documents (after search/sort are done)
    pipeline.push({ $project: { email: 0, customerFullName: 0 } });

    pipeline.push(
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: pageSize }],
          total: [{ $count: 'count' }],
        },
      },
      {
        $project: {
          items: 1,
          total: {
            $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0],
          },
        },
      },
    );

    type TicketListItem = Record<string, unknown>;

    const aggregated = await this.ticketModel.aggregate<{ items: TicketListItem[]; total: number }>(pipeline).exec();
    const items: TicketListItem[] = aggregated?.[0]?.items ?? [];
    const total: number = aggregated?.[0]?.total ?? 0;

    return new PaginatedResponse(
      items,
      {
        page: currentPage,
        limit: pageSize,
        total,
      },
      'Tickets fetched successfully',
    );
  }

  async createTicket(dto: CreateTicketDto, customerId: string) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer id');
    }

    const ticket = await this.ticketModel.create({
      customerId: new Types.ObjectId(customerId),
      subject: dto.subject,
      messages: [
        {
          senderId: new Types.ObjectId(customerId),
          senderRole: TicketSenderRole.CUSTOMER,
          body: dto.message,
          createdAt: new Date(),
        },
      ],
      status: TicketStatus.OPEN,
    });
    return new SuccessResponse(ticket, 'Ticket created successfully');
  }

  async replyTicket(id: string, dto: ReplyTicketDto, staffId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket id');
    }

    const ticket = await this.ticketModel.findById(id);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === 'CLOSED') {
      throw new BadRequestException('Ticket already closed');
    }

    if (!ticket.assignedToId) {
      ticket.assignedToId = new Types.ObjectId(staffId);
    }

    ticket.messages.push({
      senderId: new Types.ObjectId(staffId),
      senderRole: TicketSenderRole.STAFF,
      body: dto.message,
      createdAt: new Date(),
    });
    ticket.lastMessageAt = new Date();
    ticket.status = TicketStatus.WAITING_CUSTOMER;

    await ticket.save();

    return new SuccessResponse(ticket, 'Ticket replied successfully');
  }

  async closeTicket(id: string, customerId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket id');
    }

    const ticket = await this.ticketModel.findById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.customerId.toString() !== customerId) {
      throw new ForbiddenException('You are not allowed to close this ticket');
    }

    ticket.status = TicketStatus.CLOSED;
    ticket.closedAt = new Date();
    await ticket.save();

    return new SuccessResponse(ticket, 'Ticket closed successfully');
  }

  async customerReplyTicket(id: string, dto: ReplyTicketDto, customerId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket id');
    }

    const ticket = await this.ticketModel.findById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.customerId.toString() !== customerId) {
      throw new ForbiddenException('You are not allowed to reply to this ticket');
    }

    if (ticket.status === 'CLOSED') {
      throw new BadRequestException('Ticket already closed');
    }

    ticket.messages.push({
      senderId: new Types.ObjectId(customerId),
      senderRole: TicketSenderRole.CUSTOMER,
      body: dto.message,
      createdAt: new Date(),
    });
    ticket.lastMessageAt = new Date();
    ticket.status = TicketStatus.WAITING_ADMIN;
    await ticket.save();

    return new SuccessResponse(ticket, 'Ticket replied successfully');
  }
}
