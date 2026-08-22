import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType; // INCOME | EXPENSE

  @IsString()
  @IsNotEmpty()
  category: string; // ALQUILER, SERVICIOS, MANTENIMIENTO, FLETES, SUMINISTROS, PUBLICIDAD, IMPUESTOS, NOMINA, OTROS

  @IsString()
  @IsOptional()
  currencyOrigin?: string; // 'USD' | 'VES'

  @IsNumber()
  @Min(0.01)
  amountUSD: number;

  @IsNumber()
  @Min(0.01)
  amountVES: number;

  @IsNumber()
  @Min(0.0001)
  exchangeRate: number;

  @IsString()
  @IsNotEmpty()
  justification: string;

  @IsString()
  @IsOptional()
  voucherNumber?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  storeId?: string;
}
