import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { ObjectId } from 'mongoose';

export type AccessTokenPayload = { sub: ObjectId; email: string };
export type RefreshTokenPayload = { sub: ObjectId };
export type VerifyEmailPayload = { sub: ObjectId; email: string; purpose: 'verify_email' };

@Injectable()
export class JwtUtil {
  constructor(private readonly jwt: JwtService) {}

  signAccessToken(payload: AccessTokenPayload, secret: string, expiresIn: number) {
    const options: JwtSignOptions = {
      secret,
      expiresIn,
    };
    return this.jwt.sign(payload, options) as string;
  }

  signRefreshToken(payload: RefreshTokenPayload, secret: string, expiresIn: number) {
    const options: JwtSignOptions = {
      secret,
      expiresIn,
    };
    return this.jwt.sign(payload, options) as string;
  }

  signVerifyEmailToken(payload: VerifyEmailPayload, secret: string, expiresIn: number) {
    const options: JwtSignOptions = {
      secret,
      expiresIn,
    };
    return this.jwt.sign(payload, options) as string;
  }

  //   verifyToken<T>(token: string, secret: string): T {
  //     const options: JwtVerifyOptions = {
  //       secret,
  //     };
  //     return this.jwt.verify<T>(token, options) as unknown as T;
  //   }
}
