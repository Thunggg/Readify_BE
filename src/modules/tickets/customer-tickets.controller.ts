import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { AccountRole } from '../staff/constants/staff.enum';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket-customer';
import { ReplyTicketDto } from './dto/reply-ticket';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.USER)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // Customer gửi ticket cho seller hoặc admin
  @Post()
  createTicket(@Body() dto: CreateTicketDto, @Req() req: any) {
    return this.ticketsService.createTicket(dto, req.user.userId as string);
  }

  // Customer đóng ticket
  @Patch(':id/close')
  closeTicket(@Param('id') id: string, @Req() req: any) {
    return this.ticketsService.closeTicket(id, req.user.userId as string);
  }

  // Customer reply ticket
  @Post(':id/reply')
  replyTicket(@Param('id') id: string, @Body() dto: ReplyTicketDto, @Req() req: any) {
    return this.ticketsService.customerReplyTicket(id, dto, req.user.userId as string);
  }
}
