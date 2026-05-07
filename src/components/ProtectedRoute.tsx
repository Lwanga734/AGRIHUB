import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import type { UserRole } from '../features/auth/auth.types';

interface ProtectedRouteProps {
  /** If provided, only these roles can access the route */
  allowedRoles?: UserRole[];
}

/**
 * Wraps any route that requires authentication.
 * Optionally restricts access to specific roles.
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 *   <Route element={<ProtectedRoute allowedRoles={['admin', 'official']} />}>
 *     <Route path="/reports" element={<Reports />} />
 *   </Route>
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-sm text-gray-500">Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination so we can redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}