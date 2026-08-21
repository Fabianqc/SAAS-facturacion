import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BcvService } from '../bcv/bcv.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { MovementType, TaxType } from '@prisma/client';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bcvService: BcvService,
  ) {}

  /**
   * Obtiene todos los productos del tenant con información de inventario,
   * cálculo de márgenes y conversión a tasas BCV (USD & EUR).
   */
  async findAll(tenantId: string, storeId?: string, search?: string, categoryId?: string, lowStockOnly?: boolean) {
    const bcvRates = await this.bcvService.getCurrentRate();
    const usdRate = bcvRates.usd || 775.3356;
    const eurRate = bcvRates.eur || 897.8231;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        stocks: storeId ? { where: { storeId } } : true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = products.map((prod) => {
      const currentStock = prod.stocks.reduce((sum, s) => sum + s.quantity, 0);
      const costUSD = Number(prod.costPriceUSD);
      const saleUSD = Number(prod.salePriceUSD);
      const profitUSD = saleUSD - costUSD;
      const marginPercent = costUSD > 0 ? ((profitUSD / costUSD) * 100) : 100;

      // Conversión BCV
      const salePriceVES = saleUSD * usdRate;
      const salePriceEUR = eurRate > 0 ? (salePriceVES / eurRate) : 0;
      const isLowStock = currentStock <= prod.minStock;

      return {
        id: prod.id,
        sku: prod.sku,
        barcode: prod.barcode,
        name: prod.name,
        description: prod.description,
        categoryId: prod.categoryId,
        categoryName: prod.category?.name || 'Sin Categoría',
        costPriceUSD: costUSD,
        salePriceUSD: saleUSD,
        profitUSD,
        marginPercent: Math.round(marginPercent * 100) / 100,
        salePriceVES: Math.round(salePriceVES * 100) / 100,
        salePriceEUR: Math.round(salePriceEUR * 100) / 100,
        taxType: prod.taxType,
        taxPercent: prod.taxType === TaxType.GENERAL_16 ? 16 : prod.taxType === TaxType.REDUCIDO_8 ? 8 : 0,
        unit: prod.unit,
        packagingUnit: prod.packagingUnit,
        unitsPerPackage: Number(prod.unitsPerPackage || 1),
        packageBarcode: prod.packageBarcode,
        brand: prod.brand,
        location: prod.location,
        minStock: prod.minStock,
        currentStock,
        isLowStock,
        isActive: prod.isActive,
        createdAt: prod.createdAt,
        updatedAt: prod.updatedAt,
      };
    });

    if (lowStockOnly) {
      return enriched.filter((p) => p.isLowStock);
    }

    return enriched;
  }

  /**
   * Obtiene un producto por ID con su historial y desglose
   */
  async findOne(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        stocks: {
          include: { store: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    const bcvRates = await this.bcvService.getCurrentRate();
    const usdRate = bcvRates.usd || 775.3356;
    const eurRate = bcvRates.eur || 897.8231;

    const currentStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0);
    const costUSD = Number(product.costPriceUSD);
    const saleUSD = Number(product.salePriceUSD);
    const profitUSD = saleUSD - costUSD;
    const marginPercent = costUSD > 0 ? ((profitUSD / costUSD) * 100) : 100;
    const salePriceVES = saleUSD * usdRate;
    const salePriceEUR = eurRate > 0 ? (salePriceVES / eurRate) : 0;

    return {
      ...product,
      costPriceUSD: costUSD,
      salePriceUSD: saleUSD,
      profitUSD,
      marginPercent: Math.round(marginPercent * 100) / 100,
      salePriceVES: Math.round(salePriceVES * 100) / 100,
      salePriceEUR: Math.round(salePriceEUR * 100) / 100,
      currentStock,
      isLowStock: currentStock <= product.minStock,
    };
  }

  /**
   * Crea un nuevo producto y su stock inicial
   */
  async create(createProductDto: CreateProductDto, tenantId: string, userId: string) {
    // Validar SKU único en el tenant
    const existingSku = await this.prisma.product.findFirst({
      where: { tenantId, sku: createProductDto.sku },
    });

    if (existingSku) {
      throw new BadRequestException(`Ya existe un producto con el SKU "${createProductDto.sku}" en este negocio`);
    }

    // Obtener storeId por defecto si no se envió
    let targetStoreId = createProductDto.storeId;
    if (!targetStoreId) {
      const defaultStore = await this.prisma.store.findFirst({ where: { tenantId } });
      if (defaultStore) {
        targetStoreId = defaultStore.id;
      }
    }

    const initialStock = createProductDto.initialStock || 0;

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          tenantId,
          sku: createProductDto.sku.trim().toUpperCase(),
          barcode: createProductDto.barcode?.trim() || null,
          name: createProductDto.name.trim(),
          description: createProductDto.description?.trim() || null,
          categoryId: createProductDto.categoryId || null,
          costPriceUSD: createProductDto.costPriceUSD,
          salePriceUSD: createProductDto.salePriceUSD,
          taxType: createProductDto.taxType || TaxType.GENERAL_16,
          unit: createProductDto.unit || 'PZA',
          packagingUnit: createProductDto.packagingUnit?.trim() || null,
          unitsPerPackage: createProductDto.unitsPerPackage || 1,
          packageBarcode: createProductDto.packageBarcode?.trim() || null,
          brand: createProductDto.brand?.trim() || null,
          location: createProductDto.location?.trim() || null,
          minStock: createProductDto.minStock ?? 5,
          isActive: createProductDto.isActive ?? true,
        },
        include: { category: true },
      });

      if (targetStoreId) {
        // Crear registro de stock
        await tx.productStock.create({
          data: {
            storeId: targetStoreId,
            productId: product.id,
            quantity: initialStock,
          },
        });

        // Registrar movimiento inicial si stock > 0
        if (initialStock > 0) {
          await tx.stockMovement.create({
            data: {
              storeId: targetStoreId,
              productId: product.id,
              userId,
              type: MovementType.IN,
              quantity: initialStock,
              previousQty: 0,
              newQty: initialStock,
              reason: 'Inventario inicial al crear producto',
            },
          });
        }
      }

      return product;
    });
  }

  /**
   * Actualiza los datos de un producto
   */
  async update(id: string, updateProductDto: UpdateProductDto, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const duplicateSku = await this.prisma.product.findFirst({
        where: { tenantId, sku: updateProductDto.sku, NOT: { id } },
      });
      if (duplicateSku) {
        throw new BadRequestException(`El SKU "${updateProductDto.sku}" ya está en uso por otro producto`);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        sku: updateProductDto.sku?.trim().toUpperCase(),
        barcode: updateProductDto.barcode !== undefined ? updateProductDto.barcode?.trim() || null : undefined,
        name: updateProductDto.name?.trim(),
        description: updateProductDto.description !== undefined ? updateProductDto.description?.trim() || null : undefined,
        categoryId: updateProductDto.categoryId !== undefined ? updateProductDto.categoryId || null : undefined,
        costPriceUSD: updateProductDto.costPriceUSD,
        salePriceUSD: updateProductDto.salePriceUSD,
        taxType: updateProductDto.taxType,
        unit: updateProductDto.unit,
        packagingUnit: updateProductDto.packagingUnit !== undefined ? updateProductDto.packagingUnit?.trim() || null : undefined,
        unitsPerPackage: updateProductDto.unitsPerPackage !== undefined ? updateProductDto.unitsPerPackage : undefined,
        packageBarcode: updateProductDto.packageBarcode !== undefined ? updateProductDto.packageBarcode?.trim() || null : undefined,
        brand: updateProductDto.brand !== undefined ? updateProductDto.brand?.trim() || null : undefined,
        location: updateProductDto.location !== undefined ? updateProductDto.location?.trim() || null : undefined,
        minStock: updateProductDto.minStock,
        isActive: updateProductDto.isActive,
      },
      include: { category: true },
    });
  }

  /**
   * Desactiva o elimina un producto
   */
  async remove(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // Desactivar en lugar de eliminar físicamente para preservar integridad contable
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Alterna el estado activo / pausado para la venta
   */
  async toggleStatus(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return this.prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    });
  }

  /**
   * Registra un movimiento de stock (Kardex: IN, OUT, ADJUSTMENT)
   */
  async registerStockMovement(productId: string, dto: StockMovementDto, tenantId: string, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    const store = await this.prisma.store.findFirst({
      where: { id: dto.storeId, tenantId },
    });

    if (!store) {
      throw new NotFoundException(`Sucursal con ID ${dto.storeId} no encontrada`);
    }

    return this.prisma.$transaction(async (tx) => {
      let stockRecord = await tx.productStock.findUnique({
        where: { storeId_productId: { storeId: dto.storeId, productId } },
      });

      const previousQty = stockRecord ? stockRecord.quantity : 0;
      let newQty = previousQty;

      if (dto.type === MovementType.IN) {
        newQty = previousQty + dto.quantity;
      } else if (dto.type === MovementType.OUT) {
        if (previousQty < dto.quantity) {
          throw new BadRequestException(`Stock insuficiente: Cantidad actual es ${previousQty}, no se pueden retirar ${dto.quantity}`);
        }
        newQty = previousQty - dto.quantity;
      } else if (dto.type === MovementType.ADJUSTMENT) {
        // En ajuste, quantity es el nuevo valor final
        newQty = dto.quantity;
      }

      if (stockRecord) {
        await tx.productStock.update({
          where: { id: stockRecord.id },
          data: { quantity: newQty },
        });
      } else {
        await tx.productStock.create({
          data: {
            storeId: dto.storeId,
            productId,
            quantity: newQty,
          },
        });
      }

      const movement = await tx.stockMovement.create({
        data: {
          storeId: dto.storeId,
          productId,
          userId,
          type: dto.type,
          quantity: dto.type === MovementType.ADJUSTMENT ? Math.abs(newQty - previousQty) : dto.quantity,
          previousQty,
          newQty,
          reason: dto.reason || (dto.type === MovementType.IN ? 'Entrada manual de inventario' : dto.type === MovementType.OUT ? 'Salida manual de inventario' : 'Ajuste físico de stock'),
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          store: {
            select: { name: true },
          },
        },
      });

      return {
        success: true,
        previousQty,
        newQty,
        movement,
      };
    });
  }

  /**
   * Obtiene el historial de movimientos (Kardex) de un producto
   */
  async getMovements(productId: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    return this.prisma.stockMovement.findMany({
      where: { productId },
      include: {
        product: { select: { id: true, sku: true, name: true, unit: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
        store: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Obtiene la bitácora global de movimientos de inventario (Kardex) del negocio
   */
  async getAllMovements(
    tenantId: string,
    storeId?: string,
    type?: MovementType,
    productId?: string,
    limit: number = 100,
  ) {
    const where: any = {
      product: { tenantId },
    };

    if (storeId && storeId !== 'ALL') {
      where.storeId = storeId;
    }

    if (type) {
      where.type = type;
    }

    if (productId && productId !== 'ALL') {
      where.productId = productId;
    }

    return this.prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { id: true, sku: true, name: true, unit: true, packagingUnit: true, unitsPerPackage: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
        store: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Obtiene las sucursales / almacenes del tenant
   */
  async getStores(tenantId: string) {
    return this.prisma.store.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        invoicePrefix: true,
        _count: { select: { stocks: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  // --- CATEGORÍAS ---

  async getCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId, isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto, tenantId: string) {
    const existing = await this.prisma.category.findFirst({
      where: { tenantId, name: { equals: dto.name.trim(), mode: 'insensitive' } },
    });

    if (existing) {
      if (!existing.isActive) {
        // Reactivar si estaba deshabilitada
        return this.prisma.category.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }
      throw new BadRequestException(`La categoría "${dto.name}" ya existe`);
    }

    return this.prisma.category.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        isActive: true,
      },
    });
  }

  async deleteCategory(id: string, tenantId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId, isActive: true },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (category._count.products > 0) {
      throw new BadRequestException(`No se puede deshabilitar la categoría porque tiene ${category._count.products} productos asociados`);
    }

    // Soft-delete inmutable
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
