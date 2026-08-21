'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';
import {
  Package,
  Boxes,
  Plus,
  Tag,
  Sliders,
  FileSpreadsheet,
  Receipt,
  Building2,
  TrendingUp,
  BarChart3,
  DollarSign,
  Store,
  Users,
  UserCheck,
  ShieldCheck,
  ShoppingBag,
  Layers,
  FileText,
  Lock,
  Search,
  ChevronDown,
  ChevronRight,
  UserPlus,
  CircleDot,
  Calculator,
  History,
  Settings,
  HelpCircle,
  Menu,
  ChevronLeft,
} from 'lucide-react';

export type SidebarAction =
  | 'catalog'
  | 'openInventory'
  | 'openNewProduct'
  | 'openCategories'
  | 'openStockModal'
  | 'openPurchaseModal'
  | 'openPurchaseHistory'
  | 'openSuppliers'
  | 'openAddSupplier'
  | 'openBcvHistory'
  | 'openProfitLoss'
  | 'openHrPayroll'
  | 'cashierAssignment'
  | 'posTerminal'
  | 'clientDirectory'
  | 'tenantsList'
  | 'newTenant'
  | 'globalSettings';

interface SidebarProps {
  onAction: (action: SidebarAction) => void;
  activeItem?: string;
  lowStockCount?: number;
  bcvUsd?: number;
}

interface NavCategory {
  title: string;
  items: {
    id: SidebarAction;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
    isModalAction?: boolean;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  onAction,
  activeItem = 'catalog',
  lowStockCount = 0,
  bcvUsd,
}) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  if (!user) return null;

  const toggleCategory = (title: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // BUILD ROLE-SPECIFIC CATEGORIES
  let categories: NavCategory[] = [];

  if (user.role === 'STORE_ADMIN') {
    categories = [
      {
        title: 'Inventario & Catálogo',
        items: [
          { id: 'catalog', label: 'Catálogo de Productos', icon: Package },
          {
            id: 'openInventory',
            label: 'Control de Inventario',
            icon: Boxes,
            badge: lowStockCount > 0 ? `${lowStockCount} Bajo` : undefined,
            badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400',
          },
          { id: 'openNewProduct', label: 'Nuevo Producto', icon: Plus, isModalAction: true },
          { id: 'openCategories', label: 'Categorías', icon: Tag, isModalAction: true },
          { id: 'openStockModal', label: 'Ajustes & Kardex', icon: Sliders },
        ],
      },
      {
        title: 'Compras & Proveedores',
        items: [
          {
            id: 'openPurchaseModal',
            label: 'Ingresar Factura Compra',
            icon: FileSpreadsheet,
            badge: 'Ingreso',
            badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400',
            isModalAction: true,
          },
          { id: 'openPurchaseHistory', label: 'Facturas de Proveedores', icon: Receipt, isModalAction: true },
          { id: 'openSuppliers', label: 'Directorio de Proveedores', icon: Building2, isModalAction: true },
          { id: 'openAddSupplier', label: 'Añadir Proveedor', icon: Plus, isModalAction: true },
        ],
      },
      {
        title: 'Finanzas & Reportes',
        items: [
          {
            id: 'openProfitLoss',
            label: 'Rentabilidad & P&L',
            icon: BarChart3,
            badge: 'Finanzas',
            badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400',
          },
          {
            id: 'openBcvHistory',
            label: 'Historial Tasas BCV',
            icon: TrendingUp,
            badge: bcvUsd ? `${bcvUsd.toFixed(0)} Bs` : undefined,
            isModalAction: true,
          },
        ],
      },
      {
        title: 'Talento Humano & Nómina',
        items: [
          {
            id: 'openHrPayroll',
            label: 'Personal & Nómina',
            icon: Users,
            badge: 'RRHH',
            badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400',
          },
        ],
      },
      {
        title: 'Configuración Tienda',
        items: [
          { id: 'cashierAssignment', label: 'Sucursales & Cajas', icon: Store },
        ],
      },
    ];
  } else if (user.role === 'SUPERVISOR') {
    categories = [
      {
        title: 'Cajas & Turnos',
        items: [
          { id: 'cashierAssignment', label: 'Asignación de Cajas', icon: UserCheck },
          { id: 'catalog', label: 'Estado de Puntos de Venta', icon: Layers },
        ],
      },
      {
        title: 'Arqueo & Cuadre',
        items: [
          { id: 'openStockModal', label: 'Cuadre de Cajas (Ciego)', icon: Calculator },
          { id: 'openBcvHistory', label: 'Auditoría de Turnos', icon: History, isModalAction: true },
        ],
      },
      {
        title: 'Ventas & Auditoría',
        items: [
          { id: 'openPurchaseHistory', label: 'Comprobantes Fiscales', icon: FileText },
          { id: 'catalog', label: 'Consulta de Precios', icon: Search },
        ],
      },
    ];
  } else if (user.role === 'CASHIER') {
    categories = [
      {
        title: 'Punto de Venta',
        items: [
          { id: 'posTerminal', label: 'Terminal de Cobro (POS)', icon: ShoppingBag },
          { id: 'catalog', label: 'Consulta de Catálogo', icon: Search },
        ],
      },
      {
        title: 'Mi Turno',
        items: [
          { id: 'openBcvHistory', label: 'Tasas BCV de Cobro', icon: TrendingUp, isModalAction: true },
          { id: 'clientDirectory', label: 'Clientes Registrados', icon: Users },
        ],
      },
    ];
  } else if (user.role === 'SUPER_ADMIN') {
    categories = [
      {
        title: 'Empresas SaaS',
        items: [
          { id: 'tenantsList', label: 'Directorio de Empresas', icon: Building2 },
          { id: 'newTenant', label: 'Registrar Nueva Empresa', icon: Plus },
        ],
      },
      {
        title: 'Monitoreo Global',
        items: [
          { id: 'openBcvHistory', label: 'Tasas BCV Globales', icon: TrendingUp, isModalAction: true },
          { id: 'globalSettings', label: 'Parámetros del SaaS', icon: Settings },
        ],
      },
    ];
  }

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between shrink-0 z-30 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Header / Collapser */}
      <div>
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Menú Principal
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all mx-auto"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Categorized Navigation List */}
        <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {categories.map((category) => {
            const isCatCollapsed = collapsedCategories[category.title];

            return (
              <div key={category.title} className="space-y-1.5">
                {/* Category Header */}
                {!isCollapsed && (
                  <button
                    onClick={() => toggleCategory(category.title)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <span>{category.title}</span>
                    {isCatCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}

                {/* Category Items */}
                {!isCatCollapsed && (
                  <div className="space-y-0.5">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeItem === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onAction(item.id)}
                          title={item.label}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800 shadow-xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                              }`}
                            />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                          </div>

                          {!isCollapsed && item.badge && (
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Store Profile Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 m-2 rounded-xl">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
              VE
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white truncate text-[11px]">
                {user.tenant ? user.tenant.name : 'SaaS Facturación'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {user.primaryStore ? user.primaryStore.name : 'Sucursal Activa'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
