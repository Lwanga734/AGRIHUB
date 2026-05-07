import { configureStore } from '@reduxjs/toolkit';
import authReducer         from '../features/auth/authSlice';
import produceReducer      from '../features/produce/produceSlice';
import pricesReducer       from '../features/prices/pricesSlice';
import transactionsReducer from '../features/transactions/transactionsSlice';

export const store = configureStore({
  reducer: {
    auth:         authReducer,
    produce:      produceReducer,
    prices:       pricesReducer,
    transactions: transactionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
