import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Request() req: any,
    @Query('storeId') storeId?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.productsService.findAll(
      tenantId,
      storeId,
      search,
      categoryId,
      lowStockOnly === 'true',
    );
  }

  @Get('categories/all')
  async getCategories(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.productsService.getCategories(tenantId);
  }

  @Get('stores/all')
  async getStores(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.productsService.getStores(tenantId);
  }

  @Get('movements/all')
  async getAllMovements(
    @Request() req: any,
    @Query('storeId') storeId?: string,
    @Query('type') type?: any,
    @Query('productId') productId?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.productsService.getAllMovements(
      tenantId,
      storeId,
      type,
      productId,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Post('categories')
  async createCategory(@Request() req: any, @Body() dto: CreateCategoryDto) {
    const tenantId = req.user.tenantId;
    return this.productsService.createCategory(dto, tenantId);
  }

  @Delete('categories/:id')
  async deleteCategory(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.productsService.deleteCategory(id, tenantId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.productsService.findOne(id, tenantId);
  }

  @Post()
  async create(@Request() req: any, @Body() createProductDto: CreateProductDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id || req.user.userId;
    return this.productsService.create(createProductDto, tenantId, userId);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.productsService.update(id, updateProductDto, tenantId);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.productsService.remove(id, tenantId);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.productsService.toggleStatus(id, tenantId);
  }

  @Post(':id/stock-movement')
  async registerStockMovement(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: StockMovementDto,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id || req.user.userId;
    return this.productsService.registerStockMovement(id, dto, tenantId, userId);
  }

  @Get(':id/movements')
  async getMovements(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.productsService.getMovements(id, tenantId);
  }
}
