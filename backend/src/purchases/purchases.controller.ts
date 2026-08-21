import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  async createPurchase(
    @Request() req: any,
    @Body() createPurchaseDto: CreatePurchaseDto,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id || req.user.userId;
    return this.purchasesService.createPurchase(
      createPurchaseDto,
      tenantId,
      userId,
    );
  }

  @Get()
  async findAll(@Request() req: any, @Query('search') search?: string) {
    const tenantId = req.user.tenantId;
    return this.purchasesService.findAll(tenantId, search);
  }

  @Get('suppliers/all')
  async getSuppliers(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.purchasesService.getSuppliers(tenantId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.purchasesService.findOne(id, tenantId);
  }
}
