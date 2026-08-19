# 🛒 SaaS Facturación, Inventario y Finanzas Multi-Tenant

Sistema de facturación, control de inventario por sucursales y finanzas multi-tienda desarrollado con **Next.js** (Frontend) y **NestJS** (Backend) utilizando **Prisma ORM** y **PostgreSQL**.

---

## 🛠️ Requisitos Previos
- Node.js >= 18.x
- PostgreSQL instalado y corriendo (o un servicio como Supabase/Neon).

---

## ⚙️ Configuración Inicial de la Base de Datos

1. Configura la URL de conexión en el archivo `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/saas_facturacion?schema=public"
   ```

2. Ejecuta la migración inicial de Prisma (Crea las tablas en PostgreSQL):
   ```bash
   npm run prisma:migrate --workspace=backend
   ```

3. Carga los datos de prueba (Seed):
   ```bash
   npm run seed --workspace=backend
   ```

---

## 🚀 Ejecución en Desarrollo

Desde la carpeta raíz (`SAAS-facturacion`):

- **Iniciar Backend (NestJS):**
  ```bash
  npm run dev:backend
  ```
  *Servidor escuchando en: http://localhost:3001/api*

- **Iniciar Frontend (Next.js):**
  ```bash
  npm run dev:frontend
  ```
  *Servidor escuchando en: http://localhost:3000*

---

## 👥 Roles del Sistema (RBAC)

1. **`SUPER_ADMIN`**: Administrador global de la plataforma SaaS.
2. **`STORE_ADMIN`**: Administrador del cliente/tienda (acceso total a su sucursal, finanzas e inventario).
3. **`SUPERVISOR`**: Supervisa ventas, autoriza ajustes de stock y genera reportes.
4. **`CASHIER`**: Cajero de punto de venta (apertura/cierre de caja y emisión de facturas).
