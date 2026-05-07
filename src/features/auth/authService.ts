import axios from 'axios';
import type { LoginCredentials, RegisterPayload, AuthResponse } from './auth.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost/agrihub/api';

const api = axios.create({ baseURL: API_BASE });

// Attach JWT to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrihub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
    const { data } = await api.get('/auth/me.php');
    return data.user;
  },

  logout() {
    localStorage.removeItem('agrihub_token');
  },
};