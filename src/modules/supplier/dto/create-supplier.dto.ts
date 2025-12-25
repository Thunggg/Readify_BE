import { IsArray, IsEmail, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty({ message: 'name should not be empty' })
  name: string;

  @IsOptional()
  @IsString({ message: 'contactName must be a string' })
  contactName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'phone must be a string' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'address must be a string' })
  address?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'each bookId must be a valid MongoId' })
  bookIds: string[];
}
