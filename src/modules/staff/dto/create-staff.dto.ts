import { IsEmail, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @Type(() => Date)
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  address?: string;

  // 1: admin, 2: seller, 3: warehouse
  @Type(() => Number)
  @IsInt()
  @Min(1)
  role: number;

  // 1: active, 0: inactive, 2: not active email
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sex?: number; // 0 unknown, 1 male, 2 female
}
