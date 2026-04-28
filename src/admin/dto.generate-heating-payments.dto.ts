import { IsString, Matches } from 'class-validator';

export class GenerateHeatingPaymentsDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  billingMonth: string;
}