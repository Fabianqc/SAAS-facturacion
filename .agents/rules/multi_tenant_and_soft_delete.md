# Reglas Fundamentales de Arquitectura: Inmutabilidad (Soft-Delete) & Aislamiento Estricto Multi-Tenant

## 1. Regla de Inmutabilidad & Cero Borrado Físico (Soft-Delete)
- **NADA SE BORRA FÍSICAMENTE DE LA BASE DE DATOS:** En ningún controlador, servicio, script o query se debe ejecutar `DELETE FROM` o `prisma.<model>.delete()`.
- **Deshabilitación / Pausa en su lugar:** Todos los registros (Productos, Categorías, Proveedores, Clientes, Empleados, Cargos, Sucursales, Incidencias, Facturas) deben marcarse como deshabilitados/inactivos mediante:
  - `isActive = false`
  - `status = 'INACTIVE' | 'TERMINATED' | 'CANCELLED' | 'VOIDED'`
- **Preservación de Trazabilidad Contable y Fiscal (SENIAT):** Eliminar registros destruye la integridad de los informes de inventario, auditorías de Kardex, comprobantes fiscales y estados financieros.

---

## 2. Aislamiento Estricto de Datos Multi-Tenant (Tenant Data Isolation)
- **CERO FUGA DE DATOS ENTRE CLIENTES/EMPRESAS:** Ninguna empresa puede ver, modificar, consultar o interferir con la información de otra empresa.
- **Filtro Obligatorio de `tenantId`:** CADA consulta `findMany`, `findFirst`, `findUnique`, `update`, `create`, `count`, `aggregate` en el backend DEBE incluir obligatoriamente el `tenantId` extraído del token JWT verificado (`req.user.tenantId`).
- **Validación de Pertenencia:** Antes de asociar una categoría, un almacén, un empleado o un producto a una transacción o compra, el backend debe validar que dicha entidad pertenezca al mismo `tenantId`.
