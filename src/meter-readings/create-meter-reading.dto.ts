import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateMeterReadingDto {
  @IsString()
  @IsNotEmpty()
  meterId: string;

  @IsInt()
  @Min(0)
  value: number;
}
