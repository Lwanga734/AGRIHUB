import axios from 'axios';
import type { Produce, ProduceFormData } from './produce.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost/agrihub';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrihub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const produceService = {
  async getAll(): Promise<Produce[]> {
    const { data } = await api.get('/produce/index.php');
    return data.produce ?? [];
  },

  async create(payload: ProduceFormData): Promise<Produce> {
    const { data } = await api.post('/produce/create.php', payload);
    return data.produce;
  },

  async verify(id: number, grade: string, notes: string): Promise<void> {
    await api.post('/produce/verify.php', { produce_id: id, grade, notes });
  },
};
