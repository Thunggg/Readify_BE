import { HttpException, Injectable } from '@nestjs/common';
import { Model, ObjectId } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { comparePassword, hashPassword } from 'src/shared/utils/bcrypt';
import { Account, AccountDocument } from '../accounts/schemas/account.schema';
import { JwtUtil } from 'src/shared/utils/jwt';
import { LoginDto } from './dto/login.dto';
import { RefreshToken, RefreshTokenDocument } from '../accounts/schemas/refresh-token.schema';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { RegisterAccountDto } from './dto/register-account.dto';
import { PendingRegistration, PendingRegistrationDocument } from '../accounts/schemas/pendingRegistration.schema';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/enum/otp-purpose.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(PendingRegistration.name)
    private readonly pendingRegistrationModel: Model<PendingRegistrationDocument>,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly jwtUtil: JwtUtil,
  ) { }

  async register(dto: RegisterAccountDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();

    const [isEmailExists, isPhoneExists] = await Promise.all([
      this.accountModel.exists({ email }),
      this.accountModel.exists({ phone }),
    ]);

    if (isEmailExists) {
      throw new HttpException(
        new ErrorResponse('Email already exists', 'EMAIL_ALREADY_EXISTS', 400, [
          { field: 'email', message: 'Email already exists' },
        ]),
        400,
      );
    }

    if (isPhoneExists) {
      throw new HttpException(
        new ErrorResponse('Phone number already exists', 'PHONE_ALREADY_EXISTS', 400, [
          { field: 'phone', message: 'Phone number already exists' },
        ]),
        400,
      );
    }

    if (dto.password !== dto.confirmPassword) {
      throw new HttpException(
        ErrorResponse.validationError([{ message: 'Password and confirm password do not match' }]),
        400,
      );
    }

    const passwordHash = await hashPassword(
      dto.password,
      this.configService.get<number>('bcrypt.saltRounds') as number,
    );

    const expiresInMinutes = Number(this.configService.get<number>('pendingRegistration.expiresInMinutes') ?? 15);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Save pending registration (upsert) — Account is created after email verification
    await this.pendingRegistrationModel.updateOne(
      { email },
      {
        $set: {
          email,
          password: passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: phone,
          address: dto.address.trim(),
          dateOfBirth: new Date(dto.dateOfBirth),
          sex: dto.sex,
          expiresAt,
        },
      },
      { upsert: true },
    );

    // Send OTP verify email (fallback to resend if record exists)
    try {
      await this.otpService.sendOtp({ email, purpose: OtpPurpose.VERIFY_EMAIL });
    } catch (err: any) {
      await this.otpService.reSendOtp({ email, purpose: OtpPurpose.VERIFY_EMAIL });
    }

    return new SuccessResponse(null, 'OTP sent successfully. Please verify to complete registration.', 200);
  }

  async register(dto: RegisterAccountDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();

    const [isEmailExists, isPhoneExists] = await Promise.all([
      this.accountModel.exists({ email }),
      this.accountModel.exists({ phone }),
    ]);

    if (isEmailExists) {
      throw new HttpException(
        new ErrorResponse('Email already exists', 'EMAIL_ALREADY_EXISTS', 400, [
          { field: 'email', message: 'Email already exists' },
        ]),
        400,
      );
    }

    if (isPhoneExists) {
      throw new HttpException(
        new ErrorResponse('Phone number already exists', 'PHONE_ALREADY_EXISTS', 400, [
          { field: 'phone', message: 'Phone number already exists' },
        ]),
        400,
      );
    }

    if (dto.password !== dto.confirmPassword) {
      throw new HttpException(
        ErrorResponse.validationError([{ message: 'Password and confirm password do not match' }]),
        400,
      );
    }

    const passwordHash = await hashPassword(
      dto.password,
      this.configService.get<number>('bcrypt.saltRounds') as number,
    );

    const expiresInMinutes = Number(this.configService.get<number>('pendingRegistration.expiresInMinutes') ?? 15);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Save pending registration (upsert) — Account is created after email verification
    await this.pendingRegistrationModel.updateOne(
      { email },
      {
        $set: {
          email,
          password: passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: phone,
          address: dto.address.trim(),
          dateOfBirth: new Date(dto.dateOfBirth),
          sex: dto.sex,
          expiresAt,
        },
      },
      { upsert: true },
    );

    // Send OTP verify email (fallback to resend if record exists)
    try {
      await this.otpService.sendOtp({ email, purpose: OtpPurpose.VERIFY_EMAIL });
    } catch (err: any) {
      await this.otpService.reSendOtp({ email, purpose: OtpPurpose.VERIFY_EMAIL });
    }

    return new SuccessResponse(null, 'OTP sent successfully. Please verify to complete registration.', 200);
  }

  async login(dto: LoginDto, { userAgent, ipAddress }: { userAgent: string; ipAddress: string }) {
    const email = dto.email.trim().toLowerCase();
    const password = dto.password;

    // 1) find account by email
    const account = await this.accountModel.findOne({ email }).select('+password');

    if (!account) {
      throw new HttpException(new ErrorResponse('Email or password is incorrect', 'INVALID_CREDENTIALS', 400), 400);
    }

    // 2) compare password
    const isPasswordValid = await comparePassword(password, account.password);

    if (!isPasswordValid) {
      throw new HttpException(new ErrorResponse('Email or password is incorrect', 'INVALID_CREDENTIALS', 400), 400);
    }

    // 3) check email is verified or not
    if (account.status === 2) {
      throw new HttpException(new ErrorResponse('Email is not verified', 'EMAIL_NOT_VERIFIED', 400), 400);
    }

    // 4) generate access token and refresh token
    const accessToken = this.jwtUtil.signAccessToken(
      { sub: account._id as unknown as ObjectId, email: account.email, role: account.role },
      this.configService.get<string>('jwt.accessTokenSecret') as string,
      this.configService.get<number>('jwt.accessTokenExpiresIn') as number,
    );

    const refreshToken = this.jwtUtil.signRefreshToken(
      { sub: account._id as unknown as ObjectId },
      this.configService.get<string>('jwt.refreshTokenSecret') as string,
      this.configService.get<number>('jwt.refreshTokenExpiresIn') as number,
    );

    // 5) hash refresh token and save to database
    await this.refreshTokenModel.create({
      userId: account._id,
      token: refreshToken,
      createdAt: new Date(),
      updatedAt: new Date(),
      userAgent,
      ipAddress,
      lastUsedAt: new Date(),
    });

    return new SuccessResponse({ accessToken, refreshToken }, 'Login successful', 200);
  }

  async logout(token: string) {
    if (!token) {
      throw new HttpException(new ErrorResponse('Unauthorized', 'UNAUTHORIZED', 401), 401);
    }

    const userId = this.jwtUtil.verifyAccessToken(
      token,
      this.configService.get<string>('jwt.accessTokenSecret') as string,
    ).sub;

    await this.refreshTokenModel.deleteOne({ userId });
    return new SuccessResponse('Logged out successfully', 'LOGOUT_SUCCESS', 200);
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new HttpException(new ErrorResponse('Unauthorized', 'UNAUTHORIZED', 401), 401);
    }

    try {
      // 1) verify refresh token
      const verifiedRefreshToken = this.jwtUtil.verifyRefreshToken(
        refreshToken,
        this.configService.get<string>('jwt.refreshTokenSecret') as string,
      );
      if (!verifiedRefreshToken) {
        throw new HttpException(new ErrorResponse('Unauthorized', 'UNAUTHORIZED', 401), 401);
      }

      // 2) tìm refresh token trong database
      const refreshTokenDocument = await this.refreshTokenModel.findOne({ token: refreshToken });

      if (!refreshTokenDocument) {
        throw new HttpException(new ErrorResponse('Unauthorized', 'UNAUTHORIZED', 401), 401);
      }

      // 3) lay thong tin account
      const account = await this.accountModel.findById(refreshTokenDocument.userId);

      if (!account) {
        throw new HttpException(new ErrorResponse('Unauthorized', 'UNAUTHORIZED', 401), 401);
      }

      // 4) tao access token moi
      const accessToken = this.jwtUtil.signAccessToken(
        { sub: account._id as unknown as ObjectId, email: account.email, role: account.role },
        this.configService.get<string>('jwt.accessTokenSecret') as string,
        this.configService.get<number>('jwt.accessTokenExpiresIn') as number,
      );

      return new SuccessResponse({ accessToken }, 'Refresh token successful', 200);
    } catch (error) {
      throw new HttpException(new ErrorResponse('Unauthorized', 'UNAUTHORIZED', 401), 401);
    }
  }
}
