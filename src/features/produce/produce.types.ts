export type QualityGrade = 'A' | 'B' | 'C' | 'ungraded';
export type ProduceStatus = 'pending' | 'verified' | 'sold';

export interface Produce {
  id: number;
  farmer_id: number;
  farmer_name?: string;
  commodity: string;
  quantity_kg: number;
  source_location: string;
  quality_grade: QualityGrade;
  status: ProduceStatus;
  notes?: string;
  created_at: string;
}

export interface ProduceFormData {
  commodity: string;
  quantity_kg: number;
  source_location: string;
  notes?: string;
}

export interface ProduceState {
  items: Produce[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;
}
