import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Model, Types, type QueryFilter } from 'mongoose';
import { Account, AccountDocument } from './schemas/account.schema';
import { RegisterAccountDto } from './dto/register-account.dto';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { comparePassword, hashPassword } from 'src/shared/utils/bcrypt';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { PaginatedResponse } from 'src/shared/responses/paginated.response';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountRole, AccountStatus, SortOrder, StaffSortBy } from '../staff/constants/staff.enum';
import { UpdateAccountDto } from './dto/edit-account.dto';
import { SearchAccountDto } from './dto/search-account.dto';
import { ForgotPasswordRequestDto } from './dto/forgot-password.dto';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/enum/otp-purpose.enum';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import { PendingRegistration, PendingRegistrationDocument } from './schemas/pendingRegistration.schema';
import { JwtUtil } from 'src/shared/utils/jwt';

@Injectable()
export class AccountsService {
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
  ) {}

  async register(dto: RegisterAccountDto) {
    const email = dto.email.trim().toLowerCase();

    const isEmailExists = await this.accountModel.exists({ email });
    if (isEmailExists) {
      throw new HttpException(
        new ErrorResponse('Email already exists', 'EMAIL_ALREADY_EXISTS', 400, [
          { field: 'email', message: 'Email already exists' },
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
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000); // 15 phút

    // Lưu pending registration (upsert) — CHƯA tạo Account
    await this.pendingRegistrationModel.updateOne(
      { email },
      {
        $set: {
          email,
          password: passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: dto.phone.trim(),
          address: dto.address.trim(),
          dateOfBirth: new Date(dto.dateOfBirth),
          sex: dto.sex,
          expiresAt,
        },
      },
      { upsert: true },
    );

    // Gửi OTP verify email (nếu đã gửi rồi thì fallback sang resend)
    try {
      await this.otpService.sendOtp({ email, purpose: OtpPurpose.VERIFY_EMAIL });
    } catch (err: any) {
      await this.otpService.reSendOtp({ email, purpose: OtpPurpose.VERIFY_EMAIL });
    }

    return new SuccessResponse(null, 'OTP sent successfully. Please verify to complete registration.', 200);
  }

  async verifyRegister(regEmail: string, otp: string) {
    const email = (regEmail ?? '').trim().toLowerCase();
    if (!email) {
      throw new HttpException(ErrorResponse.badRequest('Missing OTP email'), HttpStatus.BAD_REQUEST);
    }

    // nếu email đã tồn tại trong database thì throw lỗi
    const isEmailExists = await this.accountModel.exists({ email });
    if (isEmailExists) {
      throw new HttpException(
        new ErrorResponse('Email already exists', 'EMAIL_ALREADY_EXISTS', 400, [
          { field: 'email', message: 'Email already exists' },
        ]),
        400,
      );
    }

    // nếu email tồn tại trong pending registration thì lấy thông tin từ pending registration
    const pending = await this.pendingRegistrationModel.findOne({ email }).select('+password').lean();
    if (!pending) {
      throw new HttpException(
        ErrorResponse.notFound('Pending registration not found or expired'),
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify OTP (đúng purpose VERIFY_EMAIL). Nếu OK otp record sẽ bị xoá trong otpService
    await this.otpService.verifyOtp({ email, otp, purpose: OtpPurpose.VERIFY_EMAIL });

    // Tạo Account thật
    const created = await this.accountModel.create({
      firstName: pending.firstName,
      lastName: pending.lastName,
      phone: pending.phone,
      address: pending.address,
      dateOfBirth: pending.dateOfBirth,
      email,
      password: pending.password,
      role: AccountRole.USER,
      status: AccountStatus.ACTIVE,
      sex: pending.sex ?? 0,
      lastLoginAt: undefined,
      isDeleted: false,
    });

    // Xoá pending
    await this.pendingRegistrationModel.deleteOne({ _id: pending._id });

    const { password, ...account } = created.toObject();
    return new SuccessResponse(account, 'Registration verified and account created successfully', 200);
  }

  async me(userId: string) {
    const account = await this.accountModel.findById(userId).select({ password: 0 }).lean();

    if (!account) {
      throw new HttpException(new ErrorResponse('Account not found', 'ACCOUNT_NOT_FOUND', 404), 404);
    }

    return new SuccessResponse(account, 'Account fetched successfully', 200);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpException(
        new ErrorResponse('Invalid account id', 'INVALID_ACCOUNT_ID', HttpStatus.BAD_REQUEST),
        HttpStatus.BAD_REQUEST,
      );
    }

    const account = await this.accountModel.findById(userId);

    if (!account || account.isDeleted === true) {
      throw new HttpException(
        new ErrorResponse('Account not found', 'ACCOUNT_NOT_FOUND', HttpStatus.NOT_FOUND),
        HttpStatus.NOT_FOUND,
      );
    }

    if (account.status === AccountStatus.BANNED) {
      throw new HttpException(
        new ErrorResponse('Account is banned', 'ACCOUNT_BANNED', HttpStatus.FORBIDDEN),
        HttpStatus.FORBIDDEN,
      );
    }

    if (dto.firstName !== undefined) account.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) account.lastName = dto.lastName.trim();
    if (dto.dateOfBirth !== undefined) account.dateOfBirth = dto.dateOfBirth;
    if (dto.phone !== undefined) account.phone = dto.phone;
    if (dto.avatarUrl !== undefined) account.avatarUrl = dto.avatarUrl;
    if (dto.address !== undefined) account.address = dto.address;
    if (dto.sex !== undefined) account.sex = dto.sex;

    const saved = await account.save();
    const { password, ...accountData } = saved.toObject();

    return new SuccessResponse(accountData, 'Profile updated successfully', 200);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpException(
        new ErrorResponse('Invalid account id', 'INVALID_ACCOUNT_ID', HttpStatus.BAD_REQUEST),
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new HttpException(
        ErrorResponse.badRequest('New password and confirm password do not match'),
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new HttpException(ErrorResponse.badRequest('New password must be different'), HttpStatus.BAD_REQUEST);
    }

    const account = await this.accountModel.findById(userId).select('+password');

    if (!account || account.isDeleted === true) {
      throw new HttpException(
        new ErrorResponse('Account not found', 'ACCOUNT_NOT_FOUND', HttpStatus.NOT_FOUND),
        HttpStatus.NOT_FOUND,
      );
    }

    if (account.status === AccountStatus.BANNED) {
      throw new HttpException(
        new ErrorResponse('Account is banned', 'ACCOUNT_BANNED', HttpStatus.FORBIDDEN),
        HttpStatus.FORBIDDEN,
      );
    }

    const ok = await comparePassword(dto.currentPassword, account.password);
    if (!ok) {
      throw new HttpException(ErrorResponse.badRequest('Current password is incorrect'), HttpStatus.BAD_REQUEST);
    }

    account.password = await hashPassword(dto.newPassword, Number(this.configService.get<number>('bcrypt.saltRounds')));
    const saved = await account.save();

    // Security: invalidate refresh tokens so user must login again on other devices
    await this.refreshTokenModel.deleteMany({ userId: saved._id });

    return new SuccessResponse(null, 'Password changed successfully', 200);
  }

  async uploadFile(file: Express.Multer.File) {
    console.log(file);
  }

  async createAccount(dto: CreateAccountDto) {
    const email = dto.email.trim().toLowerCase();

    const isEmailExists = await this.accountModel.findOne({ email });

    if (isEmailExists) {
      throw new HttpException(
        new ErrorResponse('Email already exists', 'EMAIL_ALREADY_EXISTS', 400, [
          { field: 'email', message: 'Email already exists' },
        ]),
        400,
      );
    }

    const passwordHash = await hashPassword(dto.password, Number(this.configService.get<number>('bcrypt.saltRounds')));

    const created = await this.accountModel.create({
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      dateOfBirth: dto.dateOfBirth,
      phone: dto.phone,
      address: dto.address,
      email,
      password: passwordHash,
      role: AccountRole.USER,
      status: dto.status ?? AccountStatus.ACTIVE,
      sex: dto.sex ?? 0,
      lastLoginAt: undefined,
    });

    const { password, ...account } = created.toObject();

    return new SuccessResponse(account, 'Account created successfully', 200);
  }

  async editAccount(id: string, dto: UpdateAccountDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(new ErrorResponse('Invalid account id', 'INVALID_ACCOUNT_ID', 400), 400);
    }

    const account = await this.accountModel.findById(id);

    if (!account) {
      throw new HttpException(new ErrorResponse('Account not found', 'ACCOUNT_NOT_FOUND', 404), 404);
    }

    if (account?.role !== AccountRole.USER) {
      throw new HttpException(new ErrorResponse('Account is not a user', 'ACCOUNT_NOT_A_USER', 400), 400);
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const exists = await this.accountModel.exists({ email, _id: { $ne: account._id } });
      if (exists) {
        throw new HttpException(
          new ErrorResponse('Email already exists', 'EMAIL_ALREADY_EXISTS', 400, [
            { field: 'email', message: 'Email already exists' },
          ]),
          400,
        );
      }
      account.email = email;
    }

    if (dto.password !== undefined) {
      account.password = await hashPassword(dto.password, Number(this.configService.get<number>('bcrypt.saltRounds')));
    }

    if (dto.firstName !== undefined) account.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) account.lastName = dto.lastName.trim();
    if (dto.dateOfBirth !== undefined) account.dateOfBirth = dto.dateOfBirth;
    if (dto.phone !== undefined) account.phone = dto.phone;
    if (dto.avatarUrl !== undefined) account.avatarUrl = dto.avatarUrl;
    if (dto.address !== undefined) account.address = dto.address;
    if (dto.status !== undefined) account.status = dto.status;
    if (dto.sex !== undefined) account.sex = dto.sex;

    const saved = await account.save();
    const { password, ...accountData } = saved.toObject();

    return new SuccessResponse(accountData, 'Account updated successfully', 200);
  }

  async deleteAccount(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(new ErrorResponse('Invalid account id', 'INVALID_ACCOUNT_ID', 400), 400);
    }

    const account = await this.accountModel.findById(id);

    if (!account) {
      throw new HttpException(new ErrorResponse('Account not found', 'ACCOUNT_NOT_FOUND', 404), 404);
    }

    if (account?.role !== AccountRole.USER) {
      throw new HttpException(new ErrorResponse('Account is not a user', 'ACCOUNT_NOT_A_USER', 400), 400);
    }

    if (account.isDeleted === true) {
      throw new HttpException(new ErrorResponse('Account already deleted', 'ACCOUNT_ALREADY_DELETED', 400), 400);
    }

    account.isDeleted = true;
    await account.save();

    return new SuccessResponse(null, 'Account deleted successfully', 200);
  }

  async getAccountDetail(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(new ErrorResponse('Invalid account id', 'INVALID_ACCOUNT_ID', 400), 400);
    }

    const account = await this.accountModel.findById(id).select({ password: 0 }).lean();

    if (!account) {
      throw new HttpException(new ErrorResponse('Account not found', 'ACCOUNT_NOT_FOUND', 404), 404);
    }

    return new SuccessResponse(account, 'Get account detail successfully', 200);
  }

  async getAccountList(query: SearchAccountDto) {
    const {
      q,
      status,
      isDeleted,
      sortBy = StaffSortBy.CREATED_AT,
      order = SortOrder.DESC,
      page = 1,
      limit = 10,
    } = query;

    // PAGINATION
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // FILTER
    const filter: QueryFilter<AccountDocument> = {
      role: {
        $in: [AccountRole.USER],
        $ne: AccountRole.ADMIN,
      },
      status: { $ne: AccountStatus.BANNED },
    };

    if (isDeleted === true) filter.isDeleted = true;
    else filter.isDeleted = { $ne: true };

    if (status !== undefined) {
      filter.status = status;
    }

    if (q) {
      const tokens = q.trim().split(/\s+/).filter(Boolean).slice(0, 5);

      const fields = ['firstName', 'lastName', 'email', 'phone'] as const;

      filter.$and = tokens.map((kw) => ({
        $or: fields.map((f) => ({
          [f]: { $regex: kw, $options: 'i' },
        })),
      }));
    }

    // SORT
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      createdAt: { createdAt: order === 'asc' ? 1 : -1 },
      email: { email: order === 'asc' ? 1 : -1 },
      firstName: {
        firstName: order === 'asc' ? 1 : -1,
        lastName: order === 'asc' ? 1 : -1,
      },
      lastName: {
        lastName: order === 'asc' ? 1 : -1,
        firstName: order === 'asc' ? 1 : -1,
      },
      lastLoginAt: { lastLoginAt: order === 'asc' ? 1 : -1 },
    };

    const sort: Record<string, 1 | -1> = {
      ...(sortMap[sortBy] ?? { createdAt: -1 }),
      _id: 1,
    };

    // QUERY
    const [items, total] = await Promise.all([
      this.accountModel
        .find(filter)
        .sort(sort as Parameters<ReturnType<Model<AccountDocument>['find']>['sort']>[0])
        .skip(skip)
        .limit(validLimit)
        .select({ password: 0 })
        .lean(),
      this.accountModel.countDocuments(filter),
    ]);

    return new PaginatedResponse(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Account list retrieved successfully',
    );
  }

  async forgotPassword(dto: ForgotPasswordRequestDto) {
    const email = dto.email.trim().toLowerCase();

    const account = await this.accountModel.findOne({ email });

    if (!account) {
      throw new HttpException(
        new ErrorResponse('If the email exists, an OTP has been sent', 'ACCOUNT_NOT_FOUND', HttpStatus.NOT_FOUND),
        HttpStatus.NOT_FOUND,
      );
    }

    if (account?.status !== AccountStatus.ACTIVE || account?.isDeleted === true) {
      throw new HttpException(
        new ErrorResponse('Account is delete or banned', 'ACCOUNT_IS_DELETED_OR_BANNED', HttpStatus.BAD_REQUEST),
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.otpService.sendOtp({ email, purpose: OtpPurpose.FORGOT_PASSWORD });
    } catch (err) {
      // Nếu OTP đã được gửi (hoặc bất kỳ lỗi OTP nào khác), giữ nguyên phản hồi không tiết lộ
      return new SuccessResponse(null, 'If the email exists, an OTP has been sent', 200);
    }

    return new SuccessResponse(null, 'If the email exists, an OTP has been sent', 200);
  }

  async resendForgotPasswordOtp(rawEmail: string) {
    const email = (rawEmail ?? '').trim().toLowerCase();
    if (!email) {
      return new SuccessResponse(null, 'If the email exists, an OTP has been sent', 200);
    }

    try {
      await this.otpService.reSendOtp({ email, purpose: OtpPurpose.FORGOT_PASSWORD });
    } catch (err) {
      // nếu bản ghi không tồn tại (hết hạn / không bao giờ gửi) thì gửi lại OTP
      // nếu bản ghi tồn tại (cooldown / blocked / max resend) thì throw lỗi
      if (err instanceof HttpException && err.getStatus() === 404) {
        await this.otpService.sendOtp({ email, purpose: OtpPurpose.FORGOT_PASSWORD });
      } else {
        throw err;
      }
    }

    return new SuccessResponse(null, 'If the email exists, an OTP has been sent', 200);
  }

  async verifyForgotPasswordOtp(regEmail: string, otp: string) {
    const email = (regEmail ?? '').trim().toLowerCase();
    if (!email) {
      throw new HttpException(ErrorResponse.badRequest('Missing OTP email'), HttpStatus.BAD_REQUEST);
    }

    const account = await this.accountModel.findOne({ email });
    if (!account) {
      throw new HttpException(ErrorResponse.notFound('OTP record not found'), HttpStatus.NOT_FOUND);
    }

    if (account?.status !== AccountStatus.ACTIVE || account?.isDeleted === true) {
      throw new HttpException(ErrorResponse.badRequest('Account is delete or banned'), HttpStatus.BAD_REQUEST);
    }

    await this.otpService.verifyOtp({ email, otp, purpose: OtpPurpose.FORGOT_PASSWORD });

    const secret =
      (this.configService.get<string>('jwt.resetPasswordSecret') as string) ||
      (this.configService.get<string>('jwt.accessTokenSecret') as string);
    const expiresIn = Number(this.configService.get<number>('jwt.resetPasswordExpiresIn') ?? 15 * 60);

    const resetPasswordToken = this.jwtUtil.signResetPasswordToken(
      { sub: account._id as any, email: account.email, purpose: 'reset_password' },
      secret,
      expiresIn,
    );

    return new SuccessResponse({ resetPasswordToken }, 'Verify OTP successfully', 200);
  }

  async resetPassword(resetPasswordToken: string, dto: ResetPasswordDto) {
    if (!resetPasswordToken) {
      throw new HttpException(ErrorResponse.badRequest('Missing resetPasswordToken cookie'), HttpStatus.BAD_REQUEST);
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new HttpException(
        ErrorResponse.badRequest('New password and confirm password do not match'),
        HttpStatus.BAD_REQUEST,
      );
    }

    const secret =
      (this.configService.get<string>('jwt.resetPasswordSecret') as string) ||
      (this.configService.get<string>('jwt.accessTokenSecret') as string);

    let payload: { sub: any; email: string; purpose: string };
    try {
      payload = this.jwtUtil.verifyResetPasswordToken(resetPasswordToken, secret) as any;
    } catch {
      throw new HttpException(ErrorResponse.badRequest('Invalid or expired reset token'), HttpStatus.BAD_REQUEST);
    }

    if (payload?.purpose !== 'reset_password') {
      throw new HttpException(ErrorResponse.badRequest('Invalid reset token purpose'), HttpStatus.BAD_REQUEST);
    }

    const account = await this.accountModel.findById(payload.sub).select('+password');
    if (!account) {
      throw new HttpException(
        new ErrorResponse('Account not found', 'ACCOUNT_NOT_FOUND', HttpStatus.NOT_FOUND),
        HttpStatus.NOT_FOUND,
      );
    }

    if (account?.status !== AccountStatus.ACTIVE || account?.isDeleted === true) {
      throw new HttpException(
        new ErrorResponse('Account is delete or banned', 'ACCOUNT_IS_DELETED_OR_BANNED', HttpStatus.BAD_REQUEST),
        HttpStatus.BAD_REQUEST,
      );
    }

    if (payload.email && payload.email !== account.email) {
      throw new HttpException(ErrorResponse.badRequest('Reset token email mismatch'), HttpStatus.BAD_REQUEST);
    }

    account.password = await hashPassword(dto.newPassword, Number(this.configService.get<number>('bcrypt.saltRounds')));
    await account.save();

    await this.refreshTokenModel.deleteMany({ userId: account._id });

    const { password, ...accountData } = account.toObject();
    return new SuccessResponse(accountData, 'Password reset successfully', 200);
  }
}
