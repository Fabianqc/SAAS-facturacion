import { PrismaClient, Role, RifType, TaxType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos de prueba para Venezuela (Seed)...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Limpiar datos existentes de prueba
  await prisma.userStore.deleteMany();
  await prisma.user.deleteMany();
  await prisma.productStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.store.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.exchangeRate.deleteMany();

  // 1. Crear Tasas de Cambio BCV Oficiales del Día (USD & EUR)
  const usdRate = await prisma.exchangeRate.create({
    data: {
      rate: 775.3356,
      source: 'BCV_USD',
      isActive: true,
    },
  });

  const eurRate = await prisma.exchangeRate.create({
    data: {
      rate: 897.8231,
      source: 'BCV_EUR',
      isActive: true,
    },
  });
  console.log(`✅ Tasas BCV registradas -> USD: ${usdRate.rate} VES | EUR: ${eurRate.rate} VES`);

  // 2. Crear Tenant de prueba con RIF Fiscal
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Inversiones Y Tienda Venzla, C.A.',
      rifType: RifType.J,
      rifNumber: '123456789', // RIF: J-12345678-9
      address: 'Av. Las Mercedes, Caracas, Venezuela',
      phone: '+58 212-9999999',
      plan: 'PREMIUM',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Tenant Creado: ${tenant.name} (RIF: ${tenant.rifType}-${tenant.rifNumber})`);

  // 3. Crear Sucursal Principal
  const store = await prisma.store.create({
    data: {
      tenantId: tenant.id,
      name: 'Sucursal Las Mercedes',
      address: 'Calle Paris, Edif. Comercial, Nivel PB',
      phone: '+58 414-1234567',
      invoicePrefix: 'FAC-01',
      controlPrefix: '00',
    },
  });
  console.log(`✅ Sucursal Creada: ${store.name}`);

  // 4. Crear Usuarios por Rol
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@saasve.com',
      password: hashedPassword,
      firstName: 'SuperAdmin',
      lastName: 'SaaS',
      role: Role.SUPER_ADMIN,
    },
  });

  const storeAdmin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'gerente@tiendave.com',
      password: hashedPassword,
      firstName: 'Alejandro',
      lastName: 'Gerente',
      role: Role.STORE_ADMIN,
      stores: {
        create: { storeId: store.id },
      },
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'supervisor@tiendave.com',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Supervisor',
      role: Role.SUPERVISOR,
      stores: {
        create: { storeId: store.id },
      },
    },
  });

  const cashier = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'cajero@tiendave.com',
      password: hashedPassword,
      firstName: 'Valentina',
      lastName: 'Cajera',
      role: Role.CASHIER,
      stores: {
        create: { storeId: store.id },
      },
    },
  });
  console.log('✅ Usuarios Creados con éxito (SuperAdmin, Admin Tienda, Supervisor, Cajera)');

  // 5. Crear Categoría y Productos Bi-Moneda
  const category = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Viveres y Electrónica',
    },
  });

  const p1 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: category.id,
      sku: 'PROD-001',
      barcode: '7591234567890',
      name: 'Harina de Maíz Precocida 1Kg',
      description: 'Harina precocida para arepas',
      costPriceUSD: 0.85,
      salePriceUSD: 1.2,
      taxType: TaxType.EXENTO_0, // Exento de IVA
      unit: 'KG',
      minStock: 10,
      stocks: {
        create: { storeId: store.id, quantity: 100 },
      },
    },
  });

  const p2 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: category.id,
      sku: 'ELEC-002',
      barcode: '7599876543210',
      name: 'Powerbank 10000mAh',
      description: 'Batería portátil carga rápida',
      costPriceUSD: 15.0,
      salePriceUSD: 25.0,
      taxType: TaxType.GENERAL_16, // IVA 16%
      unit: 'PZA',
      minStock: 5,
      stocks: {
        create: { storeId: store.id, quantity: 15 },
      },
    },
  });

  console.log(`✅ Productos Creados: ${p1.name} (Exento) y ${p2.name} (IVA 16%)`);

  // 6. Cliente de prueba con Cédula/RIF
  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      rifType: RifType.V,
      rifNumber: '18765432', // V-18765432
      name: 'Juan Pérez',
      email: 'juanperez@gmail.com',
      phone: '+58 412-9876543',
      address: 'Caracas, Venezuela',
    },
  });
  console.log(`✅ Cliente creado: ${customer.name} (V-${customer.rifNumber})`);

  console.log('🎉 Seed Fiscal Venezuela completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
