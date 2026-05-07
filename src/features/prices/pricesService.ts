import axios from 'axios';
import type { Price, PriceFormData } from './prices.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost/agrihub';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrihub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const pricesService = {
  async getAll(): Promise<Price[]> {
    const { data } = await api.get('/prices/index.php');
    return data.prices ?? [];
  },

  async create(payload: PriceFormData): Promise<Price> {
    const { data } = await api.post('/prices/create.php', payload);
    return data.price;
  },

  async delete(id: number): Promise<void> {
    await api.post('/prices/delete.php', { id });
  },
};
