'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '../../../components/RoleGuard';
import { Navbar } from '../../../components/Navbar';
import { Sidebar, SidebarAction } from '../../../components/Sidebar';
import {
  useBcvRates,
  useJobPositions,
  useEmployees,
  useEmployeeIncidents,
  useSalaryAdvances,
  usePayrollPeriods,
  usePayrollPreview,
  useCreateEmployee,
  useCreateJobPosition,
  useCreateIncident,
  useCreateSalaryAdvance,
  useProcessPayroll,
  useCreatePosAccount,
} from '../../../hooks/useApi';
import {
  Employee,
  JobPosition,
  EmployeeIncident,
  SalaryAdvance,
  PayrollPeriod,
} from '../../../types/hr';
import {
  Users,
  UserPlus,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Briefcase,
  ShieldCheck,
  KeyRound,
  Clock,
  Ban,
  TrendingUp,
  Plus,
  Search,
  Sliders,
  Filter,
  X,
  CreditCard,
  UserCheck,
  Award,
  Wallet,
  Printer,
} from 'lucide-react';

const INCIDENT_TYPES = [
  { id: 'FALTA_INJUSTIFICADA', label: '⚠️ Falta Injustificada (Descuenta día)', deduct: true },
  { id: 'FALTA_JUSTIFICADA', label: '🩺 Falta Justificada / Reposo Médico', deduct: false },
  { id: 'RETRASO', label: '⏰ Retraso / Llegada Tardía', deduct: true },
  { id: 'INFRACCION_DISCIPLINARIA', label: '🚫 Infracción / Amonestación Disciplinaria', deduct: true },
  { id: 'BONO_MERITO', label: '🌟 Bono por Mérito / Reconocimiento', deduct: false },
  { id: 'HORAS_EXTRAS', label: '⏳ Horas Extras Trabajadas', deduct: false },
];

