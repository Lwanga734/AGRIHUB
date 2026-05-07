import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { pricesService } from './pricesService';
import type { PricesState, PriceFormData } from './prices.types';

export const fetchPrices = createAsyncThunk(
  'prices/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await pricesService.getAll(); }
    catch (err: any) { return rejectWithValue(err.response?.data?.message ?? 'Failed to load prices'); }
  }
);

export const createPrice = createAsyncThunk(
  'prices/create',
  async (payload: PriceFormData, { rejectWithValue }) => {
    try { return await pricesService.create(payload); }
    catch (err: any) { return rejectWithValue(err.response?.data?.message ?? 'Failed to log price'); }
  }
);

export const deletePrice = createAsyncThunk(
  'prices/delete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try { await pricesService.delete(id); dispatch(fetchPrices()); }
    catch (err: any) { return rejectWithValue(err.response?.data?.message ?? 'Failed to delete'); }
  }
);

const initialState: PricesState = {
  items: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,
};

const pricesSlice = createSlice({
  name: 'prices',
  initialState,
  reducers: {
    clearPricesMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrices.pending,    (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchPrices.fulfilled,  (state, action) => { state.isLoading = false; state.items = action.payload; })
      .addCase(fetchPrices.rejected,   (state, action) => { state.isLoading = false; state.error = action.payload as string; })

      .addCase(createPrice.pending,    (state) => { state.isSubmitting = true; state.error = null; state.successMessage = null; })
      .addCase(createPrice.fulfilled,  (state, action) => {
        state.isSubmitting = false;
        state.items.unshift(action.payload);
        state.successMessage = 'Price logged successfully!';
      })
      .addCase(createPrice.rejected,   (state, action) => { state.isSubmitting = false; state.error = action.payload as string; })

      .addCase(deletePrice.pending,    (state) => { state.isSubmitting = true; })
      .addCase(deletePrice.fulfilled,  (state) => { state.isSubmitting = false; })
      .addCase(deletePrice.rejected,   (state, action) => { state.isSubmitting = false; state.error = action.payload as string; });
  },
});

export const { clearPricesMessages } = pricesSlice.actions;
export default pricesSlice.reducer;
