import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('hr')
@UseGuards(JwtAuthGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ==========================================
  // CARGOS Y PUESTOS (POSITIONS)
  // ==========================================

  @Get('positions')
  async getPositions(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.hrService.getPositions(tenantId);
  }

  @Post('positions')
  async createPosition(@Request() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    return this.hrService.createPosition(tenantId, body);
  }

  @Delete('positions/:id')
  async deletePosition(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.hrService.deletePosition(id, tenantId);
  }

  // ==========================================
  // EMPLEADOS & VINCULACIÓN POS (EMPLOYEES)
  // ==========================================

  @Get('employees')
  async getEmployees(
    @Request() req: any,
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.hrService.getEmployees(tenantId, storeId, status);
  }

  @Get('employees/:id')
  async getEmployee(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.hrService.getEmployee(id, tenantId);
  }

  @Post('employees')
  async createEmployee(@Request() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    return this.hrService.createEmployee(tenantId, body);
  }

  @Put('employees/:id')
  async updateEmployee(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const tenantId = req.user.tenantId;
    return this.hrService.updateEmployee(id, tenantId, body);
  }

  @Post('employees/:id/pos-account')
  async createPosAccountForEmployee(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const tenantId = req.user.tenantId;
    return this.hrService.createPosAccountForEmployee(id, tenantId, body);
  }

  // ==========================================
  // ASISTENCIAS, FALTAS & INFRACCIONES
  // ==========================================

  @Get('incidents')
  async getIncidents(
    @Request() req: any,
    @Query('employeeId') employeeId?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.hrService.getIncidents(tenantId, employeeId);
  }

  @Post('incidents')
  async createIncident(@Request() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    return this.hrService.createIncident(tenantId, body);
  }

  @Delete('incidents/:id')
  async deleteIncident(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.hrService.deleteIncident(id, tenantId);
  }

  // ==========================================
  // ADELANTOS DE SUELDO & VALES
  // ==========================================

  @Get('advances')
  async getAdvances(
    @Request() req: any,
    @Query('employeeId') employeeId?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.hrService.getAdvances(tenantId, employeeId);
  }

  @Post('advances')
  async createAdvance(@Request() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    return this.hrService.createAdvance(tenantId, body);
  }

  // ==========================================
  // NÓMINA & RECIBOS DE PAGO (PAYROLL)
  // ==========================================

  @Get('payroll/preview')
  async getPayrollPreview(
    @Request() req: any,
    @Query('frequency') frequency: string,
    @Query('exchangeRate') exchangeRate?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.hrService.calculatePayrollPreview(
      tenantId,
      frequency || 'QUINCENAL',
      exchangeRate ? parseFloat(exchangeRate) : 775.3356,
    );
  }

  @Post('payroll/process')
  async processPayroll(@Request() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    return this.hrService.processPayroll(tenantId, body);
  }

  @Get('payroll/periods')
  async getPayrollPeriods(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.hrService.getPayrollPeriods(tenantId);
  }
}
