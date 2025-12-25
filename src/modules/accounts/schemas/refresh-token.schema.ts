import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Account } from './account.schema';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema()
export class RefreshToken {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Account.name })
  userId: Types.ObjectId;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
