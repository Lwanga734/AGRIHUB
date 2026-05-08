import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import type { RootState } from '../store/store';
import {
  fetchUsers, createUser, updateUserRole,
  deleteUser, clearUsersMessages,
} from '../features/users/usersSlice';
import { useAuth } from '../features/auth/useAuth';
import type { UserRole } from '../features/auth/auth.types';

const ROLES: UserRole[] = ['farmer', 'trader', 'official', 'admin'];

const ROLE_STYLES: Record<UserRole, string> = {
  farmer:   'bg-green-100 text-green-700',
  trader:   'bg-blue-100 text-blue-700',
  official: 'bg-amber-100 text-amber-700',
  admin:    'bg-red-100 text-red-700',
};

const EMPTY_FORM = {
  name: '', email: '', password: '', role: 'farmer' as UserRole, phone: '',
};

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { user: me } = useAuth();
  const { items, isLoading, isSubmitting, error, successMessage } = useSelector(
    (state: RootState) => state.users
  );

  const [showForm, setShowForm]           = useState(false);
  const [search, setSearch]               = useState('');
  const [filterRole, setFilterRole]       = useState<UserRole | 'all'>('all');
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [editRoleId, setEditRoleId]       = useState<number | null>(null);
  const [newRole, setNewRole]             = useState<UserRole>('farmer');

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditRoleId(null);
      setConfirmDelete(null);
      const t = setTimeout(() => dispatch(clearUsersMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage, dispatch]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(createUser(form));
  };

  const handleRoleUpdate = (id: number) => {
    dispatch(updateUserRole({ id, role: newRole }));
  };

  const filtered = items.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // Stats
  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = items.filter((u) => u.role === r).length;
    return acc;
  }, {} as Record<UserRole, number>);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} registered users</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add user
        </button>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(filterRole === r ? 'all' : r)}
            className={`rounded-xl border p-4 text-left transition
              ${filterRole === r ? 'border-green-500 bg-green-50' : 'bg-white border-gray-100 hover:border-gray-200'}`}
          >
            <p className="text-2xl font-bold text-gray-900">{roleCounts[r]}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block ${ROLE_STYLES[r]}`}>
              {r}s
            </span>
          </button>
        ))}
      </div>

      {/* Banners */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700">
          ✓ {successMessage}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create user form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Add new user</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                required type="text" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Okello James"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                required type="email" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="tel" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+256 7XX XXX XXX"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                required type="password" value={form.password} minLength={6}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 characters"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="grid grid-cols-4 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r} type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r }))}
                    className={`py-2 rounded-lg text-sm font-medium border transition capitalize
                      ${form.role === r
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 flex gap-3 justify-end pt-1">
              <button
                type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >Cancel</button>
              <button
                type="submit" disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Creating…' : 'Create user'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Loading users…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr className="text-xs text-gray-400">
                  <th className="text-left px-5 py-3 font-medium">User</th>
                  <th className="text-left px-5 py-3 font-medium">Role</th>
                  <th className="text-left px-5 py-3 font-medium">Phone</th>
                  <th className="text-center px-5 py-3 font-medium">Produce</th>
                  <th className="text-center px-5 py-3 font-medium">Transactions</th>
                  <th className="text-left px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">

                    {/* User info */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700 flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {u.name}
                            {u.id === me?.id && (
                              <span className="ml-1.5 text-xs text-gray-400">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role — inline edit */}
                    <td className="px-5 py-3">
                      {editRoleId === u.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as UserRole)}
                            className="px-2 py-1 rounded border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r} className="capitalize">{r}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRoleUpdate(u.id)}
                            disabled={isSubmitting}
                            className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                          >Save</button>
                          <button
                            onClick={() => setEditRoleId(null)}
                            className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditRoleId(u.id); setNewRole(u.role); }}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize cursor-pointer hover:opacity-80 transition ${ROLE_STYLES[u.role]}`}
                          title="Click to change role"
                        >
                          {u.role}
                        </button>
                      )}
                    </td>

                    <td className="px-5 py-3 text-gray-500 text-xs">{u.phone || '—'}</td>

                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-medium text-gray-900">{u.produce_count}</span>
                    </td>

                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-medium text-gray-900">{u.tx_count}</span>
                    </td>

                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('en-UG', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      {u.id !== me?.id ? (
                        confirmDelete === u.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-600">Confirm?</span>
                            <button
                              onClick={() => dispatch(deleteUser(u.id))}
                              disabled={isSubmitting}
                              className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                            >Yes</button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                            >No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(u.id)}
                            className="text-xs px-3 py-1 rounded-lg text-red-500 hover:bg-red-50 font-medium transition"
                          >
                            Delete
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
