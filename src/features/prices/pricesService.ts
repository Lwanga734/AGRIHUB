import { api } from '../../lib/api';
import type { Price, PriceFormData } from './prices.types';

export const pricesService = {
  async getAll(): Promise<Price[]> {
    const { data } = await api.get('/prices');
    return data.prices ?? [];
  },

  async create(payload: PriceFormData): Promise<Price> {
    const { data } = await api.post('/prices/create', payload);
    return data.price;
  },

  async delete(id: number): Promise<void> {
    await api.post('/prices/delete', { id });
  },
};
