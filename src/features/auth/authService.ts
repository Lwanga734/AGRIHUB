import { api } from '../../lib/api';
import type { LoginCredentials, RegisterPayload, AuthResponse } from './auth.types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  async getMe(): Promise<AuthResponse['user']> {
    const { data } = await api.get<{ user: AuthResponse['user'] }>('/auth/me');
    return data.user;
  },

  logout() {
    localStorage.removeItem('agrihub_token');
  },
};
