import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import type { UserRole } from './auth.types';

// ── Selectors ────────────────────────────────────────────────────────────────

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectUserRole = (state: RootState) => state.auth.user?.role;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const hasRole = (...roles: UserRole[]) =>
    user ? roles.includes(user.role) : false;

  const isAdmin = hasRole('admin');
  const isOfficial = hasRole('official', 'admin');
  const isFarmer = hasRole('farmer');
  const isTrader = hasRole('trader');

  return { user, isAuthenticated, isLoading, error, hasRole, isAdmin, isOfficial, isFarmer, isTrader };
}