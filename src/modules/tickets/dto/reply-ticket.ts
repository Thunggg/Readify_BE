import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ReplyTicketDto {
  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message is required' })
  @MinLength(1, { message: 'Message must be at least 1 character long' })
  @MaxLength(5000, { message: 'Message must be less than 5000 characters long' })
  message: string;
}
