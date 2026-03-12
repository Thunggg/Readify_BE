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

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
  ) {}

  async getTickets(query: GetTicketsQueryDto) {
    const { search, statusFilter, sortBy, order, page, limit } = query;

    const filter: any = {};

    // Filter by status
    if (statusFilter) {
      filter.status = { $in: statusFilter };
    }

    // search by ticketID, Customer name (first name + last name), email, subject
    if (search) {
      filter.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { 'customerId.firstName': { $regex: search, $options: 'i' } },
        { 'customerId.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    // sort by createdAt, lastMessageAt, subject, email and default sort by createdAt DESC
    const sortField = sortBy ?? TicketSortBy.CREATED_AT;

    const sort: Partial<Record<TicketSortByValue, 1 | -1>> = {
      [sortField]: order === SortOrder.ASC ? 1 : -1,
    };

    const currentPage = page ?? 1;
    const pageSize = limit ?? 10;

    const skip = (currentPage - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit ?? 10)
        .populate('customerId')
        .populate('assignedToId')
        .lean(),
      this.ticketModel.countDocuments(filter),
    ]);

    return new PaginatedResponse(
      items,
      {
        page: page ?? 1,
        limit: limit ?? 10,
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
