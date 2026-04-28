import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { PHONE_PATTERN } from './phone-rule';

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_PATTERN)
  phone: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_PATTERN)
  phone: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
