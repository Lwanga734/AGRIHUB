import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardService } from './dashboardService';
import type { DashboardData } from './dashboardService';

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: DashboardState = {
  data: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

export const fetchDashboard = createAsyncThunk(
  'dashboard/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await dashboardService.getStats();
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message ?? 'Failed to load dashboard'
      );
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.isLoading   = false;
        state.data        = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });
  },
});

export default dashboardSlice.reducer;