import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AccountRole, AccountStatus, Sex, SortOrder, StaffSortBy } from 'src/modules/staff/constants/staff.enum';
import type {
  AccountRoleValue,
  AccountStatusValue,
  SexValue,
  SortOrderValue,
  StaffSortByValue,
} from 'src/modules/staff/constants/staff.enum';

export class SearchAccountDto {
  // ===== SEARCH =====
  @IsOptional()
  @IsString()
  q?: string;

  // ===== FILTER =====
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;

    // Nếu gửi lên là mảng. Ví dụ: "[1,2]"
    if (Array.isArray(value)) {
      return value.map((v) => Number(v));
    }

    // Nếu gửi lên là string. Ví dụ: "1,2"
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v: string) => Number(v.trim()))
        .filter((v) => !isNaN(v)) as SexValue[];
    }

    return [Number(value)] as SexValue[];
  })
  @IsEnum(AccountStatus, { each: true })
  status?: AccountStatusValue[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;

    // Nếu gửi lên là mảng. Ví dụ: "[1,2]"
    if (Array.isArray(value)) {
      return value.map((v) => Number(v));
    }

    // Nếu gửi lên là string. Ví dụ: "1,2"
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v: string) => Number(v.trim()))
        .filter((v) => !isNaN(v)) as SexValue[];
    }

    return [Number(value)] as SexValue[];
  })
  @IsEnum(Sex, { each: true })
  sex?: SexValue[];

  // ===== SORT =====
  @IsOptional()
  @IsEnum(StaffSortBy)
  sortBy: StaffSortByValue = StaffSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrderValue = SortOrder.DESC;

  // ===== PAGINATION =====
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDeleted?: boolean;
}
