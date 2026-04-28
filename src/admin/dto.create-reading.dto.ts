import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateReadingByAdminDto {
  @IsString()
  @IsNotEmpty()
  meterId: string;

  @IsNumber()
  @Min(0)
  value: number;
}