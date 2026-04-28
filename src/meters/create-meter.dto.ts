import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MeterType } from '@prisma/client';

export class CreateMeterDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsEnum(MeterType)
  type: MeterType;
}
