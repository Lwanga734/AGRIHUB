import { api } from '../../lib/api';
import type { LoginCredentials, RegisterPayload, AuthResponse } from './auth.types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login.php', credentials);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register.php', payload);
    return data;
  },

  async getMe(): Promise<AuthResponse['user']> {
    const { data } = await api.get<{ user: AuthResponse['user'] }>('/auth/me.php');
    return data.user;
  },

  logout() {
    localStorage.removeItem('agrihub_token');
  },
};
