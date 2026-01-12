import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AccountStatus, StaffSortBy, SortOrder, Sex, AccountStaffRole } from '../constants/staff.enum';
import type {
  AccountStatusValue,
  StaffSortByValue,
  SortOrderValue,
  SexValue,
  AccountStaffRoleValue,
} from '../constants/staff.enum';

function ToNumberArray() {
  // Trả về 1 decorator của class-transformer
  // Decorator này sẽ được gắn vào field trong DTO
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;

    // Trường hợp query dạng:
    // ?sex=1&sex=2
    // NestJS sẽ parse thành: value = ["1", "2"]
    // Ta cần convert từng phần tử sang number
    if (Array.isArray(value)) {
      return value
        .map((v) => Number(v)) // convert từng phần tử sang số
        .filter((v) => !isNaN(v)); // loại bỏ những giá trị không phải số (NaN)
    }

    // Trường hợp query dạng:
    // ?sex=1,2,3
    // NestJS nhận value = "1,2,3"
    // Ta tách chuỗi thành mảng ["1","2","3"] rồi convert sang number
    if (typeof value === 'string') {
      return value
        .split(',') // tách theo dấu ,
        .map((v) => Number(v.trim())) // trim để bỏ khoảng trắng rồi chuyển sang number
        .filter((v) => !isNaN(v)); // loại bỏ giá trị không hợp lệ
    }

    // Trường hợp query dạng:
    // ?sex=1
    // value = "1" hoặc 1
    // Ta convert thành number và bọc vào mảng
    const n = Number(value);

    // Nếu không convert được thành số → bỏ filter
    if (isNaN(n)) return undefined;

    // Nếu hợp lệ → trả về mảng có 1 phần tử
    return [n];
  });
}

export class SearchStaffDto {
  // ===== SEARCH =====
  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  q?: string;

  // ===== FILTER =====
  @IsOptional()
  @ToNumberArray()
  @IsEnum(AccountStatus, { each: true })
  status?: AccountStatusValue[];

  @IsOptional()
  @ToNumberArray()
  @IsEnum(Sex, { each: true })
  sex?: SexValue[];

  @IsOptional()
  @ToNumberArray()
  @IsEnum(AccountStaffRole, {
    each: true,
    message: 'Role must be 1 (ADMIN), 2 (SELLER), or 3 (WAREHOUSE)',
  })
  role?: AccountStaffRoleValue[];
  // ===== SORT =====
  @IsOptional()
  @IsEnum(StaffSortBy, {
    message: 'sortBy must be one of the valid sort fields',
  })
  sortBy: StaffSortByValue = StaffSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder, {
    message: 'order must be either "asc" or "desc"',
  })
  order: SortOrderValue = SortOrder.DESC;

  // ===== PAGINATION =====
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(50, { message: 'Limit cannot exceed 50' })
  limit: number = 10;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isDeleted?: boolean;
}
