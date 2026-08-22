import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType, MovementType } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra un gasto o ingreso puntual justificado
   */
  async createTransaction(dto: CreateTransactionDto, tenantId: string) {
    const transactionDate = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.financialTransaction.create({
      data: {
        tenantId,
        storeId: dto.storeId || null,
        type: dto.type,
        category: dto.category.trim().toUpperCase(),
        currencyOrigin: dto.currencyOrigin || 'USD',
        amountUSD: dto.amountUSD,
        amountVES: dto.amountVES,
        exchangeRate: dto.exchangeRate,
        justification: dto.justification.trim(),
        voucherNumber: dto.voucherNumber?.trim() || null,
        date: transactionDate,
        isActive: true,
      },
      include: {
        store: true,
      },
    });
  }

  /**
   * Obtiene el listado de transacciones financieras (gastos e ingresos)
   */
  async getTransactions(
    tenantId: string,
    filters?: {
      type?: TransactionType;
      category?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = {
      tenantId,
      isActive: true,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category && filters.category !== 'ALL') {
      where.category = filters.category;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    return this.prisma.financialTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { store: true, invoice: true },
    });
  }

  /**
   * Cancela/deshabilita un movimiento (Soft-Delete)
   */
  async cancelTransaction(id: string, tenantId: string) {
    const tx = await this.prisma.financialTransaction.findFirst({
      where: { id, tenantId },
    });

    if (!tx) {
      throw new NotFoundException(`Movimiento financiero con ID ${id} no encontrado`);
    }

    return this.prisma.financialTransaction.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Genera el Estado de Ganancias y Pérdidas (P&L Real)
   * Regla de Oro: Suma directa de montos históricos congelados ($ USD y Bs VES)
   */
  async getPnLSummary(tenantId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const hasDateFilter = startDate || endDate;

    // 1. Facturas de Venta (Ingresos por Ventas POS/SENIAT)
    const sales = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        ...(hasDateFilter ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true,
        subtotalUSD: true,
        subtotalVES: true,
        taxTotalUSD: true,
        taxTotalVES: true,
        totalUSD: true,
        totalVES: true,
        exchangeRate: true,
        createdAt: true,
      },
    });

    // 2. Facturas de Compra a Proveedores (Costos de Mercancía)
    const purchases = await this.prisma.purchaseInvoice.findMany({
      where: {
        tenantId,
        isActive: true,
        status: { in: ['RECEIVED', 'VERIFIED'] },
        ...(hasDateFilter ? { issueDate: dateFilter } : {}),
      },
      select: {
        id: true,
        subtotalUSD: true,
        subtotalVES: true,
        taxTotalUSD: true,
        taxTotalVES: true,
        totalUSD: true,
        totalVES: true,
        exchangeRate: true,
        issueDate: true,
      },
    });

    // 3. Nómina y Sueldos Liquidados a Empleados (Costos Laborales)
    const payrollReceipts = await this.prisma.payrollReceipt.findMany({
      where: {
        tenantId,
        period: {
          status: 'PROCESSED',
          ...(hasDateFilter ? { endDate: dateFilter } : {}),
        },
      },
      select: {
        id: true,
        netSalaryUSD: true,
        netSalaryVES: true,
        totalDeductionsUSD: true,
        totalDeductionsVES: true,
        totalBonusesUSD: true,
        totalBonusesVES: true,
        exchangeRate: true,
      },
    });

    // 4. Gastos e Ingresos Operativos Justificados
    const financialTransactions = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        isActive: true,
        invoiceId: null, // Excluir las ventas ya computadas arriba
        ...(hasDateFilter ? { date: dateFilter } : {}),
      },
    });

    // 5. Mermas y Roturas de Inventario (Kardex)
    const mermas = await this.prisma.stockMovement.findMany({
      where: {
        product: { tenantId },
        type: { in: [MovementType.OUT, MovementType.ADJUSTMENT] },
        quantity: { lt: 0 }, // Salidas o ajustes negativos
        ...(hasDateFilter ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true,
        quantity: true,
        costUnitUSD: true,
        costUnitVES: true,
        reason: true,
      },
    });

    // AGREGACIONES BI-MONEDA HISTÓRICAS CONGELADAS

    // Ventas
    const totalSalesUSD = sales.reduce((sum, s) => sum + Number(s.subtotalUSD), 0);
    const totalSalesVES = sales.reduce((sum, s) => sum + Number(s.subtotalVES), 0);
    const totalSalesTaxUSD = sales.reduce((sum, s) => sum + Number(s.taxTotalUSD), 0);
    const totalSalesTaxVES = sales.reduce((sum, s) => sum + Number(s.taxTotalVES), 0);

    // Compras a Proveedores
    const totalPurchasesUSD = purchases.reduce((sum, p) => sum + Number(p.subtotalUSD), 0);
    const totalPurchasesVES = purchases.reduce((sum, p) => sum + Number(p.subtotalVES), 0);
    const totalPurchasesTaxUSD = purchases.reduce((sum, p) => sum + Number(p.taxTotalUSD), 0);
    const totalPurchasesTaxVES = purchases.reduce((sum, p) => sum + Number(p.taxTotalVES), 0);

    // Nómina
    const totalPayrollUSD = payrollReceipts.reduce((sum, r) => sum + Number(r.netSalaryUSD), 0);
    const totalPayrollVES = payrollReceipts.reduce((sum, r) => sum + Number(r.netSalaryVES), 0);

    // Gastos Operativos Justificados
    const expensesList = financialTransactions.filter((t) => t.type === TransactionType.EXPENSE);
    const totalExpensesUSD = expensesList.reduce((sum, e) => sum + Number(e.amountUSD), 0);
    const totalExpensesVES = expensesList.reduce((sum, e) => sum + Number(e.amountVES), 0);

    // Ingresos Extraordinarios Justificados
    const incomesList = financialTransactions.filter((t) => t.type === TransactionType.INCOME);
    const totalExtraIncomesUSD = incomesList.reduce((sum, i) => sum + Number(i.amountUSD), 0);
    const totalExtraIncomesVES = incomesList.reduce((sum, i) => sum + Number(i.amountVES), 0);

    // Mermas y Desperdicios
    const totalMermasUSD = mermas.reduce((sum, m) => {
      const qty = Math.abs(m.quantity);
      const cost = Number(m.costUnitUSD || 0);
      return sum + qty * cost;
    }, 0);
    const totalMermasVES = mermas.reduce((sum, m) => {
      const qty = Math.abs(m.quantity);
      const cost = Number(m.costUnitVES || 0);
      return sum + qty * cost;
    }, 0);

    // Desglose de Gastos por Categoría
    const expensesByCategory: Record<string, { category: string; amountUSD: number; amountVES: number; count: number }> = {};
    expensesList.forEach((e) => {
      if (!expensesByCategory[e.category]) {
        expensesByCategory[e.category] = { category: e.category, amountUSD: 0, amountVES: 0, count: 0 };
      }
      expensesByCategory[e.category].amountUSD += Number(e.amountUSD);
      expensesByCategory[e.category].amountVES += Number(e.amountVES);
      expensesByCategory[e.category].count += 1;
    });

    // CÁLCULO DE RESULTADOS FINANCIEROS (P&L REAL)
    const grossIncomeUSD = totalSalesUSD + totalExtraIncomesUSD;
    const grossIncomeVES = totalSalesVES + totalExtraIncomesVES;

    const grossProfitUSD = totalSalesUSD - totalPurchasesUSD; // Margen Bruto Mercantil
    const grossProfitVES = totalSalesVES - totalPurchasesVES;

    const totalOperatingCostsUSD = totalPayrollUSD + totalExpensesUSD + totalMermasUSD;
    const totalOperatingCostsVES = totalPayrollVES + totalExpensesVES + totalMermasVES;

    const netOperatingProfitUSD = grossProfitUSD + totalExtraIncomesUSD - totalOperatingCostsUSD; // Utilidad Neta Real
    const netOperatingProfitVES = grossProfitVES + totalExtraIncomesVES - totalOperatingCostsVES;

    const operatingMarginPercent = grossIncomeUSD > 0 ? (netOperatingProfitUSD / grossIncomeUSD) * 100 : 0;

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      inflows: {
        salesUSD: totalSalesUSD,
        salesVES: totalSalesVES,
        salesCount: sales.length,
        salesTaxUSD: totalSalesTaxUSD,
        salesTaxVES: totalSalesTaxVES,
        extraIncomesUSD: totalExtraIncomesUSD,
        extraIncomesVES: totalExtraIncomesVES,
        extraIncomesCount: incomesList.length,
        totalGrossIncomeUSD: grossIncomeUSD,
        totalGrossIncomeVES: grossIncomeVES,
      },
      outflows: {
        purchasesUSD: totalPurchasesUSD,
        purchasesVES: totalPurchasesVES,
        purchasesCount: purchases.length,
        purchasesTaxUSD: totalPurchasesTaxUSD,
        purchasesTaxVES: totalPurchasesTaxVES,
        payrollUSD: totalPayrollUSD,
        payrollVES: totalPayrollVES,
        payrollReceiptsCount: payrollReceipts.length,
        operatingExpensesUSD: totalExpensesUSD,
        operatingExpensesVES: totalExpensesVES,
        operatingExpensesCount: expensesList.length,
        mermasUSD: totalMermasUSD,
        mermasVES: totalMermasVES,
        mermasCount: mermas.length,
        totalOperatingCostsUSD,
        totalOperatingCostsVES,
      },
      results: {
        grossProfitUSD,
        grossProfitVES,
        netOperatingProfitUSD,
        netOperatingProfitVES,
        operatingMarginPercent: parseFloat(operatingMarginPercent.toFixed(2)),
        isProfitable: netOperatingProfitUSD >= 0,
      },
      expensesByCategory: Object.values(expensesByCategory),
    };
  }
}
