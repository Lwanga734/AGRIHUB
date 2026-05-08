import { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import type { RootState } from '../store/store';
import { fetchDashboard } from '../features/dashboard/dashboardSlice';
import { useAuth } from '../features/auth/useAuth';

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-400">vs yesterday</span>;
  const up = value >= 0;
  return (
    <span className={`text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? '▲' : '▼'} {Math.abs(value)}% vs yesterday
    </span>
  );
}

const ACTIVITY_STYLES: Record<string, { label: string; color: string }> = {
  produce: { label: 'Produce registered', color: 'bg-green-100 text-green-700' },
  price: { label: 'Price logged', color: 'bg-amber-100 text-amber-700' },
  transaction: { label: 'Transaction recorded', color: 'bg-blue-100 text-blue-700' },
};

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { data, isLoading, error, lastFetched } = useSelector(
    (state: RootState) => state.dashboard
  );

  const load = useCallback(() => { dispatch(fetchDashboard()); }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const today = new Date().toLocaleDateString('en-UG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const stats = data?.stats;

  const STAT_CARDS = stats ? [
    {
      label: 'Produce registered today',
      value: stats.produce_today,
      unit: `${stats.produce_volume_today.toLocaleString()} kg total`,
      change: stats.produce_change,
      color: 'text-green-600 bg-green-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
        </svg>
      ),
    },
    {
      label: 'Average commodity price',
      value: stats.avg_price_today > 0 ? `UGX ${stats.avg_price_today.toLocaleString()}` : '—',
      unit: 'per unit today',
      change: stats.avg_price_change,
      color: 'text-amber-600 bg-amber-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      label: 'Transactions today',
      value: stats.transactions_today,
      unit: `UGX ${stats.transactions_value.toLocaleString()} total`,
      change: stats.transactions_change,
      color: 'text-blue-600 bg-blue-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      label: 'Active traders today',
      value: stats.active_traders,
      unit: 'unique buyers',
      change: stats.traders_change,
      color: 'text-purple-600 bg-purple-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Good morning, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{today} · Nakasero Market</p>
        </div>
        <div className="flex items-center gap-3">
          {lastFetched && (
            <span className="text-xs text-gray-400">
              Updated {new Date(lastFetched).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={load}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          Could not load dashboard — {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading && !data
          ? [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="w-9 h-9 bg-gray-100 rounded-lg mb-3" />
              <div className="h-7 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))
          : STAT_CARDS.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`inline-flex p-2 rounded-lg mb-3 ${card.color}`}>{card.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.unit}</p>
              <div className="mt-2"><ChangeBadge value={card.change} /></div>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          ))
        }
      </div>

      {/* Activity + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent activity</h2>
          {isLoading && !data ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-4 bg-gray-100 rounded" />
                  <div className="w-28 h-4 bg-gray-100 rounded" />
                  <div className="flex-1 h-4 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : !data?.activity?.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {data?.activity?.map((item, i) => {
                const style = ACTIVITY_STYLES[item.type] ?? ACTIVITY_STYLES.produce;
                const detail =
                  item.type === 'produce'
                    ? `${item.quantity_kg} kg ${item.detail}${item.actor ? ` — ${item.actor}` : ''}`
                    : item.type === 'price'
                      ? `${item.detail} — UGX ${Number(item.amount).toLocaleString()}`
                      : `${item.detail} — UGX ${Number(item.amount).toLocaleString()}`;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xs text-gray-400 w-12 flex-shrink-0 pt-0.5">
                      {new Date(item.created_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${style.color}`}>
                      {style.label}
                    </span>
                    <span className="text-sm text-gray-600 truncate">{detail}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Register produce', path: '/produce', color: 'bg-green-600 hover:bg-green-700 text-white' },
              { label: 'Log a price', path: '/prices', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
              { label: 'Record transaction', path: '/transactions', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
              { label: 'View analytics', path: '/analytics', color: 'bg-gray-100 hover:bg-gray-200 text-gray-700' },
            ].map((a) => (
              <a key={a.label} href={a.path}
                className={`block w-full text-center py-2.5 rounded-lg text-sm font-medium transition ${a.color}`}>
                {a.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Live commodity prices */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Today's commodity prices</h2>
          <a href="/prices" className="text-xs text-green-600 hover:underline">View all →</a>
        </div>
        {isLoading && !data ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-50">
                <div className="h-4 bg-gray-100 rounded w-24" />
                <div className="h-4 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : !data?.commodity_prices?.length ? (
          <p className="text-sm text-gray-400 py-4 text-center">No prices logged yet today</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Commodity</th>
                <th className="text-right pb-2 font-medium">Price (UGX)</th>
                <th className="text-left pb-2 font-medium pl-3">Per</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.commodity_prices?.map((row) => (
                <tr key={row.commodity} className="hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-gray-900">{row.commodity}</td>
                  <td className="py-2.5 text-right font-semibold text-gray-900">
                    {Number(row.price_ugx).toLocaleString()}
                  </td>
                  <td className="py-2.5 text-gray-400 text-xs pl-3">{row.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}