function HrPayrollPageContent() {
  const router = useRouter();

  // React Query Hooks
  const { data: bcvRates } = useBcvRates();
  const { data: positions = [], isLoading: isLoadingPositions } = useJobPositions();
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees();
  const { data: incidents = [] } = useEmployeeIncidents();
  const { data: advances = [] } = useSalaryAdvances();
  const { data: payrollPeriods = [] } = usePayrollPeriods();

  const bcvUsd = bcvRates?.usd || 775.3356;
  const bcvEur = bcvRates?.eur || 897.8231;

  // Tabs
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll' | 'advances' | 'incidents' | 'positions'>('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPositionFilter, setSelectedPositionFilter] = useState('ALL');

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isPosAccountModalOpen, setIsPosAccountModalOpen] = useState(false);
  const [selectedEmployeeForPos, setSelectedEmployeeForPos] = useState<Employee | null>(null);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<any | null>(null);

  // Notice
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Mutations
  const createEmployeeMutation = useCreateEmployee();
  const createPositionMutation = useCreateJobPosition();
  const createIncidentMutation = useCreateIncident();
  const createAdvanceMutation = useCreateSalaryAdvance();
  const processPayrollMutation = useProcessPayroll();
  const createPosAccountMutation = useCreatePosAccount();

  // Payroll Calculation State
  const [payrollFrequency, setPayrollFrequency] = useState('QUINCENAL');
  const { data: payrollPreview = [] } = usePayrollPreview(payrollFrequency, bcvUsd);

  // Form State: New Employee
  const [empIdDocType, setEmpIdDocType] = useState<'V' | 'E' | 'J' | 'P'>('V');
  const [empIdDocNumber, setEmpIdDocNumber] = useState('');
  const [empFirstName, setEmpFirstName] = useState('');
  const [empLastName, setEmpLastName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPositionId, setEmpPositionId] = useState('');
  // Form State: New Employee (Dual Currency Engine)
  const [empSalaryCurrency, setEmpSalaryCurrency] = useState<'USD' | 'VES'>('USD');
  const [empBaseSalary, setEmpBaseSalary] = useState<number | ''>(200);
  const [empBaseSalaryVES, setEmpBaseSalaryVES] = useState<number | ''>(200 * 775.3356);
  const [empFrequency, setEmpFrequency] = useState<'SEMANAL' | 'QUINCENAL' | 'MENSUAL'>('QUINCENAL');
  const [empPaymentMethod, setEmpPaymentMethod] = useState<'CASH_USD' | 'PAGO_MOVIL' | 'TRANSFER_VES'>('CASH_USD');
  const [empBankName, setEmpBankName] = useState('');
  const [empBankAccount, setEmpBankAccount] = useState('');
  const [empPagoMovilPhone, setEmpPagoMovilPhone] = useState('');
  const [empPagoMovilRif, setEmpPagoMovilRif] = useState('');
  const [empCreatePosAccount, setEmpCreatePosAccount] = useState(false);
  const [empPosEmail, setEmpPosEmail] = useState('');
  const [empPosPassword, setEmpPosPassword] = useState('123456');
  const [empPosRole, setEmpPosRole] = useState<'CASHIER' | 'SUPERVISOR' | 'STORE_ADMIN'>('CASHIER');

  // Form State: New Position
  const [posName, setPosName] = useState('');
  const [posDepartment, setPosDepartment] = useState('Ventas / Caja');
  const [posRequiresAccount, setPosRequiresAccount] = useState(false);
  const [posDefaultSalary, setPosDefaultSalary] = useState<number | ''>(200);

  // Form State: Incident
  const [incEmployeeId, setIncEmployeeId] = useState('');
  const [incType, setIncType] = useState('FALTA_INJUSTIFICADA');
  const [incAmountUSD, setIncAmountUSD] = useState<number | ''>(0);
  const [incNotes, setIncNotes] = useState('');

  // Form State: Advance
  const [advEmployeeId, setAdvEmployeeId] = useState('');
  const [advAmountUSD, setAdvAmountUSD] = useState<number | ''>(20);
  const [advReason, setAdvReason] = useState('');

  // Form State: POS Account for existing employee
  const [posAccEmail, setPosAccEmail] = useState('');
  const [posAccPassword, setPosAccPassword] = useState('123456');
  const [posAccRole, setPosAccRole] = useState<'CASHIER' | 'SUPERVISOR' | 'STORE_ADMIN'>('CASHIER');

  // KPIs
  const totalEmployeesCount = employees.length;
  const activeEmployeesCount = employees.filter((e) => e.status === 'ACTIVE').length;
  const totalMonthlyPayrollUSD = employees
    .filter((e) => e.status === 'ACTIVE')
    .reduce((sum, e) => sum + Number(e.baseSalaryUSD), 0);
  const totalAdvancesUSD = advances
    .filter((a) => a.status === 'PAID_OUT')
    .reduce((sum, a) => sum + Number(a.amountUSD), 0);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        term === '' ||
        e.firstName.toLowerCase().includes(term) ||
        e.lastName.toLowerCase().includes(term) ||
        e.idDocNumber.includes(term) ||
        e.position?.name.toLowerCase().includes(term);

      const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
      const matchPos = selectedPositionFilter === 'ALL' || e.positionId === selectedPositionFilter;

      return matchSearch && matchStatus && matchPos;
    });
  }, [employees, searchTerm, statusFilter, selectedPositionFilter]);

  // Handle Employee Submit
  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empIdDocNumber.trim() || !empFirstName.trim() || !empLastName.trim() || !empPositionId) {
      setFormError('Complete todos los campos obligatorios');
      return;
    }

    setFormError(null);
    createEmployeeMutation.mutate(
      {
        idDocType: empIdDocType,
        idDocNumber: empIdDocNumber.trim(),
        firstName: empFirstName.trim(),
        lastName: empLastName.trim(),
        phone: empPhone.trim() || undefined,
        email: empEmail.trim() || undefined,
        positionId: empPositionId,
        salaryCurrency: empSalaryCurrency,
        baseSalaryUSD: empSalaryCurrency === 'USD' ? Number(empBaseSalary) : Number(empBaseSalaryVES) / bcvUsd,
        baseSalaryVES: empSalaryCurrency === 'VES' ? Number(empBaseSalaryVES) : Number(empBaseSalary) * bcvUsd,
        paymentFrequency: empFrequency,
        paymentMethod: empPaymentMethod,
        bankName: empBankName.trim() || undefined,
        bankAccount: empBankAccount.trim() || undefined,
        pagoMovilPhone: empPagoMovilPhone.trim() || undefined,
        pagoMovilRif: empPagoMovilRif.trim() || undefined,
        createPosAccount: empCreatePosAccount,
        posEmail: empPosEmail.trim() || undefined,
        posPassword: empPosPassword || undefined,
        posRole: empPosRole,
      },
      {
        onSuccess: () => {
          setIsEmployeeModalOpen(false);
          setSyncNotice('Empleado registrado exitosamente');
          setTimeout(() => setSyncNotice(null), 4000);
          resetEmployeeForm();
        },
        onError: (err: any) => {
          setFormError(err.message || 'Error al registrar empleado');
        },
      },
    );
  };

  const resetEmployeeForm = () => {
    setEmpIdDocNumber('');
    setEmpFirstName('');
    setEmpLastName('');
    setEmpPhone('');
    setEmpEmail('');
    setEmpBaseSalary(200);
    setEmpCreatePosAccount(false);
    setEmpPosEmail('');
    setEmpPosPassword('123456');
  };

  // Handle Position Submit
  const handlePositionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!posName.trim()) return;

    setFormError(null);
    createPositionMutation.mutate(
      {
        name: posName.trim(),
        department: posDepartment.trim(),
        requiresUserAccount: posRequiresAccount,
        defaultSalaryUSD: Number(posDefaultSalary),
      },
      {
        onSuccess: () => {
          setIsPositionModalOpen(false);
          setPosName('');
          setSyncNotice('Puesto de trabajo creado');
          setTimeout(() => setSyncNotice(null), 4000);
        },
        onError: (err: any) => setFormError(err.message),
      },
    );
  };

  // Handle Incident Submit
  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incEmployeeId || !incNotes.trim()) return;

    setFormError(null);
    createIncidentMutation.mutate(
      {
        employeeId: incEmployeeId,
        type: incType,
        amountUSD: Number(incAmountUSD),
        notes: incNotes.trim(),
      },
      {
        onSuccess: () => {
          setIsIncidentModalOpen(false);
          setIncNotes('');
          setIncAmountUSD(0);
          setSyncNotice('Incidencia registrada en el expediente');
          setTimeout(() => setSyncNotice(null), 4000);
        },
        onError: (err: any) => setFormError(err.message),
      },
    );
  };

  // Handle Advance Submit
  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advEmployeeId || !advAmountUSD) return;

    setFormError(null);
    createAdvanceMutation.mutate(
      {
        employeeId: advEmployeeId,
        amountUSD: Number(advAmountUSD),
        exchangeRate: bcvUsd,
        reason: advReason.trim(),
      },
      {
        onSuccess: () => {
          setIsAdvanceModalOpen(false);
          setAdvReason('');
          setAdvAmountUSD(20);
          setSyncNotice('Adelanto / Vale registrado exitosamente');
          setTimeout(() => setSyncNotice(null), 4000);
        },
        onError: (err: any) => setFormError(err.message),
      },
    );
  };

  // Handle Create POS Account
  const handleCreatePosAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForPos || !posAccEmail.trim()) return;

    setFormError(null);
    createPosAccountMutation.mutate(
      {
        employeeId: selectedEmployeeForPos.id,
        payload: {
          email: posAccEmail.trim(),
          password: posAccPassword,
          role: posAccRole,
        },
      },
      {
        onSuccess: () => {
          setIsPosAccountModalOpen(false);
          setSelectedEmployeeForPos(null);
          setSyncNotice('Cuenta de acceso al POS vinculada exitosamente');
          setTimeout(() => setSyncNotice(null), 4000);
        },
        onError: (err: any) => setFormError(err.message),
      },
    );
  };

  // Handle Process Payroll
  const handleProcessPayroll = () => {
    if (payrollPreview.length === 0) return;

    processPayrollMutation.mutate(
      {
        frequency: payrollFrequency,
        exchangeRate: bcvUsd,
      },
      {
        onSuccess: () => {
          setSyncNotice('Nómina procesada y recibos generados');
          setTimeout(() => setSyncNotice(null), 5000);
        },
        onError: (err: any) => setFormError(err.message),
      },
    );
  };

  const handleSidebarAction = (action: SidebarAction) => {
    if (action === 'catalog') router.push('/adminnegocio');
    else if (action === 'openInventory' || action === 'openStockModal') router.push('/adminnegocio/inventario');
    else if (action === 'openNewProduct') router.push('/adminnegocio/productos/nuevo');
    else if (action === 'openPurchaseModal') router.push('/adminnegocio/compras/nueva');
    else if (action === 'openProfitLoss') router.push('/adminnegocio/rentabilidad');
    else if (action === 'openHrPayroll') setActiveTab('employees');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <Sidebar onAction={handleSidebarAction} activeItem="catalog" bcvUsd={bcvUsd} />

        {/* MAIN HR & PAYROLL HUB */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <Users className="w-3.5 h-3.5" />
                <span>Gestión de Talento & Nómina Integral</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Recursos Humanos, Cargos, Acceso POS & Nómina
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                Control de empleados, vinculación de cajeros al POS, registro de faltas, vales y liquidación bi-moneda ($ USD y Bs VES).
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => {
                  if (positions.length > 0) setEmpPositionId(positions[0].id);
                  setIsEmployeeModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Contratar / Nuevo Empleado</span>
              </button>

              <button
                onClick={() => {
                  if (employees.length > 0) setAdvEmployeeId(employees[0].id);
                  setIsAdvanceModalOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Wallet className="w-4 h-4" />
                <span>Emitir Adelanto / Vale</span>
              </button>

              <button
                onClick={() => {
                  if (employees.length > 0) setIncEmployeeId(employees[0].id);
                  setIsIncidentModalOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Registrar Falta / Infracción</span>
              </button>
            </div>
          </div>

          {syncNotice && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Personal Activo</span>
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {activeEmployeesCount} Trabajadores
              </span>
              <p className="text-xs text-slate-400 font-medium">{totalEmployeesCount} Registrados en total</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Masa Salarial Mensual</span>
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                ${totalMonthlyPayrollUSD.toFixed(2)} USD
              </span>
              <p className="text-xs text-slate-400 font-mono">
                ≈ {(totalMonthlyPayrollUSD * bcvUsd).toLocaleString('es-VE')} VES (BCV {bcvUsd.toFixed(2)})
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Adelantos & Vales a Descontar</span>
                <Wallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                ${totalAdvancesUSD.toFixed(2)} USD
              </span>
              <p className="text-xs text-slate-400 font-medium">{advances.filter((a) => a.status === 'PAID_OUT').length} vales entregados</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Cargos & Puestos</span>
                <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {positions.length} Puestos
              </span>
              <p className="text-xs text-slate-400 font-medium">
                {positions.filter((p) => p.requiresUserAccount).length} con acceso POS
              </p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Empleados & Credenciales POS ({filteredEmployees.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'payroll'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Liquidación & Recibos de Nómina</span>
            </button>

            <button
              onClick={() => setActiveTab('advances')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'advances'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Adelantos de Sueldo & Vales ({advances.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'incidents'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Faltas & Infracciones ({incidents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('positions')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'positions'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Puestos & Cargos ({positions.length})</span>
            </button>
          </div>

          {/* TAB 1: EMPLEADOS & CREDENCIALES POS */}
          {activeTab === 'employees' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Directorio de Trabajadores</h3>
                  <p className="text-xs text-slate-500">Expediente del personal, salarios base y credenciales de acceso al POS</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por cédula, nombre, cargo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Position filter */}
                  <select
                    value={selectedPositionFilter}
                    onChange={(e) => setSelectedPositionFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="ALL">Todos los Cargos</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none font-semibold"
                  >
                    <option value="ALL">Todos los Estados</option>
                    <option value="ACTIVE">🟢 Activos</option>
                    <option value="SUSPENDED">⏸️ Suspendidos</option>
                    <option value="TERMINATED">❌ Egresados</option>
                  </select>
                </div>
              </div>

              {isLoadingEmployees ? (
                <div className="py-16 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Cargando directorio de empleados...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">No se encontraron empleados registrados.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Cédula / ID</th>
                        <th className="p-3.5">Empleado</th>
                        <th className="p-3.5">Cargo & Departamento</th>
                        <th className="p-3.5">Sueldo Base ($ / Frecuencia)</th>
                        <th className="p-3.5">Pago Móvil / Banco</th>
                        <th className="p-3.5">Acceso POS / Sistema</th>
                        <th className="p-3.5">Estado</th>
                        <th className="p-3.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                            {emp.idDocType}-{emp.idDocNumber}
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {emp.phone || emp.email || 'Sin contacto'}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-semibold text-blue-600 dark:text-blue-400 block">
                              {emp.position?.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {emp.position?.department || 'General'}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                              ${Number(emp.baseSalaryUSD).toFixed(2)} USD
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {emp.paymentFrequency}
                            </span>
                          </td>

                          <td className="p-3.5 text-[11px]">
                            {emp.pagoMovilPhone ? (
                              <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold block">
                                📱 {emp.pagoMovilPhone}
                              </span>
                            ) : emp.bankName ? (
                              <span className="text-slate-500 block">{emp.bankName}</span>
                            ) : (
                              <span className="text-slate-400">Efectivo ($ USD)</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {emp.user ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                <KeyRound className="w-3 h-3 text-emerald-600" />
                                <span>{emp.user.email} ({emp.user.role})</span>
                              </div>
                            ) : emp.position?.requiresUserAccount ? (
                              <button
                                onClick={() => {
                                  setSelectedEmployeeForPos(emp);
                                  setPosAccEmail(`${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@empresa.com`);
                                  setIsPosAccountModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold hover:bg-amber-100 flex items-center gap-1"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span>Crear Clave POS</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No requerida</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {emp.status === 'ACTIVE' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                                Activo
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-800">
                                Inactivo
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setAdvEmployeeId(emp.id);
                                  setIsAdvanceModalOpen(true);
                                }}
                                title="Emitir Adelanto / Vale"
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 hover:text-purple-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                              >
                                Vale
                              </button>

                              <button
                                onClick={() => {
                                  setIncEmployeeId(emp.id);
                                  setIsIncidentModalOpen(true);
                                }}
                                title="Registrar Falta o Infracción"
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 hover:text-amber-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                              >
                                Falta
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIQUIDACIÓN & RECIBOS DE NÓMINA */}
          {activeTab === 'payroll' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Cálculo & Liquidación de Nómina</h3>
                  <p className="text-xs text-slate-500">
                    Deducción automática de vales y faltas con cálculo bi-moneda ($ USD y Bs VES al cambio BCV)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className="text-slate-500">Frecuencia:</span>
                    <select
                      value={payrollFrequency}
                      onChange={(e) => setPayrollFrequency(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="SEMANAL">Nómina Semanal</option>
                      <option value="QUINCENAL">Nómina Quincenal</option>
                      <option value="MENSUAL">Nómina Mensual</option>
                    </select>
                  </div>

                  <button
                    onClick={handleProcessPayroll}
                    disabled={processPayrollMutation.isPending || payrollPreview.length === 0}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>{processPayrollMutation.isPending ? 'Procesando...' : 'Liquidar & Generar Recibos'}</span>
                  </button>
                </div>
              </div>

              {/* Payroll Preview Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Pre-Liquidación del Periodo ({payrollPreview.length} Empleados)
                </h4>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Cédula & Empleado</th>
                        <th className="p-3.5">Cargo</th>
                        <th className="p-3.5">Sueldo Base Periodo ($)</th>
                        <th className="p-3.5">Bonos ($)</th>
                        <th className="p-3.5">Faltas / Sanciones ($)</th>
                        <th className="p-3.5">Vales / Adelantos ($)</th>
                        <th className="p-3.5">Neto a Pagar ($ USD)</th>
                        <th className="p-3.5 text-right">Neto a Pagar (VES BCV)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {payrollPreview.map((c) => (
                        <tr key={c.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 dark:text-white block">{c.employeeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{c.idDoc}</span>
                          </td>

                          <td className="p-3.5 font-semibold text-blue-600 dark:text-blue-400">{c.position}</td>

                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                            ${c.basePeriodSalaryUSD.toFixed(2)}
                          </td>

                          <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400">
                            {c.bonusUSD > 0 ? `+$${c.bonusUSD.toFixed(2)}` : '$0.00'}
                          </td>

                          <td className="p-3.5 font-mono text-rose-600 dark:text-rose-400">
                            {c.deductionsUSD > 0 ? `-$${c.deductionsUSD.toFixed(2)}` : '$0.00'}
                          </td>

                          <td className="p-3.5 font-mono text-purple-600 dark:text-purple-400 font-bold">
                            {c.advancesUSD > 0 ? `-$${c.advancesUSD.toFixed(2)}` : '$0.00'}
                          </td>

                          <td className="p-3.5 font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            ${c.netSalaryUSD.toFixed(2)} USD
                          </td>

                          <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 text-right">
                            {c.netSalaryVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Processed Periods History */}
              {payrollPeriods.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Historial de Periodos Liquidados
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payrollPeriods.map((period) => (
                      <div key={period.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{period.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            PAGADA
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                          <span>Total Liquidado: <strong className="text-emerald-600 dark:text-emerald-400">${Number(period.totalNetUSD).toFixed(2)} USD</strong></span>
                          <span>Tasa BCV: {Number(period.exchangeRate).toFixed(2)} Bs</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span>{period.receipts?.length || 0} Recibos emitidos</span>
                          <span className="font-mono">{new Date(period.createdAt).toLocaleDateString('es-VE')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADELANTOS DE SUELDO & VALES */}
          {activeTab === 'advances' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Bitácora de Adelantos de Sueldo & Vales</h3>
                  <p className="text-xs text-slate-500">Préstamos y entregas a cuenta que se descontarán automáticamente al liquidar nómina</p>
                </div>

                <button
                  onClick={() => {
                    if (employees.length > 0) setAdvEmployeeId(employees[0].id);
                    setIsAdvanceModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Vale de Sueldo</span>
                </button>
              </div>

              {advances.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">No hay adelantos de sueldo registrados.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">N° Vale / Fecha</th>
                        <th className="p-3.5">Empleado</th>
                        <th className="p-3.5">Monto ($ USD)</th>
                        <th className="p-3.5">Monto (VES BCV)</th>
                        <th className="p-3.5">Tasa BCV</th>
                        <th className="p-3.5">Motivo / Concepto</th>
                        <th className="p-3.5">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {advances.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-slate-900 dark:text-white block">{a.receiptNumber || 'VALE-00'}</span>
                            <span className="text-[10px] text-slate-400">{new Date(a.date).toLocaleDateString('es-VE')}</span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : 'Empleado'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {a.employee?.idDocType}-{a.employee?.idDocNumber}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono font-extrabold text-purple-600 dark:text-purple-400 text-sm">
                            ${Number(a.amountUSD).toFixed(2)} USD
                          </td>

                          <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {Number(a.amountVES).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                          </td>

                          <td className="p-3.5 font-mono text-slate-500">{Number(a.exchangeRate).toFixed(2)} Bs</td>

                          <td className="p-3.5 text-slate-600 dark:text-slate-300">{a.reason || 'Adelanto quincenal'}</td>

                          <td className="p-3.5">
                            {a.status === 'PAID_OUT' ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                                Pendiente por Descontar
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                                Deducido en Nómina
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ASISTENCIAS, FALTAS & INFRACCIONES */}
          {activeTab === 'incidents' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Expediente Disciplinario & Asistencia</h3>
                  <p className="text-xs text-slate-500">Registro de faltas, reposos médicos, retrasos y sanciones disciplinarias</p>
                </div>

                <button
                  onClick={() => {
                    if (employees.length > 0) setIncEmployeeId(employees[0].id);
                    setIsIncidentModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Incidencia</span>
                </button>
              </div>

              {incidents.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">No hay incidencias disciplinarias registradas.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Fecha</th>
                        <th className="p-3.5">Empleado</th>
                        <th className="p-3.5">Tipo de Incidencia</th>
                        <th className="p-3.5">Monto Sanción ($)</th>
                        <th className="p-3.5">Deducción en Nómina</th>
                        <th className="p-3.5">Detalle / Justificación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {incidents.map((inc) => (
                        <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 font-mono text-slate-500">
                            {new Date(inc.date).toLocaleDateString('es-VE')}
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {inc.employee ? `${inc.employee.firstName} ${inc.employee.lastName}` : 'Empleado'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {inc.employee?.idDocType}-{inc.employee?.idDocNumber}
                            </span>
                          </td>

                          <td className="p-3.5">
                            {inc.type === 'FALTA_INJUSTIFICADA' && (
                              <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200">
                                FALTA INJUSTIFICADA
                              </span>
                            )}
                            {inc.type === 'INFRACCION_DISCIPLINARIA' && (
                              <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-200">
                                SANCIÓN DISCIPLINARIA
                              </span>
                            )}
                            {inc.type === 'FALTA_JUSTIFICADA' && (
                              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-200">
                                REPOSO MÉDICO
                              </span>
                            )}
                            {inc.type === 'RETRASO' && (
                              <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-[10px] border border-purple-200">
                                LLEGADA TARDÍA
                              </span>
                            )}
                            {inc.type === 'BONO_MERITO' && (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200">
                                BONO POR MÉRITO
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 font-mono font-bold">
                            {Number(inc.amountUSD) > 0 ? `$${Number(inc.amountUSD).toFixed(2)}` : 'Día de Sueldo'}
                          </td>

                          <td className="p-3.5">
                            {inc.deductFromPayroll ? (
                              <span className="text-rose-600 font-bold text-[11px]">Sí, descuenta</span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Sin descuento</span>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-600 dark:text-slate-300">{inc.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CARGOS & PUESTOS */}
          {activeTab === 'positions' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Puestos de Trabajo & Estructura Organizativa</h3>
                  <p className="text-xs text-slate-500">Cargos personalizados por la empresa con salarios de referencia y requisitos de acceso POS</p>
                </div>

                <button
                  onClick={() => setIsPositionModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Puesto / Cargo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {positions.map((pos) => (
                  <div key={pos.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{pos.name}</span>
                      {pos.requiresUserAccount ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold">
                          Requiere POS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                          Operativo
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-500">
                      <p>Departamento: <strong className="text-slate-700 dark:text-slate-300">{pos.department || 'General'}</strong></p>
                      <p>Sueldo Referencial: <strong className="font-mono text-emerald-600 dark:text-emerald-400">${Number(pos.defaultSalaryUSD).toFixed(2)} USD</strong></p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px] text-slate-400">
                      <span>{pos._count?.employees || 0} Empleados en este cargo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 1: NUEVO EMPLEADO & VINCULACIÓN POS */}
          {/* ======================================================== */}
          {isEmployeeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl relative my-8 text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-base">Registrar Nuevo Empleado</h3>
                  </div>
                  <button onClick={() => setIsEmployeeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleEmployeeSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block font-semibold mb-1">Nacionalidad / Tipo</label>
                      <select
                        value={empIdDocType}
                        onChange={(e) => setEmpIdDocType(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-bold"
                      >
                        <option value="V">V - Venezolano</option>
                        <option value="E">E - Extranjero</option>
                        <option value="P">P - Pasaporte</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block font-semibold mb-1">Cédula de Identidad *</label>
                      <input
                        type="text"
                        required
                        placeholder="28123456"
                        value={empIdDocNumber}
                        onChange={(e) => setEmpIdDocNumber(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Nombres *</label>
                      <input
                        type="text"
                        required
                        placeholder="María Elena"
                        value={empFirstName}
                        onChange={(e) => setEmpFirstName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Apellidos *</label>
                      <input
                        type="text"
                        required
                        placeholder="González Pérez"
                        value={empLastName}
                        onChange={(e) => setEmpLastName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold">Moneda del Sueldo Base *</label>
                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setEmpSalaryCurrency('USD');
                            if (typeof empBaseSalary === 'number') {
                              setEmpBaseSalaryVES(parseFloat((empBaseSalary * bcvUsd).toFixed(2)));
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            empSalaryCurrency === 'USD' ? 'bg-emerald-600 text-white' : 'text-slate-500'
                          }`}
                        >
                          💵 USD ($)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmpSalaryCurrency('VES');
                            if (typeof empBaseSalaryVES === 'number') {
                              setEmpBaseSalary(parseFloat((empBaseSalaryVES / bcvUsd).toFixed(2)));
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            empSalaryCurrency === 'VES' ? 'bg-blue-600 text-white' : 'text-slate-500'
                          }`}
                        >
                          🇻🇪 VES (Bs)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Cargo / Puesto *</label>
                        <select
                          value={empPositionId}
                          onChange={(e) => {
                            setEmpPositionId(e.target.value);
                            const pos = positions.find((p) => p.id === e.target.value);
                            if (pos) {
                              setEmpBaseSalary(Number(pos.defaultSalaryUSD));
                              setEmpBaseSalaryVES(parseFloat((Number(pos.defaultSalaryUSD) * bcvUsd).toFixed(2)));
                              if (pos.requiresUserAccount) setEmpCreatePosAccount(true);
                            }
                          }}
                          required
                          className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-bold"
                        >
                          {positions.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.department})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1">
                          {empSalaryCurrency === 'USD' ? 'Sueldo Base ($ USD) *' : 'Sueldo Base (Bs VES) *'}
                        </label>
                        {empSalaryCurrency === 'USD' ? (
                          <div className="space-y-1">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              required
                              value={empBaseSalary}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                setEmpBaseSalary(val);
                                if (typeof val === 'number') {
                                  setEmpBaseSalaryVES(parseFloat((val * bcvUsd).toFixed(2)));
                                }
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-mono font-bold text-emerald-600"
                            />
                            <div className="text-[10px] text-slate-400 font-mono">
                              ≈ {((typeof empBaseSalary === 'number' ? empBaseSalary : 0) * bcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs VES
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={empBaseSalaryVES}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                setEmpBaseSalaryVES(val);
                                if (typeof val === 'number') {
                                  setEmpBaseSalary(parseFloat((val / bcvUsd).toFixed(2)));
                                }
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-mono font-bold text-blue-600"
                            />
                            <div className="text-[10px] text-slate-400 font-mono">
                              ≈ ${((typeof empBaseSalaryVES === 'number' ? empBaseSalaryVES : 0) / bcvUsd).toFixed(2)} USD
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Frecuencia de Pago</label>
                      <select
                        value={empFrequency}
                        onChange={(e) => setEmpFrequency(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2"
                      >
                        <option value="SEMANAL">Semanal</option>
                        <option value="QUINCENAL">Quincenal</option>
                        <option value="MENSUAL">Mensual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Teléfono</label>
                      <input
                        type="text"
                        placeholder="0412-0000000"
                        value={empPhone}
                        onChange={(e) => setEmpPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-mono"
                      />
                    </div>
                  </div>

                  {/* Pago Móvil */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border space-y-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Datos de Pago Móvil / Banco</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Teléfono Pago Móvil"
                        value={empPagoMovilPhone}
                        onChange={(e) => setEmpPagoMovilPhone(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border rounded-lg p-1.5 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Banco (Ej: Banesco, BDV)"
                        value={empBankName}
                        onChange={(e) => setEmpBankName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border rounded-lg p-1.5"
                      />
                    </div>
                  </div>

                  {/* Switch para cuenta de acceso POS */}
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-900 dark:text-blue-300">
                      <input
                        type="checkbox"
                        checked={empCreatePosAccount}
                        onChange={(e) => {
                          setEmpCreatePosAccount(e.target.checked);
                          if (e.target.checked && !empPosEmail) {
                            setEmpPosEmail(`${empFirstName.toLowerCase() || 'cajero'}@empresa.com`);
                          }
                        }}
                        className="rounded text-blue-600 w-4 h-4"
                      />
                      <span>¿Crear Cuenta de Acceso para Punto de Venta (POS) / Supervisor?</span>
                    </label>

                    {empCreatePosAccount && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                        <div>
                          <label className="block text-[10px] font-semibold mb-1">Correo de Acceso POS</label>
                          <input
                            type="email"
                            required={empCreatePosAccount}
                            placeholder="cajero1@empresa.com"
                            value={empPosEmail}
                            onChange={(e) => setEmpPosEmail(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border rounded-lg p-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold mb-1">Contraseña / PIN</label>
                          <input
                            type="password"
                            required={empCreatePosAccount}
                            value={empPosPassword}
                            onChange={(e) => setEmpPosPassword(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border rounded-lg p-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold mb-1">Rol en Sistema</label>
                          <select
                            value={empPosRole}
                            onChange={(e) => setEmpPosRole(e.target.value as any)}
                            className="w-full bg-white dark:bg-slate-900 border rounded-lg p-1.5 font-bold"
                          >
                            <option value="CASHIER">Cajero (POS)</option>
                            <option value="SUPERVISOR">Supervisor</option>
                            <option value="STORE_ADMIN">Administrador</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setIsEmployeeModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createEmployeeMutation.isPending}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      {createEmployeeMutation.isPending ? 'Guardando...' : 'Contratar Empleado'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 2: NUEVO PUESTO DE TRABAJO */}
          {/* ======================================================== */}
          {isPositionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2 font-bold text-base">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <span>Crear Puesto de Trabajo</span>
                  </div>
                  <button onClick={() => setIsPositionModalOpen(false)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handlePositionSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Nombre del Cargo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Charcutero(a) Especialista"
                      value={posName}
                      onChange={(e) => setPosName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Departamento</label>
                    <select
                      value={posDepartment}
                      onChange={(e) => setPosDepartment(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2"
                    >
                      <option value="Ventas / Caja">Ventas / Caja</option>
                      <option value="Charcutería">Charcutería</option>
                      <option value="Carnicería">Carnicería</option>
                      <option value="Almacén & Reposición">Almacén & Reposición</option>
                      <option value="Administración">Administración</option>
                      <option value="Seguridad">Seguridad</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Sueldo Referencial ($ USD)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={posDefaultSalary}
                      onChange={(e) => setPosDefaultSalary(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-mono font-bold text-emerald-600"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1 font-semibold">
                    <input
                      type="checkbox"
                      checked={posRequiresAccount}
                      onChange={(e) => setPosRequiresAccount(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>¿Este cargo requiere acceso a caja POS / Sistema?</span>
                  </label>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setIsPositionModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold">
                      Guardar Puesto
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 3: REGISTRAR FALTA / INFRACCIÓN */}
          {/* ======================================================== */}
          {isIncidentModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2 font-bold text-base">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>Registrar Incidencia / Falta</span>
                  </div>
                  <button onClick={() => setIsIncidentModalOpen(false)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleIncidentSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Empleado *</label>
                    <select
                      value={incEmployeeId}
                      onChange={(e) => setIncEmployeeId(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-semibold"
                    >
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} ({e.idDocType}-{e.idDocNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Tipo de Incidencia</label>
                    <select
                      value={incType}
                      onChange={(e) => setIncType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-bold"
                    >
                      {INCIDENT_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Monto de Sanción / Descuento ($ USD, 0 = 1 Día de Sueldo)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={incAmountUSD}
                      onChange={(e) => setIncAmountUSD(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Motivo / Justificación *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Describa la causa de la falta o sanción..."
                      value={incNotes}
                      onChange={(e) => setIncNotes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setIsIncidentModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold">
                      Registrar en Expediente
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 4: EMITIR ADELANTO / VALE */}
          {/* ======================================================== */}
          {isAdvanceModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2 font-bold text-base">
                    <Wallet className="w-5 h-5 text-purple-600" />
                    <span>Emitir Adelanto de Sueldo / Vale</span>
                  </div>
                  <button onClick={() => setIsAdvanceModalOpen(false)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAdvanceSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Empleado Beneficiario *</label>
                    <select
                      value={advEmployeeId}
                      onChange={(e) => setAdvEmployeeId(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-semibold"
                    >
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} ({e.idDocType}-{e.idDocNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Monto en Dólares ($ USD) *</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        required
                        value={advAmountUSD}
                        onChange={(e) => setAdvAmountUSD(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-mono font-bold text-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Equivalente VES (BCV)</label>
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-bold text-blue-600">
                        {((typeof advAmountUSD === 'number' ? advAmountUSD : 0) * bcvUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Motivo del Vale (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Emergencia médica, adelanto de quincena..."
                      value={advReason}
                      onChange={(e) => setAdvReason(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setIsAdvanceModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold">
                      Emitir y Entregar Vale
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 5: VINCULAR CUENTA POS A EMPLEADO */}
          {/* ======================================================== */}
          {isPosAccountModalOpen && selectedEmployeeForPos && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2 font-bold text-base">
                    <KeyRound className="w-5 h-5 text-emerald-600" />
                    <span>Crear Credencial de Acceso POS</span>
                  </div>
                  <button onClick={() => setIsPosAccountModalOpen(false)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Asignar credenciales a <strong>{selectedEmployeeForPos.firstName} {selectedEmployeeForPos.lastName}</strong> para iniciar sesión en el Punto de Venta.
                </p>

                <form onSubmit={handleCreatePosAccount} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Correo Electrónico de Login *</label>
                    <input
                      type="email"
                      required
                      value={posAccEmail}
                      onChange={(e) => setPosAccEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Contraseña / Clave de Acceso *</label>
                    <input
                      type="password"
                      required
                      value={posAccPassword}
                      onChange={(e) => setPosAccPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Rol de Acceso</label>
                    <select
                      value={posAccRole}
                      onChange={(e) => setPosAccRole(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2 font-bold"
                    >
                      <option value="CASHIER">Cajero (Punto de Venta POS)</option>
                      <option value="SUPERVISOR">Supervisor de Tienda</option>
                      <option value="STORE_ADMIN">Administrador</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setIsPosAccountModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold">
                      Vincular Cuenta
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function HrPayrollPage() {
  return (
    <RoleGuard allowedRoles={['STORE_ADMIN', 'SUPER_ADMIN']}>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Cargando módulo de RRHH y Nómina...</div>}>
        <HrPayrollPageContent />
      </Suspense>
    </RoleGuard>
  );
}
