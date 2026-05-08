import axios from 'axios';
import type { ManagedUser, CreateUserPayload } from './users.types';
import type { UserRole } from '../auth/auth.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost/agrihub';

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrihub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const usersService = {
  async getAll(): Promise<ManagedUser[]> {
    const { data } = await api.get('/users/index.php');
    return data.users ?? [];
  },

  async create(payload: CreateUserPayload): Promise<ManagedUser> {
    const { data } = await api.post('/users/create.php', payload);
    return data.user;
  },

  async updateRole(id: number, role: UserRole): Promise<void> {
    await api.post('/users/update_role.php', { id, role });
  },

  async deleteUser(id: number): Promise<void> {
    await api.post('/users/delete.php', { id });
  },
};
