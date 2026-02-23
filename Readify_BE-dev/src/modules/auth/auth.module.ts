import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Account, AccountSchema } from '../accounts/schemas/account.schema';
import { JwtUtil } from 'src/shared/utils/jwt';
import { RefreshToken, RefreshTokenSchema } from '../accounts/schemas/refresh-token.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PendingRegistration, PendingRegistrationSchema } from '../accounts/schemas/pendingRegistration.schema';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // secrets lấy từ ConfigService trong JwtUtil/AuthService
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    MongooseModule.forFeature([{ name: RefreshToken.name, schema: RefreshTokenSchema }]),
    MongooseModule.forFeature([{ name: PendingRegistration.name, schema: PendingRegistrationSchema }]),
    OtpModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtUtil, JwtStrategy],
})
export class AuthModule { }
