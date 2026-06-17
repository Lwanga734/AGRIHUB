import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import type { RootState } from '../store/store';
import { useAuth } from '../features/auth/useAuth';
import { restoreSession } from '../features/auth/authSlice';
import { api } from '../lib/api';

const ROLE_STYLES: Record<string, string> = {
  farmer:   'bg-green-100 text-green-700',
  trader:   'bg-blue-100 text-blue-700',
  official: 'bg-amber-100 text-amber-700',
  admin:    'bg-red-100 text-red-700',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  farmer:   'Can register produce and view market prices',
  trader:   'Can buy produce and record transactions',
  official: 'Can verify produce quality and log prices',
  admin:    'Full system access and user management',
};

interface ProfileStats {
  produce_registered: number;
  produce_volume: number;
  purchases: number;
  purchase_value: number;
  sales: number;
  sales_value: number;
  prices_logged: number;
  member_since: string | null;
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError]     = useState('');

  // Password form
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [pwLoading, setPwLoading]   = useState(false);
  const [pwSuccess, setPwSuccess]   = useState('');
  const [pwError, setPwError]       = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Stats
  const [stats, setStats]       = useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Sync form when user loads
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, phone: user.phone ?? '' });
    }
  }, [user]);

  // Fetch activity stats
  useEffect(() => {
    api.get('/profile/stats')
      .then((res) => { if (res.data.success) setStats(res.data.stats); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const res = await api.post('/profile/update', profileForm);
      if (res.data.success) {
        setProfileSuccess(res.data.message);
        dispatch(restoreSession()); // refresh user in Redux
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(res.data.message);
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message ?? 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match');
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      const res = await api.post('/profile/change-password', {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      if (res.data.success) {
        setPwSuccess(res.data.message);
        setPwForm({ current_password: '', new_password: '', confirm_password: '' });
        setTimeout(() => setPwSuccess(''), 3000);
      } else {
        setPwError(res.data.message);
      }
    } catch (err: any) {
      setPwError(err.response?.data?.message ?? 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-xl font-bold text-green-700 flex-shrink-0">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">{user?.name}</h1>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${ROLE_STYLES[user?.role ?? 'farmer']}`}>
                {user?.role}
              </span>
              <span className="text-xs text-gray-400">
                {ROLE_DESCRIPTIONS[user?.role ?? 'farmer']}
              </span>
            </div>
          </div>

          {stats?.member_since && (
            <div className="hidden sm:block text-right flex-shrink-0">
              <p className="text-xs text-gray-400">Member since</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">
                {new Date(stats.member_since).toLocaleDateString('en-UG', {
                  month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Activity stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsLoading ? (
          [1,2,3,4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-6 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))
        ) : stats ? [
          { label: 'Produce registered', value: stats.produce_registered, sub: `${stats.produce_volume.toLocaleString()} kg total`, color: 'text-green-600' },
          { label: 'Items sold',         value: stats.sales,             sub: `UGX ${stats.sales_value.toLocaleString()}`,           color: 'text-blue-600' },
          { label: 'Purchases made',     value: stats.purchases,         sub: `UGX ${stats.purchase_value.toLocaleString()}`,         color: 'text-purple-600' },
          { label: 'Prices logged',      value: stats.prices_logged,     sub: 'market prices',                                        color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        )) : null}
      </div>

      {/* Edit profile form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">Edit profile</h2>

        {profileSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700">
            ✓ {profileSuccess}
          </div>
        )}
        {profileError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            {profileError}
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                type="text" required
                value={profileForm.name}
                onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+256 7XX XXX XXX"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address <span className="text-gray-400 font-normal">(cannot change)</span>
              </label>
              <input
                type="email" disabled value={user?.email ?? ''}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Role <span className="text-gray-400 font-normal">(set by admin)</span>
              </label>
              <input
                type="text" disabled value={user?.role ?? ''}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed capitalize"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit" disabled={profileLoading}
              className="px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition"
            >
              {profileLoading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Change password</h2>
        <p className="text-xs text-gray-400 mb-5">Choose a strong password of at least 6 characters</p>

        {pwSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700">
            ✓ {pwSuccess}
          </div>
        )}
        {pwError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
            <input
              type={showPasswords ? 'text' : 'password'} required
              value={pwForm.current_password}
              onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
              placeholder="Your current password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
              <input
                type={showPasswords ? 'text' : 'password'} required minLength={6}
                value={pwForm.new_password}
                onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                placeholder="Min. 6 characters"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
              <input
                type={showPasswords ? 'text' : 'password'} required
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))}
                placeholder="Repeat new password"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                  ${pwForm.confirm_password && pwForm.confirm_password !== pwForm.new_password
                    ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              />
              {pwForm.confirm_password && pwForm.confirm_password !== pwForm.new_password && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-500">Show passwords</span>
            </label>
            <button
              type="submit"
              disabled={pwLoading || (!!pwForm.confirm_password && pwForm.confirm_password !== pwForm.new_password)}
              className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition"
            >
              {pwLoading ? 'Changing…' : 'Change password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 p-6">
        <h2 className="text-sm font-semibold text-red-600 mb-1">Account information</h2>
        <p className="text-xs text-gray-400 mb-4">
          Your account was created on{' '}
          {stats?.member_since
            ? new Date(stats.member_since).toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' })
            : '—'}.
          Contact an administrator to delete your account or change your role.
        </p>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-xs text-gray-500">
            Your role is <strong>{user?.role}</strong>. Only administrators can change roles.
          </span>
        </div>
      </div>
    </div>
  );
}
