import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { MeterType } from '@prisma/client';

export class UpdateMeterByAdminDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsEnum(MeterType)
  type?: MeterType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}