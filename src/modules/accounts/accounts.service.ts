import { HttpException, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Account, AccountDocument } from './schemas/account.schema';
import { RegisterAccountDto } from './dto/register-account.dto';
import { ApiResponse } from 'src/shared/responses/api-response';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { hashPassword } from 'src/shared/utils/bcrypt';

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
      throw new HttpException(ErrorResponse.validationError([{ message: 'Email already exists' }]), 400);
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
    const account = savedAccount.toObject();

    return ApiResponse.success(account, 'Account created successfully', 200);
  }

  async me(userId: string) {
    const account = await this.accountModel.findById(userId);

    if (!account) {
      throw new HttpException(ApiResponse.error('Account not found', 'ACCOUNT_NOT_FOUND', 404), 404);
    }

    return ApiResponse.success(account, 'Account fetched successfully', 200);
  }
}
