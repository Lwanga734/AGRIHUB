import axios from 'axios';
import type { Transaction, TransactionFormData } from './transactions.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost/agrihub';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrihub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const transactionsService = {
  async getAll(): Promise<Transaction[]> {
    const { data } = await api.get('/transactions/index.php');
    return data.transactions ?? [];
  },

  async create(payload: TransactionFormData): Promise<Transaction> {
    const { data } = await api.post('/transactions/create.php', payload);
    return data.transaction;
  },
};
