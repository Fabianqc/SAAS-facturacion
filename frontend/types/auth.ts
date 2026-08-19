export type Role = 'SUPER_ADMIN' | 'STORE_ADMIN' | 'SUPERVISOR' | 'CASHIER';

export interface Store {
  id: string;
  name: string;
  invoicePrefix: string;
  controlPrefix: string;
}

export interface Tenant {
  id: string;
  name: string;
  rifType: string;
  rifNumber: string;
  plan: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  tenantId?: string | null;
  tenant?: Tenant | null;
  primaryStore?: Store | null;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
