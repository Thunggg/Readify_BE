import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;

@Schema()
export class Account {
  // ========== BASIC INFO ==========
  @Prop({ trim: true })
  firstName: string;

  @Prop({ trim: true })
  lastName: string;

  @Prop()
  dateOfBirth: Date;

  @Prop()
  phone: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  address: string;

  // ========== AUTH INFO ==========
  @Prop({ trim: true, unique: true, lowercase: true, required: true, index: true })
  email: string;

  @Prop({ trim: true })
  password: string;

  @Prop({ trim: true })
  googleId?: string;

  @Prop()
  lastLoginAt?: Date;

  // ========== STATUS ==========
  @Prop({ default: 1 })
  status: number; // 1: active, 0: inactive, -1: banned, 2: not active email

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: 0 })
  role: number; // 0: user, 1: admin, 2: seller, 3: warehouse manager

  @Prop({ default: 0 })
  sex: number; // 1: male, 2: female
}

export const AccountSchema = SchemaFactory.createForClass(Account);
