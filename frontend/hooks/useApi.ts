'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Product, Category, StockMovement, MovementType } from '../types/product';
import { Supplier, PurchaseInvoice } from '../types/purchase';

const API_BASE = 'http://localhost:3001/api';

/**
 * Hook para consultar las tasas oficiales BCV (USD / EUR)
 */
export function useBcvRates() {
  return useQuery({
    queryKey: ['bcv', 'current'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/bcv/current`);
      if (!res.ok) throw new Error('Error al obtener tasas oficiales BCV');
      return res.json() as Promise<{ usd: number; eur: number; updatedAt: string }>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para listar productos del catálogo con soporte de filtros
 */
export function useProducts(filters?: {
  storeId?: string;
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
}) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.storeId) params.append('storeId', filters.storeId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.categoryId && filters.categoryId !== 'ALL') params.append('categoryId', filters.categoryId);
      if (filters?.lowStockOnly) params.append('lowStockOnly', 'true');

      const res = await fetch(`${API_BASE}/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar catálogo de productos');
      return res.json() as Promise<Product[]>;
    },
    enabled: Boolean(token),
  });
}

/**
 * Hook para listar categorías
 */
export function useCategories() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/products/categories/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar categorías');
      return res.json() as Promise<Category[]>;
    },
    enabled: Boolean(token),
  });
}

/**
 * Hook para listar proveedores
 */
export function useSuppliers() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/purchases/suppliers/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar proveedores');
      return res.json() as Promise<Supplier[]>;
    },
    enabled: Boolean(token),
  });
}

/**
 * Hook para listar facturas de compras a proveedores
 */
export function usePurchases() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/purchases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar facturas de compra');
      return res.json() as Promise<PurchaseInvoice[]>;
    },
    enabled: Boolean(token),
  });
}

/**
 * Hook para listar almacenes / sucursales
 */
export function useStores() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/products/stores/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar sucursales');
      return res.json() as Promise<Array<{ id: string; name: string; code: string; address?: string }>>;
    },
    enabled: Boolean(token),
  });
}

/**
 * Hook para consultar el Kardex global de movimientos
 */
export function useMovements(filters?: {
  storeId?: string;
  type?: string;
  productId?: string;
  limit?: number;
}) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['movements', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.storeId && filters.storeId !== 'ALL') params.append('storeId', filters.storeId);
      if (filters?.type && filters.type !== 'ALL') params.append('type', filters.type);
      if (filters?.productId && filters.productId !== 'ALL') params.append('productId', filters.productId);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const res = await fetch(`${API_BASE}/products/movements/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al consultar movimientos de inventario');
      return res.json() as Promise<StockMovement[]>;
    },
    enabled: Boolean(token),
  });
}

/**
 * Mutación para alternar estado activo/pausado de un producto
 */
export function useToggleProductStatus() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(`${API_BASE}/products/${productId}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al actualizar estado del producto');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Mutación para procesar una nueva factura de compra
 */
export function useCreatePurchase() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${API_BASE}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al procesar factura de compra');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// ==========================================
// RECURSOS HUMANOS Y NÓMINA (HR & PAYROLL)
// ==========================================

import {
  JobPosition,
  Employee,
  EmployeeIncident,
  SalaryAdvance,
  PayrollCalculation,
  PayrollPeriod,
} from '../types/hr';

/**
 * Hook para listar cargos / puestos de trabajo
 */
export function useJobPositions() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['hr', 'positions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/hr/positions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar puestos de trabajo');
      return res.json() as Promise<JobPosition[]>;
    },
    enabled: Boolean(token),
  });
}

/**
 * Hook para listar empleados
 */
export function useEmployees(filters?: { storeId?: string; status?: string }) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['hr', 'employees', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.storeId && filters.storeId !== 'ALL') params.append('storeId', filters.storeId);
      if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);

      const res = await fetch(`${API_BASE}/hr/employees?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar empleados');
      return res.json() as Promise<Employee[]>;
    },
    enabled: Boolean(token),
  });
}

/**
 * Hook para listar faltas e incidencias
 */
export function useEmployeeIncidents(employeeId?: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['hr', 'incidents', employeeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (employeeId && employeeId !== 'ALL') params.append('employeeId', employeeId);

      const res = await fetch(`${API_BASE}/hr/incidents?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar incidencias');
      return res.json() as Promise<EmployeeIncident[]>;
    },
    enabled: Boolean(token),
  });
}

/**
 * Hook para listar adelantos de sueldo y vales
 */
export function useSalaryAdvances(employeeId?: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['hr', 'advances', employeeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (employeeId && employeeId !== 'ALL') params.append('employeeId', employeeId);

      const res = await fetch(`${API_BASE}/hr/advances?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar adelantos');
      return res.json() as Promise<SalaryAdvance[]>;
    },
    enabled: Boolean(token),
  });
}

/**
 * Hook para calcular vista previa de nómina
 */
export function usePayrollPreview(frequency: string, exchangeRate: number) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['hr', 'payroll-preview', frequency, exchangeRate],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/hr/payroll/preview?frequency=${frequency}&exchangeRate=${exchangeRate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error('Error al calcular nómina');
      return res.json() as Promise<PayrollCalculation[]>;
    },
    enabled: Boolean(token && frequency),
  });
}

/**
 * Hook para listar periodos de nómina procesados
 */
export function usePayrollPeriods() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['hr', 'payroll-periods'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/hr/payroll/periods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar historial de nómina');
      return res.json() as Promise<PayrollPeriod[]>;
    },
    enabled: Boolean(token),
  });
}

/**
 * Mutación para crear un puesto de trabajo
 */
export function useCreateJobPosition() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${API_BASE}/hr/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear puesto');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'positions'] });
    },
  });
}

/**
 * Mutación para registrar o contratar un empleado
 */
export function useCreateEmployee() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${API_BASE}/hr/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrar empleado');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'positions'] });
    },
  });
}

/**
 * Mutación para registrar una incidencia (falta, retraso, bono)
 */
export function useCreateIncident() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${API_BASE}/hr/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrar incidencia');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'incidents'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'payroll-preview'] });
    },
  });
}

/**
 * Mutación para registrar un adelanto de sueldo / vale
 */
export function useCreateSalaryAdvance() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${API_BASE}/hr/advances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrar adelanto');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'advances'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'payroll-preview'] });
    },
  });
}

/**
 * Mutación para procesar nómina
 */
export function useProcessPayroll() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${API_BASE}/hr/payroll/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al procesar nómina');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'payroll-periods'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'advances'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'payroll-preview'] });
    },
  });
}

/**
 * Mutación para crear cuenta de acceso POS para un empleado
 */
export function useCreatePosAccount() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, payload }: { employeeId: string; payload: any }) => {
      const res = await fetch(`${API_BASE}/hr/employees/${employeeId}/pos-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear cuenta POS');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
    },
  });
}

