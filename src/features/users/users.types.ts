import type { UserRole } from '../auth/auth.types';

export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
  produce_count: number;
  tx_count: number;
}

export interface UsersState {
  items: ManagedUser[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}
