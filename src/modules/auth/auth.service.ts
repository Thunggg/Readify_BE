import { HttpException, Injectable } from '@nestjs/common';
import { Model, ObjectId } from 'mongoose';
import { ApiResponse } from 'src/shared/responses/api-response';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { comparePassword, hashPassword } from 'src/shared/utils/bcrypt';
import { Account, AccountDocument } from '../accounts/schemas/account.schema';
import { JwtUtil } from 'src/shared/utils/jwt';
import { LoginDto } from './dto/login.dto';
import { RefreshToken, RefreshTokenDocument } from '../accounts/schemas/refresh-token.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    private readonly configService: ConfigService,
    private readonly jwtUtil: JwtUtil,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const password = dto.password;

    // 1) find account by email
    const account = await this.accountModel.findOne({ email });

    if (!account) {
      throw new HttpException(ApiResponse.error('Email or password is incorrect', 'INVALID_CREDENTIALS', 400), 400);
    }

    // 2) compare password
    const isPasswordValid = await comparePassword(password, account.password);

    if (!isPasswordValid) {
      throw new HttpException(ApiResponse.error('Email or password is incorrect', 'INVALID_CREDENTIALS', 400), 400);
    }

    // 3) check email is verified or not
    if (account.status === 2) {
      throw new HttpException(ApiResponse.error('Email is not verified', 'EMAIL_NOT_VERIFIED', 400), 400);
    }

    // 4) generate access token and refresh token
    const accessToken = this.jwtUtil.signAccessToken(
      { sub: account._id as unknown as ObjectId, email: account.email },
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
    });

    return ApiResponse.success({ accessToken }, 'Login successful', 200);
  }
}
