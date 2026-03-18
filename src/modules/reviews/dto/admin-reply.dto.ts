import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdminReplyDto {
  @IsNotEmpty({ message: 'Admin reply is required' })
  @IsString()
  @MaxLength(2000, { message: 'Admin reply must be less than 2000 characters' })
  adminReply: string;
}
