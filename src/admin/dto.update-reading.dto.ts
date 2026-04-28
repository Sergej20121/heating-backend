import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class UpdateReadingByAdminDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value: number;
}