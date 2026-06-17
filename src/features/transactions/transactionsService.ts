import { api } from '../../lib/api';
import type { Transaction, TransactionFormData } from './transactions.types';

export const transactionsService = {
  async getAll(): Promise<Transaction[]> {
    const { data } = await api.get('/transactions');
    return data.transactions ?? [];
  },

  async create(payload: TransactionFormData): Promise<Transaction> {
    const { data } = await api.post('/transactions/create', payload);
    return data.transaction;
  },
};
