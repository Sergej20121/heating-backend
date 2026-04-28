import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullAddress?: string;

  @IsOptional()
  @IsString()
  contractNumber?: string;
}
