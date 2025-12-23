import { plainToInstance } from 'class-transformer';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUrl, validateSync } from 'class-validator';

export class BookSchema {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @IsOptional()
  @IsUrl()
  coverUrl?: string;

  @IsOptional()
  @IsNumber()
  pages?: number;

  @IsOptional()
  @IsString()
  publisher?: string;
}

export function validateBook(obj: unknown): { valid: boolean; errors?: any[]; value?: BookSchema } {
  const inst = plainToInstance(BookSchema, obj);
  const errors = validateSync(inst, { whitelist: true, forbidNonWhitelisted: false });
  if (errors.length > 0) {
    const mapped = errors.map((e) => ({ property: e.property, constraints: e.constraints }));
    return { valid: false, errors: mapped };
  }
  return { valid: true, value: inst };
}

export type BookDocument = Omit<BookSchema, '_id'> & { _id?: string };
