import {
  IsDate,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MinAge } from 'src/shared/validators/min-age.validator';
import { AccountStaffRole, AccountStatus, Sex } from '../constants/staff.enum';
import type { AccountStatusValue, SexValue, AccountStaffRoleValue } from '../constants/staff.enum';

export class CreateStaffDto {
  @IsEmail({}, { message: 'Invalid email format' })
  // @IsString({ message: 'Email must be a string' })
  // @IsNotEmpty({ message: 'Email can not be empty' })
  // @MinLength(5, { message: 'Email must be at least 5 characters long' })
  @MaxLength(255, { message: 'Email must be less than 255 characters long' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password can not be empty' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?!.*\s)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message: 'Password must contain uppercase, lowercase, number and special character and no spaces',
  })
  @MaxLength(255, { message: 'Password must be less than 255 characters long' })
  password: string;

  @IsNotEmpty({ message: 'First name can not be empty' })
  @IsString({ message: 'First name must be a string' })
  @Matches(/^[a-zA-ZÀ-ỹ\s'-]+$/, {
    message: 'First name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @MaxLength(100, { message: 'First name must be less than 100 characters long' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name must be less than 100 characters long' })
  @IsNotEmpty({ message: 'Last name can not be empty' })
  @Matches(/^[a-zA-ZÀ-ỹ\s'-]+$/, {
    message: 'Last name can only contain letters, spaces, hyphens, and apostrophes',
  })
  lastName: string;

  @IsString({ message: 'dateOfBirth must be a valid ISO date string' })
  @IsNotEmpty({ message: 'dateOfBirth can not be empty' })
  @MinAge(16, { message: 'You must be at least 16 years old' })
  @MinLength(1, { message: 'dateOfBirth can not be empty' })
  dateOfBirth?: Date;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Invalid Vietnamese phone number',
  })
  @MaxLength(20, { message: 'Phone must be less than 20 characters long' })
  phone?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  @MaxLength(500, { message: 'Avatar URL must be less than 500 characters' })
  avatarUrl?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @MaxLength(255, { message: 'Address must be less than 255 characters long' })
  @MinLength(1, { message: 'Address can not be empty' })
  address?: string;

  @Type(() => Number)
  @IsInt()
  @IsEnum(AccountStaffRole, {
    message: 'Role must be one of: 1 (ADMIN), 2 (SELLER), 3 (WAREHOUSE)',
  })
  role: AccountStaffRoleValue;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(AccountStatus, {
    message: 'Status must be one of: 0 (INACTIVE), 1 (ACTIVE), -1 (BANNED), 2 (NOT_ACTIVE_EMAIL)',
  })
  status: AccountStatusValue;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(Sex, { message: 'Sex must be 0 (UNKNOWN), 1 (MALE) or 2 (FEMALE)' })
  sex?: SexValue;
}
