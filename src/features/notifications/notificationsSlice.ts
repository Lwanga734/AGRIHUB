import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationsService } from './notificationsService';
import type { NotificationsState } from './notifications.types';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try { return await notificationsService.getAll(); }
    catch (err: any) { return rejectWithValue(err.response?.data?.message ?? 'Failed'); }
  }
);

export const markRead = createAsyncThunk(
  'notifications/markRead',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      await notificationsService.markRead(id);
      dispatch(fetchNotifications());
    } catch (err: any) { return rejectWithValue('Failed to mark as read'); }
  }
);

export const markAllRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await notificationsService.markAllRead();
      dispatch(fetchNotifications());
    } catch (err: any) { return rejectWithValue('Failed'); }
  }
);

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending,   (state) => { state.isLoading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading   = false;
        state.items       = action.payload.notifications;
        state.unreadCount = action.payload.unread_count;
      })
      .addCase(fetchNotifications.rejected,  (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });
  },
});

export default notificationsSlice.reducer;
