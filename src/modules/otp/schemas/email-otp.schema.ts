import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EmailOtpDocument = HydratedDocument<EmailOtp>;

@Schema({ timestamps: true, collection: 'email_otps' })
export class EmailOtp {
  @Prop({ trim: true, lowercase: true, required: true })
  email: string;

  @Prop({ trim: true, required: true })
  otpHash: string;

  @Prop({ trim: true, required: true })
  purpose: string; // "forgot_password", "verify_email"

  // TTL index will use this field
  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Number, default: 0 })
  attempts: number;

  @Prop({ type: Number, default: 0 })
  resendCount: number;

  @Prop({ type: Date, required: true })
  lastSentAt: Date;
}

export const EmailOtpSchema = SchemaFactory.createForClass(EmailOtp);

// TTL + unique per purpose
EmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
EmailOtpSchema.index({ email: 1, purpose: 1 }, { unique: true });
