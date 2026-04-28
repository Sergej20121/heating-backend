import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { PHONE_PATTERN } from './phone-rule';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_PATTERN)
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}
