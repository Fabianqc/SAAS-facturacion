import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const DEFAULT_POSITIONS = [
  { name: 'Administradora', department: 'Administración', requiresUserAccount: true, defaultSalaryUSD: 350 },
  { name: 'Supervisor(a) de Tienda', department: 'Operaciones', requiresUserAccount: true, defaultSalaryUSD: 280 },
  { name: 'Cajero(a) Principal', department: 'Ventas / Caja', requiresUserAccount: true, defaultSalaryUSD: 200 },
  { name: 'Charcutero(a)', department: 'Charcutería', requiresUserAccount: false, defaultSalaryUSD: 220 },
  { name: 'Carnicero(a)', department: 'Carnicería', requiresUserAccount: false, defaultSalaryUSD: 240 },
  { name: 'Pasillero / Reponedor', department: 'Almacén & Anaqueles', requiresUserAccount: false, defaultSalaryUSD: 180 },
  { name: 'Vigilante / Seguridad', department: 'Seguridad', requiresUserAccount: false, defaultSalaryUSD: 190 },
];

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. CARGOS Y PUESTOS DE TRABAJO (JOB POSITIONS)
  // ==========================================

  async getPositions(tenantId: string) {
    let positions = await this.prisma.jobPosition.findMany({
      where: { tenantId, isActive: true },
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Seed default positions on first run if none exist
    if (positions.length === 0) {
      await this.prisma.jobPosition.createMany({
        data: DEFAULT_POSITIONS.map((p) => ({
          tenantId,
          name: p.name,
          department: p.department,
          requiresUserAccount: p.requiresUserAccount,
          defaultSalaryUSD: p.defaultSalaryUSD,
          isActive: true,
        })),
      });

      positions = await this.prisma.jobPosition.findMany({
        where: { tenantId, isActive: true },
        include: {
          _count: { select: { employees: true } },
        },
        orderBy: { name: 'asc' },
      });
    }

    return positions;
  }

  async createPosition(tenantId: string, data: any) {
    const existing = await this.prisma.jobPosition.findFirst({
      where: { tenantId, name: { equals: data.name.trim(), mode: 'insensitive' } },
    });

    if (existing) {
      throw new BadRequestException(`El puesto "${data.name}" ya existe`);
    }

    return this.prisma.jobPosition.create({
      data: {
        tenantId,
        name: data.name.trim(),
        department: data.department?.trim() || null,
        requiresUserAccount: Boolean(data.requiresUserAccount),
        defaultSalaryUSD: data.defaultSalaryUSD ? Number(data.defaultSalaryUSD) : 0,
        description: data.description?.trim() || null,
      },
    });
  }

  async deletePosition(id: string, tenantId: string) {
    const position = await this.prisma.jobPosition.findFirst({
      where: { id, tenantId, isActive: true },
      include: { _count: { select: { employees: true } } },
    });

    if (!position) {
      throw new NotFoundException(`Puesto de trabajo no encontrado`);
    }

    if (position._count.employees > 0) {
      throw new BadRequestException(
        `No se puede deshabilitar el puesto porque tiene ${position._count.employees} empleados asignados`,
      );
    }

    // Soft-delete inmutable
    return this.prisma.jobPosition.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==========================================
  // 2. EMPLEADOS & VINCULACIÓN POS (EMPLOYEES)
  // ==========================================

  async getEmployees(tenantId: string, storeId?: string, status?: string) {
    const where: any = { tenantId };
    if (storeId && storeId !== 'ALL') where.storeId = storeId;
    if (status && status !== 'ALL') where.status = status;

    return this.prisma.employee.findMany({
      where,
      include: {
        position: true,
        store: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, role: true, isActive: true } },
        _count: {
          select: { incidents: true, salaryAdvances: true, payrollReceipts: true },
        },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async getEmployee(id: string, tenantId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, tenantId },
      include: {
        position: true,
        store: true,
        user: { select: { id: true, email: true, role: true, isActive: true } },
        incidents: { orderBy: { date: 'desc' }, take: 20 },
        salaryAdvances: { orderBy: { date: 'desc' }, take: 20 },
        payrollReceipts: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Empleado no encontrado`);
    }

    return employee;
  }

  async createEmployee(tenantId: string, data: any) {
    const existing = await this.prisma.employee.findFirst({
      where: {
        tenantId,
        idDocType: data.idDocType || 'V',
        idDocNumber: data.idDocNumber.trim(),
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Ya existe un empleado con la cédula ${data.idDocType}-${data.idDocNumber}`,
      );
    }

    let linkedUserId: string | null = null;

    // Si se solicitó crear cuenta de acceso POS / Sistema
    if (data.createPosAccount && data.posEmail && data.posPassword) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.posEmail.trim().toLowerCase() },
      });

      if (existingUser) {
        throw new BadRequestException(`El correo "${data.posEmail}" ya está en uso por otro usuario`);
      }

      const hashedPassword = await bcrypt.hash(data.posPassword, 10);
      const newUser = await this.prisma.user.create({
        data: {
          tenantId,
          email: data.posEmail.trim().toLowerCase(),
          password: hashedPassword,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          role: data.posRole || 'CASHIER',
          isActive: true,
        },
      });

      linkedUserId = newUser.id;

      // Asignar tienda si existe
      if (data.storeId) {
        await this.prisma.userStore.create({
          data: {
            userId: newUser.id,
            storeId: data.storeId,
          },
        });
      }
    }

    return this.prisma.employee.create({
      data: {
        tenantId,
        storeId: data.storeId || null,
        positionId: data.positionId,
        userId: linkedUserId,
        idDocType: data.idDocType || 'V',
        idDocNumber: data.idDocNumber.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
        paymentFrequency: data.paymentFrequency || 'QUINCENAL',
        baseSalaryUSD: Number(data.baseSalaryUSD),
        paymentMethod: data.paymentMethod || 'CASH_USD',
        bankName: data.bankName?.trim() || null,
        bankAccount: data.bankAccount?.trim() || null,
        pagoMovilPhone: data.pagoMovilPhone?.trim() || null,
        pagoMovilRif: data.pagoMovilRif?.trim() || null,
        status: data.status || 'ACTIVE',
        notes: data.notes?.trim() || null,
      },
      include: {
        position: true,
        user: true,
        store: true,
      },
    });
  }

  async updateEmployee(id: string, tenantId: string, data: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, tenantId },
    });

    if (!employee) {
      throw new NotFoundException(`Empleado no encontrado`);
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        storeId: data.storeId !== undefined ? data.storeId || null : undefined,
        positionId: data.positionId !== undefined ? data.positionId : undefined,
        firstName: data.firstName !== undefined ? data.firstName.trim() : undefined,
        lastName: data.lastName !== undefined ? data.lastName.trim() : undefined,
        phone: data.phone !== undefined ? data.phone?.trim() || null : undefined,
        email: data.email !== undefined ? data.email?.trim() || null : undefined,
        address: data.address !== undefined ? data.address?.trim() || null : undefined,
        paymentFrequency: data.paymentFrequency !== undefined ? data.paymentFrequency : undefined,
        baseSalaryUSD: data.baseSalaryUSD !== undefined ? Number(data.baseSalaryUSD) : undefined,
        paymentMethod: data.paymentMethod !== undefined ? data.paymentMethod : undefined,
        bankName: data.bankName !== undefined ? data.bankName?.trim() || null : undefined,
        bankAccount: data.bankAccount !== undefined ? data.bankAccount?.trim() || null : undefined,
        pagoMovilPhone: data.pagoMovilPhone !== undefined ? data.pagoMovilPhone?.trim() || null : undefined,
        pagoMovilRif: data.pagoMovilRif !== undefined ? data.pagoMovilRif?.trim() || null : undefined,
        status: data.status !== undefined ? data.status : undefined,
        notes: data.notes !== undefined ? data.notes?.trim() || null : undefined,
      },
      include: {
        position: true,
        user: true,
        store: true,
      },
    });
  }

  async createPosAccountForEmployee(id: string, tenantId: string, data: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, tenantId },
      include: { user: true },
    });

    if (!employee) throw new NotFoundException(`Empleado no encontrado`);
    if (employee.userId) throw new BadRequestException(`El empleado ya tiene una cuenta POS asignada`);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email.trim().toLowerCase() },
    });

    if (existingUser) throw new BadRequestException(`El correo ya está en uso`);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: data.role || 'CASHIER',
        isActive: true,
      },
    });

    if (employee.storeId) {
      await this.prisma.userStore.create({
        data: { userId: user.id, storeId: employee.storeId },
      });
    }

    return this.prisma.employee.update({
      where: { id },
      data: { userId: user.id },
      include: { user: true, position: true },
    });
  }

  // ==========================================
  // 3. ASISTENCIAS, FALTAS E INFRACCIONES (INCIDENTS)
  // ==========================================

  async getIncidents(tenantId: string, employeeId?: string) {
    const where: any = { tenantId, isActive: true };
    if (employeeId && employeeId !== 'ALL') where.employeeId = employeeId;

    return this.prisma.employeeIncident.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, idDocType: true, idDocNumber: true, position: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async createIncident(tenantId: string, data: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId },
    });

    if (!employee) throw new NotFoundException(`Empleado no encontrado`);

    return this.prisma.employeeIncident.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        date: data.date ? new Date(data.date) : new Date(),
        type: data.type, // FALTA_INJUSTIFICADA, FALTA_JUSTIFICADA, RETRASO, INFRACCION_DISCIPLINARIA, BONO_MERITO, HORAS_EXTRAS
        amountUSD: data.amountUSD ? Number(data.amountUSD) : 0,
        deductFromPayroll: data.deductFromPayroll !== undefined ? Boolean(data.deductFromPayroll) : true,
        notes: data.notes.trim(),
        isActive: true,
      },
      include: { employee: true },
    });
  }

  async deleteIncident(id: string, tenantId: string) {
    const incident = await this.prisma.employeeIncident.findFirst({
      where: { id, tenantId, isActive: true },
    });

    if (!incident) throw new NotFoundException(`Incidencia no encontrada`);

    // Soft-delete inmutable
    return this.prisma.employeeIncident.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==========================================
  // 4. ADELANTOS DE SUELDO & VALES (ADVANCES)
  // ==========================================

  async getAdvances(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId && employeeId !== 'ALL') where.employeeId = employeeId;

    return this.prisma.salaryAdvance.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, idDocType: true, idDocNumber: true, position: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async createAdvance(tenantId: string, data: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId },
    });

    if (!employee) throw new NotFoundException(`Empleado no encontrado`);

    const exchangeRate = Number(data.exchangeRate || 775.3356);
    const amountUSD = Number(data.amountUSD);
    const amountVES = Number(data.amountVES || amountUSD * exchangeRate);

    return this.prisma.salaryAdvance.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        date: data.date ? new Date(data.date) : new Date(),
        amountUSD,
        amountVES,
        exchangeRate,
        status: 'PAID_OUT',
        reason: data.reason?.trim() || null,
        receiptNumber: data.receiptNumber?.trim() || `VALE-${Date.now().toString().slice(-6)}`,
      },
      include: { employee: true },
    });
  }

  // ==========================================
  // 5. LIQUIDACIÓN DE NÓMINA & RECIBOS (PAYROLL)
  // ==========================================

  async calculatePayrollPreview(tenantId: string, frequency: string, exchangeRateUSD: number) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, status: 'ACTIVE', paymentFrequency: frequency },
      include: {
        position: true,
        incidents: {
          where: {
            date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        salaryAdvances: {
          where: { status: 'PAID_OUT' },
        },
      },
    });

    const divisor = frequency === 'SEMANAL' ? 4 : frequency === 'QUINCENAL' ? 2 : 1;

    return employees.map((emp) => {
      const basePeriodSalaryUSD = Number(emp.baseSalaryUSD) / divisor;

      // Calcular bonos y deducciones
      let bonusUSD = 0;
      let deductionsUSD = 0;

      emp.incidents.forEach((inc) => {
        const amt = Number(inc.amountUSD || 0);
        if (inc.type === 'BONO_MERITO' || inc.type === 'HORAS_EXTRAS') {
          bonusUSD += amt;
        } else if (inc.deductFromPayroll) {
          // Si es falta sin monto específico, se descuenta 1 día
          if (amt > 0) {
            deductionsUSD += amt;
          } else if (inc.type === 'FALTA_INJUSTIFICADA') {
            const dailyWage = basePeriodSalaryUSD / (frequency === 'SEMANAL' ? 6 : 15);
            deductionsUSD += dailyWage;
          }
        }
      });

      // Adelantos pendientes
      const advancesUSD = emp.salaryAdvances.reduce((sum, a) => sum + Number(a.amountUSD), 0);

      const netSalaryUSD = Math.max(0, basePeriodSalaryUSD + bonusUSD - deductionsUSD - advancesUSD);
      const netSalaryVES = netSalaryUSD * exchangeRateUSD;

      return {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        idDoc: `${emp.idDocType}-${emp.idDocNumber}`,
        position: emp.position.name,
        paymentFrequency: emp.paymentFrequency,
        basePeriodSalaryUSD,
        bonusUSD,
        deductionsUSD,
        advancesUSD,
        netSalaryUSD,
        netSalaryVES,
        exchangeRateUSD,
      };
    });
  }

  async processPayroll(tenantId: string, data: any) {
    const exchangeRate = Number(data.exchangeRate || 775.3356);
    const calculations = await this.calculatePayrollPreview(tenantId, data.frequency || 'QUINCENAL', exchangeRate);

    if (calculations.length === 0) {
      throw new BadRequestException(`No hay empleados activos con frecuencia de pago ${data.frequency || 'QUINCENAL'}`);
    }

    const totalGrossUSD = calculations.reduce((sum, c) => sum + c.basePeriodSalaryUSD + c.bonusUSD, 0);
    const totalDeductionsUSD = calculations.reduce((sum, c) => sum + c.deductionsUSD + c.advancesUSD, 0);
    const totalNetUSD = calculations.reduce((sum, c) => sum + c.netSalaryUSD, 0);

    return this.prisma.$transaction(async (tx) => {
      const period = await tx.payrollPeriod.create({
        data: {
          tenantId,
          name: data.name || `Nómina ${data.frequency || 'Quincenal'} - ${new Date().toLocaleDateString('es-VE')}`,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          endDate: data.endDate ? new Date(data.endDate) : new Date(),
          frequency: data.frequency || 'QUINCENAL',
          exchangeRate,
          totalGrossUSD,
          totalDeductionsUSD,
          totalNetUSD,
          status: 'PAID',
        },
      });

      // Crear recibos
      for (const calc of calculations) {
        await tx.payrollReceipt.create({
          data: {
            payrollPeriodId: period.id,
            employeeId: calc.employeeId,
            baseSalaryUSD: calc.basePeriodSalaryUSD,
            bonusAmountUSD: calc.bonusUSD,
            deductionsUSD: calc.deductionsUSD,
            advancesUSD: calc.advancesUSD,
            netSalaryUSD: calc.netSalaryUSD,
            netSalaryVES: calc.netSalaryVES,
            exchangeRate,
            status: 'PAID',
            notes: `Liquidación formal de nómina ${period.name}`,
          },
        });

        // Marcar adelantos como deducidos
        await tx.salaryAdvance.updateMany({
          where: { employeeId: calc.employeeId, status: 'PAID_OUT' },
          data: { status: 'DEDUCTED' },
        });
      }

      return period;
    });
  }

  async getPayrollPeriods(tenantId: string) {
    return this.prisma.payrollPeriod.findMany({
      where: { tenantId },
      include: {
        receipts: {
          include: {
            employee: { select: { firstName: true, lastName: true, idDocType: true, idDocNumber: true, position: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
