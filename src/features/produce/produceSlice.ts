import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { produceService } from './produceService';
import type { ProduceState, ProduceFormData } from './produce.types';

export const fetchProduce = createAsyncThunk(
  'produce/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await produceService.getAll();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Failed to load produce');
    }
  }
);

export const createProduce = createAsyncThunk(
  'produce/create',
  async (payload: ProduceFormData, { rejectWithValue }) => {
    try {
      return await produceService.create(payload);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Failed to register produce');
    }
  }
);

export const verifyProduce = createAsyncThunk(
  'produce/verify',
  async (
    { id, grade, notes }: { id: number; grade: string; notes: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      await produceService.verify(id, grade, notes);
      dispatch(fetchProduce());
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Verification failed');
    }
  }
);

const initialState: ProduceState = {
  items: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,
};

const produceSlice = createSlice({
  name: 'produce',
  initialState,
  reducers: {
    clearProduceMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProduce.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProduce.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload; })
      .addCase(fetchProduce.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })

      .addCase(createProduce.pending, (state) => { state.isSubmitting = true; state.error = null; state.successMessage = null; })
      .addCase(createProduce.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.items.unshift(action.payload);
        state.successMessage = 'Produce registered successfully!';
      })
      .addCase(createProduce.rejected, (state, action) => { state.isSubmitting = false; state.error = action.payload as string; })

      .addCase(verifyProduce.pending, (state) => { state.isSubmitting = true; })
      .addCase(verifyProduce.fulfilled, (state) => { state.isSubmitting = false; state.successMessage = 'Produce verified!'; })
      .addCase(verifyProduce.rejected, (state, action) => { state.isSubmitting = false; state.error = action.payload as string; });
  },
});

export const { clearProduceMessages } = produceSlice.actions;
export default produceSlice.reducer;
