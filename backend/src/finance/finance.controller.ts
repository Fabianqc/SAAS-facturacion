import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionType } from '@prisma/client';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('transactions')
  createTransaction(@Body() dto: CreateTransactionDto, @Request() req: any) {
    return this.financeService.createTransaction(dto, req.user.tenantId);
  }

  @Get('transactions')
  getTransactions(
    @Request() req: any,
    @Query('type') type?: TransactionType,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getTransactions(req.user.tenantId, {
      type,
      category,
      startDate,
      endDate,
    });
  }

  @Patch('transactions/:id/cancel')
  cancelTransaction(@Param('id') id: string, @Request() req: any) {
    return this.financeService.cancelTransaction(id, req.user.tenantId);
  }

  @Get('pnl-summary')
  getPnLSummary(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getPnLSummary(req.user.tenantId, startDate, endDate);
  }
}
