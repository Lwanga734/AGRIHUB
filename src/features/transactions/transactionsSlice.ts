import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionsService } from './transactionsService';
import type { TransactionsState, TransactionFormData } from './transactions.types';

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await transactionsService.getAll(); }
    catch (err: any) { return rejectWithValue(err.response?.data?.message ?? 'Failed to load transactions'); }
  }
);

export const createTransaction = createAsyncThunk(
  'transactions/create',
  async (payload: TransactionFormData, { rejectWithValue }) => {
    try { return await transactionsService.create(payload); }
    catch (err: any) { return rejectWithValue(err.response?.data?.message ?? 'Failed to record transaction'); }
  }
);

const initialState: TransactionsState = {
  items: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,
};

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearTransactionMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchTransactions.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload; })
      .addCase(fetchTransactions.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload as string; })

      .addCase(createTransaction.pending,   (state) => { state.isSubmitting = true; state.error = null; state.successMessage = null; })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.items.unshift(action.payload);
        state.successMessage = 'Transaction recorded successfully!';
      })
      .addCase(createTransaction.rejected,  (state, action) => { state.isSubmitting = false; state.error = action.payload as string; });
  },
});

export const { clearTransactionMessages } = transactionsSlice.actions;
export default transactionsSlice.reducer;
