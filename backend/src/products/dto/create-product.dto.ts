import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, IsBoolean } from 'class-validator';
import { TaxType } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  costPriceUSD: number;

  @IsNumber()
  @Min(0)
  salePriceUSD: number;

  @IsEnum(TaxType)
  @IsOptional()
  taxType?: TaxType;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  packagingUnit?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  unitsPerPackage?: number;

  @IsString()
  @IsOptional()
  packageBarcode?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  initialStock?: number;

  @IsString()
  @IsOptional()
  storeId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
