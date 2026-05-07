export interface Price {
  id: number;
  commodity: string;
  price_ugx: number;
  unit: string;
  logged_by: number;
  logged_by_name?: string;
  created_at: string;
}

export interface PriceFormData {
  commodity: string;
  price_ugx: number;
  unit: string;
}

export interface PricesState {
  items: Price[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;
}
