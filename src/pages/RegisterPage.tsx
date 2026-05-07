import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { registerUser, clearError } from '../features/auth/authSlice';
import { useAuth } from '../features/auth/useAuth';
import type { UserRole } from '../features/auth/auth.types';

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'farmer',   label: 'Farmer',          description: 'Register & sell produce' },
  { value: 'trader',   label: 'Trader / Buyer',   description: 'Buy produce, track prices' },
  { value: 'official', label: 'Market Official',  description: 'Verify quality, log prices' },
  { value: 'admin',    label: 'Admin (KCCA/MAAIF)', description: 'Full system access' },
];

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'farmer' as UserRole,
  });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setLocalError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    const { confirmPassword, ...payload } = form;
    dispatch(registerUser(payload));
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600 mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9l4.5 4.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12h10" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AgriHub</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Register</h2>

          {displayError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                name="name" type="text" required value={form.name}
                onChange={handleChange} placeholder="e.g. Nakazi Sarah"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                name="email" type="email" required value={form.email}
                onChange={handleChange} placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                name="phone" type="tel" value={form.phone}
                onChange={handleChange} placeholder="+256 7XX XXX XXX"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                    className={`text-left px-3 py-2.5 rounded-lg border text-sm transition
                      ${form.role === r.value
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <p className="font-medium">{r.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                name="password" type="password" required value={form.password}
                onChange={handleChange} placeholder="Min. 6 characters"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <input
                name="confirmPassword" type="password" required value={form.confirmPassword}
                onChange={handleChange} placeholder="Repeat your password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-green-600 text-white text-sm font-medium
                         hover:bg-green-700 active:scale-[0.98] transition disabled:opacity-60 mt-2"
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}