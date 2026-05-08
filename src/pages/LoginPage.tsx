import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { loginUser, clearError } from '../features/auth/authSlice';
import { useAuth } from '../features/auth/useAuth';

export default function LoginPage() {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isAuthenticated, isLoading, error } = useAuth();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as any)?.from?.pathname ?? '/dashboard';
  useEffect(() => { if (isAuthenticated) navigate(from, { replace: true }); }, [isAuthenticated]);
  useEffect(() => { return () => { dispatch(clearError()); }; }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/agrihub_logo.png"
            alt="AgriHub"
            className="object-contain w-24 h-24 drop-shadow-sm"
          />
          {/* <h1 className="mt-2 text-2xl font-bold text-gray-900">AgriHub</h1> */}
          <p className="text-xs text-gray-400 tracking-widest uppercase mt-0.5">
            Connecting Farmers · Traders · Markets
          </p>
        </div>

        {/* Card */}
        <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Sign in to your account</h2>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 border border-red-100 rounded-lg bg-red-50">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-10"
                />
                <button
                  type="button" tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                >
                  {showPassword
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 active:scale-[0.98] transition disabled:opacity-60 mt-2"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-green-600 hover:underline">Register here</Link>
          </p>
        </div>

        <p className="mt-6 text-xs text-center text-gray-400">
          Kyambogo University · Department of Computer Science · 2026
        </p>
      </div>
    </div>
  );
}
