import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BcvService } from '../bcv/bcv.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { MovementType, RifType, TaxType } from '@prisma/client';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bcvService: BcvService,
  ) {}

  /**
   * Registra una factura de compra completa:
   * 1. Asocia o crea el proveedor.
   * 2. Ingresa/actualiza los productos en catálogo.
   * 3. Incrementa el stock en la sucursal.
   * 4. Registra el movimiento en el Kardex.
   * 5. Guarda la factura de compra histórica con todos sus renglones y totales fiscales.
   */
  async createPurchase(dto: CreatePurchaseDto, tenantId: string, userId: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La factura de compra debe contener al menos un producto');
    }

    const bcvRates = await this.bcvService.getCurrentRate();
    const usdRate = Number(bcvRates.usd) || 775.3356;

    // 1. Obtener o crear Sucursal destino
    let targetStoreId = dto.storeId;
    if (!targetStoreId) {
      const defaultStore = await this.prisma.store.findFirst({ where: { tenantId } });
      if (!defaultStore) {
        throw new BadRequestException('No hay sucursal configurada para este negocio');
      }
      targetStoreId = defaultStore.id;
    }

    // 2. Obtener o crear Proveedor
    const rifType = dto.supplierRifType || RifType.J;
    const rifClean = dto.supplierRifNumber.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');

    let supplier = await this.prisma.supplier.findFirst({
      where: { tenantId, rifType, rifNumber: rifClean },
    });

    if (!supplier) {
      supplier = await this.prisma.supplier.create({
        data: {
          tenantId,
          rifType,
          rifNumber: rifClean,
          name: dto.supplierName.trim(),
          phone: dto.supplierPhone?.trim() || null,
          email: dto.supplierEmail?.trim() || null,
          address: dto.supplierAddress?.trim() || null,
        },
      });
    } else {
      // Actualizar nombre o teléfono si cambiaron
      supplier = await this.prisma.supplier.update({
        where: { id: supplier.id },
        data: {
          name: dto.supplierName.trim(),
          phone: dto.supplierPhone?.trim() || supplier.phone,
          email: dto.supplierEmail?.trim() || supplier.email,
          address: dto.supplierAddress?.trim() || supplier.address,
        },
      });
    }

    // 3. Validar que la factura no esté duplicada para este proveedor
    const invoiceNumClean = dto.invoiceNumber.trim().toUpperCase();
    const existingInvoice = await this.prisma.purchaseInvoice.findFirst({
      where: {
        tenantId,
        supplierId: supplier.id,
        invoiceNumber: invoiceNumClean,
      },
    });

    if (existingInvoice) {
      throw new BadRequestException(
        `Ya existe una factura de compra registrada con el N° "${invoiceNumClean}" para el proveedor ${supplier.name}`,
      );
    }

    // 4. Procesamiento Transaccional de Ítems e Inventario
    return this.prisma.$transaction(async (tx) => {
      let subtotalUSD = 0;
      let taxTotalUSD = 0;
      const invoiceItemsData: any[] = [];

      for (const item of dto.items) {
        const skuClean = item.sku.trim().toUpperCase();
        const costUSD = Number(item.costUnitUSD);
        const costVES = costUSD * usdRate;
        const qty = item.quantity;
        const taxType = item.taxType || TaxType.GENERAL_16;

        let taxRate = 0;
        if (taxType === TaxType.GENERAL_16) taxRate = 16;
        else if (taxType === TaxType.REDUCIDO_8) taxRate = 8;
        else if (taxType === TaxType.EXENTO_0) taxRate = 0;

        const lineSubtotalUSD = costUSD * qty;
        const lineTaxUSD = (lineSubtotalUSD * taxRate) / 100;
        const lineTotalUSD = lineSubtotalUSD + lineTaxUSD;

        const lineSubtotalVES = lineSubtotalUSD * usdRate;
        const lineTaxVES = lineTaxUSD * usdRate;
        const lineTotalVES = lineTotalUSD * usdRate;

        subtotalUSD += lineSubtotalUSD;
        taxTotalUSD += lineTaxUSD;

        // Buscar producto existente por SKU o por ID
        let product = item.productId
          ? await tx.product.findFirst({ where: { id: item.productId, tenantId } })
          : await tx.product.findFirst({ where: { sku: skuClean, tenantId } });

        // Calcular factor de empaque / conversión a unidades sueltas
        const unitsPerPackage = item.unitsPerPackage && item.unitsPerPackage > 1
          ? Number(item.unitsPerPackage)
          : (product?.unitsPerPackage ? Number(product.unitsPerPackage) : 1);

        const isPackaged = Boolean(
          item.isPackaged ||
            (item.receivedUnit && ['CAJA', 'BULTO', 'FARDO', 'DISPLAY', 'DOCENA', 'PACK'].includes(item.receivedUnit.toUpperCase())),
        );

        const effectiveFactor = isPackaged && unitsPerPackage > 1 ? unitsPerPackage : 1;
        const totalStockUnitsToAdd = Math.round(qty * effectiveFactor);
        const derivedUnitCostUSD = effectiveFactor > 1 ? Math.round((costUSD / effectiveFactor) * 10000) / 10000 : costUSD;

        if (product) {
          // Actualizar costo unitario y precio de venta si fue provisto
          const newSalePriceUSD =
            item.salePriceUSD !== undefined && item.salePriceUSD > 0
              ? item.salePriceUSD
              : Number(product.salePriceUSD);

          product = await tx.product.update({
            where: { id: product.id },
            data: {
              costPriceUSD: derivedUnitCostUSD,
              salePriceUSD: newSalePriceUSD,
              taxType,
              name: item.name.trim() || product.name,
              barcode: item.barcode?.trim() || product.barcode,
              categoryId: item.categoryId || product.categoryId,
              unit: item.unit || product.unit,
              packagingUnit: item.receivedUnit || product.packagingUnit,
              unitsPerPackage: unitsPerPackage,
            },
          });
        } else {
          // Crear nuevo producto en inventario
          const defaultSaleUSD =
            item.salePriceUSD !== undefined && item.salePriceUSD > 0
              ? item.salePriceUSD
              : Math.round(derivedUnitCostUSD * 1.3 * 100) / 100; // Margen 30% sugerido por defecto

          product = await tx.product.create({
            data: {
              tenantId,
              sku: skuClean,
              barcode: item.barcode?.trim() || null,
              name: item.name.trim(),
              categoryId: item.categoryId || null,
              costPriceUSD: derivedUnitCostUSD,
              salePriceUSD: defaultSaleUSD,
              taxType,
              unit: item.unit || 'PZA',
              packagingUnit: item.receivedUnit || null,
              unitsPerPackage: unitsPerPackage,
              minStock: 5,
              isActive: true,
            },
          });
        }

        // Incrementar o inicializar stock en la sucursal con las unidades sueltas reales
        let stockRecord = await tx.productStock.findUnique({
          where: { storeId_productId: { storeId: targetStoreId, productId: product.id } },
        });

        const previousQty = stockRecord ? stockRecord.quantity : 0;
        const newQty = previousQty + totalStockUnitsToAdd;

        if (stockRecord) {
          await tx.productStock.update({
            where: { id: stockRecord.id },
            data: { quantity: newQty },
          });
        } else {
          await tx.productStock.create({
            data: {
              storeId: targetStoreId,
              productId: product.id,
              quantity: newQty,
            },
          });
        }

        // Registrar movimiento de auditoría en Kardex
        const reasonDetail =
          effectiveFactor > 1
            ? `Factura Compra: ${invoiceNumClean} (Recibido: ${qty} ${item.receivedUnit || 'CAJA'} x ${effectiveFactor} = +${totalStockUnitsToAdd} ${product.unit})`
            : `Factura Compra: ${invoiceNumClean} (Prov: ${supplier.name})`;

        await tx.stockMovement.create({
          data: {
            storeId: targetStoreId,
            productId: product.id,
            userId,
            type: MovementType.IN,
            quantity: totalStockUnitsToAdd,
            previousQty,
            newQty,
            reason: reasonDetail,
          },
        });

        invoiceItemsData.push({
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          quantity: qty,
          receivedUnit: item.receivedUnit || (effectiveFactor > 1 ? 'CAJA' : product.unit),
          packageQuantity: effectiveFactor > 1 ? qty : null,
          unitsPerPackage: effectiveFactor,
          costUnitUSD: costUSD,
          costUnitVES: Math.round(costVES * 100) / 100,
          taxType,
          taxRate,
          taxAmountUSD: Math.round(lineTaxUSD * 100) / 100,
          taxAmountVES: Math.round(lineTaxVES * 100) / 100,
          totalUSD: Math.round(lineTotalUSD * 100) / 100,
          totalVES: Math.round(lineTotalVES * 100) / 100,
        });
      }

      const totalUSD = subtotalUSD + taxTotalUSD;
      const subtotalVES = subtotalUSD * usdRate;
      const taxTotalVES = taxTotalUSD * usdRate;
      const totalVES = totalUSD * usdRate;

      // Crear registro de Factura de Compra
      const purchaseInvoice = await tx.purchaseInvoice.create({
        data: {
          tenantId,
          storeId: targetStoreId,
          supplierId: supplier.id,
          userId,
          invoiceNumber: invoiceNumClean,
          controlNumber: dto.controlNumber?.trim() || null,
          invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : new Date(),
          exchangeRate: usdRate,
          subtotalUSD: Math.round(subtotalUSD * 100) / 100,
          subtotalVES: Math.round(subtotalVES * 100) / 100,
          taxTotalUSD: Math.round(taxTotalUSD * 100) / 100,
          taxTotalVES: Math.round(taxTotalVES * 100) / 100,
          totalUSD: Math.round(totalUSD * 100) / 100,
          totalVES: Math.round(totalVES * 100) / 100,
          notes: dto.notes?.trim() || null,
          status: 'RECEIVED',
          items: {
            create: invoiceItemsData,
          },
        },
        include: {
          supplier: true,
          store: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          items: {
            include: { product: true },
          },
        },
      });

      this.logger.log(
        `✅ Factura de compra ${invoiceNumClean} procesada con éxito: $${totalUSD.toFixed(2)} USD / ${totalVES.toFixed(2)} Bs`,
      );

      return purchaseInvoice;
    });
  }

  /**
   * Obtiene la lista de facturas de compra registradas
   */
  async findAll(tenantId: string, search?: string) {
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { controlNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { supplier: { rifNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.purchaseInvoice.findMany({
      where,
      include: {
        supplier: true,
        store: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Obtiene el detalle completo de una factura de compra
   */
  async findOne(id: string, tenantId: string) {
    const invoice = await this.prisma.purchaseInvoice.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        store: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        items: {
          include: { product: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Factura de compra con ID ${id} no encontrada`);
    }

    return invoice;
  }

  /**
   * Listado de proveedores del tenant
   */
  async getSuppliers(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { purchaseInvoices: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
