import { HttpException, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Account, AccountDocument } from './schemas/account.schema';
import { RegisterAccountDto } from './dto/register-account.dto';
import { ApiResponse } from 'src/shared/responses/api-response';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { hashPassword } from 'src/shared/utils/bcrypt';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountRole, AccountStatus, SortOrder, StaffSortBy } from '../staff/constants/staff.enum';
import { UpdateAccountDto } from './dto/edit-account.dto';
import { SearchStaffDto } from '../staff/dto/search-staff.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterAccountDto) {
    const email = dto.email.trim().toLowerCase();

    const isEmailExists = await this.accountModel.findOne({ email });

    if (isEmailExists) {
      throw new HttpException(ApiResponse.error('Email already exists', 'EMAIL_ALREADY_EXISTS', 400), 400);
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

    const newAccount = new this.accountModel({
      email,
      password: passwordHash,
      status: 2,
      role: 0,
      sex: 0,
    });

    const savedAccount = await newAccount.save();
    const { password, ...account } = savedAccount.toObject();

    return ApiResponse.success(account, 'Account created successfully', 200);
  }

  async me(userId: string) {
    const account = await this.accountModel.findById(userId).select({ password: 0 }).lean();

    if (!account) {
      throw new HttpException(ApiResponse.error('Account not found', 'ACCOUNT_NOT_FOUND', 404), 404);
    }

    return ApiResponse.success(account, 'Account fetched successfully', 200);
  }

  async uploadFile(file: Express.Multer.File) {
    console.log(file);
  }

  async createAccount(dto: CreateAccountDto) {
    const email = dto.email.trim().toLowerCase();

    const isEmailExists = await this.accountModel.findOne({ email });

    if (isEmailExists) {
      throw new HttpException(ApiResponse.error('Email already exists', 'EMAIL_ALREADY_EXISTS', 400), 400);
    }

    const passwordHash = await hashPassword(dto.password, Number(this.configService.get<number>('bcrypt.saltRounds')));

    const created = await this.accountModel.create({
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      dateOfBirth: dto.dateOfBirth,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
      address: dto.address,
      email,
      password: passwordHash,
      role: AccountRole.USER,
      status: dto.status ?? AccountStatus.ACTIVE,
      sex: dto.sex ?? 0,
      lastLoginAt: undefined,
    });

    const { password, ...account } = created.toObject();

    return ApiResponse.success(account, 'Account created successfully', 200);
  }

  async editAccount(id: string, dto: UpdateAccountDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(ApiResponse.error('Invalid account id', 'INVALID_ACCOUNT_ID', 400), 400);
    }

    const account = await this.accountModel.findById(id);

    if (!account) {
      throw new HttpException(ApiResponse.error('Account not found', 'ACCOUNT_NOT_FOUND', 404), 404);
    }

    if (account?.role !== AccountRole.USER) {
      throw new HttpException(ApiResponse.error('Account is not a user', 'ACCOUNT_NOT_A_USER', 400), 400);
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const exists = await this.accountModel.exists({ email, _id: { $ne: account._id } });
      if (exists) {
        throw new HttpException(ApiResponse.error('Email already exists', 'EMAIL_ALREADY_EXISTS', 400), 400);
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

    return ApiResponse.success(accountData, 'Account updated successfully', 200);
  }

  async deleteAccount(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(ApiResponse.error('Invalid account id', 'INVALID_ACCOUNT_ID', 400), 400);
    }

    const account = await this.accountModel.findById(id);

    if (!account) {
      throw new HttpException(ApiResponse.error('Account not found', 'ACCOUNT_NOT_FOUND', 404), 404);
    }

    if (account?.role !== AccountRole.USER) {
      throw new HttpException(ApiResponse.error('Account is not a user', 'ACCOUNT_NOT_A_USER', 400), 400);
    }

    if (account.isDeleted === true) {
      throw new HttpException(ApiResponse.error('Account already deleted', 'ACCOUNT_ALREADY_DELETED', 400), 400);
    }

    account.isDeleted = true;
    await account.save();

    return ApiResponse.success(null, 'Account deleted successfully', 200);
  }

  async getAccountDetail(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(ApiResponse.error('Invalid account id', 'INVALID_ACCOUNT_ID', 400), 400);
    }

    const account = await this.accountModel.findById(id).select({ password: 0 }).lean();

    if (!account) {
      throw new HttpException(ApiResponse.error('Account not found', 'ACCOUNT_NOT_FOUND', 404), 404);
    }

    return ApiResponse.success(account, 'Get account detail successfully', 200);
  }

  async getAccountList(query: SearchStaffDto) {
    const {
      q,
      status,
      role,
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
    const filter: any = {
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
    const sortMap: Record<string, any> = {
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

    const sort = {
      ...(sortMap[sortBy] ?? { createdAt: -1 }),
      _id: 1,
    };

    // QUERY
    const [items, total] = await Promise.all([
      this.accountModel.find(filter).sort(sort).skip(skip).limit(validLimit).select({ password: 0 }).lean(),
      this.accountModel.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Account list retrieved successfully',
    );
  }
}
