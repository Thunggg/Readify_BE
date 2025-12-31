import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './schemas/account.schema';
import { OtpModule } from '../otp/otp.module';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { PendingRegistration, PendingRegistrationSchema } from './schemas/pendingRegistration.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: PendingRegistration.name, schema: PendingRegistrationSchema },
    ]),
    OtpModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
