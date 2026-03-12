import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { AccountRole } from '../staff/constants/staff.enum';
import { TicketsService } from './tickets.service';
import { ReplyTicketDto } from './dto/reply-ticket';
import { GetTicketsQueryDto } from './dto/get-ticket-query';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.ADMIN)
@Controller('admin/tickets')
export class AdminTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // Lấy danh sách toàn bộ tickets
  @Get()
  getTickets(@Query() query: GetTicketsQueryDto) {
    return this.ticketsService.getTickets(query);
  }

  // Admin reply ticket
  @Post(':id/reply')
  replyTicket(@Param('id') id: string, @Body() dto: ReplyTicketDto, @Req() req: any) {
    return this.ticketsService.replyTicket(id, dto, req.user.userId as string);
  }
}
