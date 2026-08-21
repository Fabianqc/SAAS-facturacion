import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RifType, TaxType } from '@prisma/client';

export class PurchaseItemDto {
  @IsString()
  @IsOptional()
  productId?: string; // Si ya existe en inventario

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  receivedUnit?: string; // CAJA, BULTO, FARDO, PZA

  @IsNumber()
  @Min(1)
  @IsOptional()
  unitsPerPackage?: number; // Factor de conversión a unidades de venta

  @IsBoolean()
  @IsOptional()
  isPackaged?: boolean;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  costUnitUSD: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salePriceUSD?: number; // Opcional para actualizar o fijar precio de venta

  @IsEnum(TaxType)
  @IsOptional()
  taxType?: TaxType;
}

export class CreatePurchaseDto {
  // Datos de Proveedor
  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsEnum(RifType)
  @IsOptional()
  supplierRifType?: RifType;

  @IsString()
  @IsNotEmpty()
  supplierRifNumber: string;

  @IsString()
  @IsNotEmpty()
  supplierName: string;

  @IsString()
  @IsOptional()
  supplierPhone?: string;

  @IsString()
  @IsOptional()
  supplierEmail?: string;

  @IsString()
  @IsOptional()
  supplierAddress?: string;

  // Datos de Factura Física del Proveedor
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @IsString()
  @IsOptional()
  controlNumber?: string;

  @IsString()
  @IsOptional()
  invoiceDate?: string;

  @IsString()
  @IsOptional()
  storeId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  // Renglones
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
