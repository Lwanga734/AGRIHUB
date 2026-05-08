import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppDispatch } from './store/hooks';
import { restoreSession } from './features/auth/authSlice';
import { ProtectedRoute } from './components/ProtectedRoute';
import MainLayout       from './layouts/MainLayout';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DashboardPage    from './pages/DashboardPage';
import ProducePage      from './pages/ProducePage';
import PricePage        from './pages/PricePage';
import TransactionsPage from './pages/TransactionsPage';
import AnalyticsPage    from './pages/AnalyticsPage';
import ReportsPage      from './pages/ReportsPage';
import UsersPage        from './pages/UsersPage';
import ProfilePage      from './pages/ProfilePage';

function SessionRestorer() {
  const dispatch = useAppDispatch();
  useEffect(() => { dispatch(restoreSession()); }, [dispatch]);
  return null;
}

function AppRoutes() {
  return (
    <>
      <SessionRestorer />
      <Routes>
        {/* Public */}
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/register"     element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected — all authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/produce"      element={<ProducePage />} />
            <Route path="/prices"       element={<PricePage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/analytics"    element={<AnalyticsPage />} />
            <Route path="/quality"      element={<ProducePage />} />
            <Route path="/profile"      element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Officials + Admins */}
        <Route element={<ProtectedRoute allowedRoles={['official', 'admin']} />}>
          <Route element={<MainLayout />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<MainLayout />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>

        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
