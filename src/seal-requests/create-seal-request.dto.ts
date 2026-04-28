import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateSealRequestDto {
  @IsOptional()
  @IsString()
  meterId?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsDateString()
  preferredDate?: string;
}
