import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentLogsService } from './payment-logs.service';
import { PaymentLogsController } from './payment-logs.controller';
import { PaymentLog, PaymentLogSchema } from './schemas/payment-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentLog.name, schema: PaymentLogSchema },
    ]),
  ],
  controllers: [PaymentLogsController],
  providers: [PaymentLogsService],
  exports: [PaymentLogsService],
})
export class PaymentLogsModule {}
