import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserByAdminDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullAddress: string;

  @IsString()
  @IsNotEmpty()
  contractNumber: string;
}