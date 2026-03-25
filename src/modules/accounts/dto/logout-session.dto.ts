import { IsArray, IsNotEmpty, IsString, Length } from 'class-validator';

export class LogoutSessionDto {
  @IsArray({ message: 'Session ids must be an array' })
  @IsNotEmpty({ message: 'Session ids can not be empty' })
  sessionIds: string[];
}
