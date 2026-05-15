import { api } from '../../lib/api';
import type { Produce, ProduceFormData } from './produce.types';

export const produceService = {
  async getAll(): Promise<Produce[]> {
    const { data } = await api.get('/produce/index.php');
    return data.produce ?? [];
  },

  async create(payload: ProduceFormData): Promise<Produce> {
    const { data } = await api.post('/produce/create.php', payload);
    return data.produce;
  },

  async verify(id: number, grade: string, notes?: string): Promise<void> {
    await api.post('/produce/verify.php', { produce_id: id, grade, notes });
  },
};
