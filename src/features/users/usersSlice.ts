import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersService } from './usersService';
import type { UsersState, CreateUserPayload } from './users.types';
import type { UserRole } from '../auth/auth.types';

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await usersService.getAll(); }
    catch (err: any) { return rejectWithValue(err.response?.data?.message ?? 'Failed to load users'); }
  }
);

export const createUser = createAsyncThunk(
  'users/create',
  async (payload: CreateUserPayload, { rejectWithValue }) => {
    try { return await usersService.create(payload); }
    catch (err: any) { return rejectWithValue(err.response?.data?.message ?? 'Failed to create user'); }
  }
);

export const updateUserRole = createAsyncThunk(
  'users/updateRole',
  async ({ id, role }: { id: number; role: UserRole }, { rejectWithValue, dispatch }) => {
    try {
      await usersService.updateRole(id, role);
      dispatch(fetchUsers());
      return { id, role };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Failed to update role');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      await usersService.deleteUser(id);
      dispatch(fetchUsers());
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Failed to delete user');
    }
  }
);

const initialState: UsersState = {
  items: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsersMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending,    (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled,  (state, action) => { state.isLoading = false; state.items = action.payload; })
      .addCase(fetchUsers.rejected,   (state, action) => { state.isLoading = false; state.error = action.payload as string; })

      .addCase(createUser.pending,    (state) => { state.isSubmitting = true; state.error = null; state.successMessage = null; })
      .addCase(createUser.fulfilled,  (state, action) => {
        state.isSubmitting = false;
        state.items.unshift(action.payload);
        state.successMessage = `User "${action.payload.name}" created successfully!`;
      })
      .addCase(createUser.rejected,   (state, action) => { state.isSubmitting = false; state.error = action.payload as string; })

      .addCase(updateUserRole.pending,   (state) => { state.isSubmitting = true; })
      .addCase(updateUserRole.fulfilled, (state) => { state.isSubmitting = false; state.successMessage = 'Role updated!'; })
      .addCase(updateUserRole.rejected,  (state, action) => { state.isSubmitting = false; state.error = action.payload as string; })

      .addCase(deleteUser.pending,    (state) => { state.isSubmitting = true; })
      .addCase(deleteUser.fulfilled,  (state) => { state.isSubmitting = false; state.successMessage = 'User deleted.'; })
      .addCase(deleteUser.rejected,   (state, action) => { state.isSubmitting = false; state.error = action.payload as string; });
  },
});

export const { clearUsersMessages } = usersSlice.actions;
export default usersSlice.reducer;
