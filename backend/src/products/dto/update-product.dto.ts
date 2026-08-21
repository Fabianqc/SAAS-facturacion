import { IsString, IsOptional, IsNumber, IsEnum, Min, IsBoolean } from 'class-validator';
import { TaxType } from '@prisma/client';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPriceUSD?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salePriceUSD?: number;

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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
