export interface Transaction {
  id: number;
  produce_id: number;
  commodity?: string;
  buyer_id: number;
  buyer_name?: string;
  seller_id: number;
  seller_name?: string;
  amount_ugx: number;
  quantity_kg: number;
  recorded_by: number;
  recorded_by_name?: string;
  created_at: string;
}

export interface TransactionFormData {
  produce_id: number;
  buyer_id: number;
  amount_ugx: number;
  quantity_kg: number;
}

export interface TransactionsState {
  items: Transaction[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;
}
