import { IsMongoId, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTicketDto {
  @IsString({ message: 'Subject must be a string' })
  @IsNotEmpty({ message: 'Subject is required' })
  @MinLength(1, { message: 'Subject must be at least 1 character long' })
  @MaxLength(200, { message: 'Subject must be less than 200 characters long' })
  subject: string;

  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(1, { message: 'Content must be at least 1 character long' })
  @MaxLength(1000, { message: 'Content must be less than 1000 characters long' })
  message: string;
}
