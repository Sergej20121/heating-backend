import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { MeterType } from '@prisma/client';

export class CreateMeterReplacementDto {
  @IsString()
  @IsNotEmpty()
  oldMeterId: string;

  @IsString()
  @IsNotEmpty()
  newTitle: string;

  @IsString()
  @IsNotEmpty()
  newSerialNumber: string;

  @IsEnum(MeterType)
  newType: MeterType;

  @IsInt()
  @Min(0)
  initialReading: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
