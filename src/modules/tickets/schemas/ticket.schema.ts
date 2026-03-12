import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Account } from '../../accounts/schemas/account.schema';
import type { TicketSenderRoleValue, TicketStatusValue } from '../constants/ticket.enum';

export type TicketDocument = HydratedDocument<Ticket>;

@Schema({ _id: false })
export class TicketMessage {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Account.name, required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  senderRole: TicketSenderRoleValue;

  @Prop({ required: true, trim: true, maxlength: 5000 })
  body: string;

  @Prop({ type: Date, required: true, default: () => new Date() })
  createdAt: Date;
}

export const TicketMessageSchema = SchemaFactory.createForClass(TicketMessage);

@Schema({ _id: false })
export class TicketCsat {
  @Prop({ type: Number, min: 1, max: 5 })
  rating?: number;

  @Prop({ type: String, trim: true, maxlength: 2000 })
  comment?: string;

  @Prop({ type: Date })
  submittedAt?: Date;
}

export const TicketCsatSchema = SchemaFactory.createForClass(TicketCsat);

@Schema({ timestamps: true, collection: 'support_tickets' })
export class Ticket {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Account.name, required: true, index: true })
  customerId: Types.ObjectId; // customer id

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Account.name, index: true })
  assignedToId?: Types.ObjectId; // assigned to id

  @Prop({ required: true, trim: true, maxlength: 200 })
  subject: string; // nội dung ticket

  @Prop({ required: true, default: 'OPEN', index: true })
  status: TicketStatusValue; // trạng thái ticket

  @Prop({ type: [TicketMessageSchema], default: [] })
  messages: TicketMessage[]; // tin nhắn ticket

  @Prop({ type: Date })
  lastMessageAt?: Date; // thời gian tin nhắn cuối cùng

  @Prop({ type: Date })
  closedAt?: Date; // thời gian đóng ticket

  @Prop({ type: TicketCsatSchema })
  csat?: TicketCsat; // đánh giá csat
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

TicketSchema.index({ customerId: 1, createdAt: -1 });
TicketSchema.index({ status: 1, lastMessageAt: -1, createdAt: -1 });
