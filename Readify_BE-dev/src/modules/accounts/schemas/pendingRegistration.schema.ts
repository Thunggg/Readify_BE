import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PendingRegistrationDocument = HydratedDocument<PendingRegistration>;

@Schema({ timestamps: true, collection: 'pending_registrations' })
export class PendingRegistration {
  @Prop({ trim: true, lowercase: true, required: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ trim: true })
  firstName: string;

  @Prop({ trim: true })
  lastName: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  address: string;

  @Prop({ type: Date })
  dateOfBirth: Date;

  @Prop({ type: Number, default: 0 })
  sex: number;

  // TTL index will use this field
  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const PendingRegistrationSchema = SchemaFactory.createForClass(PendingRegistration);

PendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PendingRegistrationSchema.index({ email: 1 }, { unique: true });
