import { plainToInstance } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, IsString, IsBoolean, validateSync } from 'class-validator';

export class SupplierSchema {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bookIds?: string[];

  @IsOptional()
  @IsBoolean()
  delete_flag?: boolean;
}

export function validateSupplier(obj: unknown): { valid: boolean; errors?: any[]; value?: SupplierSchema } {
  const inst = plainToInstance(SupplierSchema, obj);
  const errors = validateSync(inst, { whitelist: true, forbidNonWhitelisted: false });
  if (errors.length > 0) {
    const mapped = errors.map((e) => ({ property: e.property, constraints: e.constraints }));
    return { valid: false, errors: mapped };
  }
  return { valid: true, value: inst };
}

export type SupplierDocument = Omit<SupplierSchema, '_id'> & { _id?: string };
