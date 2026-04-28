import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { PHONE_PATTERN } from './phone-rule';

export class RegisterAdminDto {
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_PATTERN)
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @IsString()
  @IsNotEmpty()
  fullAddress: string;

  @IsString()
  @IsNotEmpty()
  contractNumber: string;

  @IsString()
  @IsNotEmpty()
  adminCode: string;
}