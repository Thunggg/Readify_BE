import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './schemas/account.schema';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]), OtpModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
