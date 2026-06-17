import { api } from '../../lib/api';

export interface DashboardStats {
  produce_today: number;
  produce_volume_today: number;
  produce_change: number | null;
  avg_price_today: number;
  avg_price_change: number | null;
  transactions_today: number;
  transactions_value: number;
  transactions_change: number | null;
  active_traders: number;
  traders_change: number | null;
}

export interface ActivityItem {
  type: 'produce' | 'price' | 'transaction';
  detail: string;
  quantity_kg: number | null;
  amount: number | null;
  created_at: string;
  actor: string;
}

export interface CommodityPrice {
  commodity: string;
  price_ugx: number;
  unit: string;
}

export interface DashboardData {
  stats: DashboardStats;
  activity: ActivityItem[];
  commodity_prices: CommodityPrice[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardData> {
    const { data } = await api.get<DashboardData>('/dashboard/stats');
    return data;
  },
};
