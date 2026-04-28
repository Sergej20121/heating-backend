import { Type } from 'class-transformer';
import { IsNumber, IsString, Matches, Min } from 'class-validator';

export class UpsertHeatingSettingDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  effectiveFromMonth: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tariffPerUnit: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  normPerSquareMeter: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  seasonCoefficient: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commonAreaCoefficient: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lossCoefficient: number;
}