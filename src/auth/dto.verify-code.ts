import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { PHONE_PATTERN } from './phone-rule';

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_PATTERN)
  phone: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
