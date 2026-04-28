import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MeterType } from '@prisma/client';

export class CreateMeterByAdminDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsEnum(MeterType)
  type: MeterType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}