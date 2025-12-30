import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromotionLogController } from './promotion-log.controller';
import { PromotionLogService } from './promotion-log.service';
import { PromotionLog, PromotionLogSchema } from './schemas/promotion-log.schema';
import { Account, AccountSchema } from '../accounts/schemas/account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PromotionLog.name, schema: PromotionLogSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [PromotionLogController],
  providers: [PromotionLogService],
  exports: [PromotionLogService],
})
export class PromotionLogModule {}
