import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from '../accounts/schemas/account.schema';
import { AdminTicketsController } from './admin-tickets.controller';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import { TicketsController } from './customer-tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [TicketsController, AdminTicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
