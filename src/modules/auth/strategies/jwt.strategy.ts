import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

function cookieTokenExtractor(req: any): string | null {
  if (!req || !req.cookies) return null;

  const token = req.cookies.accessToken;

  if (typeof token === 'string' && token.length > 0) {
    return token;
  }

  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      // Cookie-only auth: access token is stored in cookie "accessToken"
      jwtFromRequest: ExtractJwt.fromExtractors([cookieTokenExtractor]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessTokenSecret') as string,
    });
  }

  async validate(payload: unknown) {
    // 1. Nếu payload không phải object → token không hợp lệ
    if (typeof payload !== 'object' || payload === null) {
      throw new UnauthorizedException('Invalid token');
    }

    // 2. Ép payload thành object có sub và email
    const data = payload as { sub?: string; email?: string };

    // 3. Nếu không có sub (userId) → token không hợp lệ
    if (!data.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    // 4. Trả về thông tin user (gắn vào req.user)
    return {
      userId: data.sub,
      email: data.email,
    };
  }
}
