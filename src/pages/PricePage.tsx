import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import type { RootState } from '../store/store';
import { fetchPrices, createPrice, deletePrice, clearPricesMessages } from '../features/prices/pricesSlice';
import { useAuth } from '../features/auth/useAuth';

const COMMODITIES = [
  'Tomatoes', 'Maize', 'Beans', 'Sweet potatoes', 'Cabbage',
  'Onions', 'Carrots', 'Bananas', 'Cassava', 'Groundnuts',
  'Sorghum', 'Millet', 'Rice', 'Irish potatoes', 'Pumpkin',
];

const UNITS = ['kg', 'bunch', 'crate', 'bag (100kg)', 'litre', 'piece'];

// Trend indicator — compares latest price to previous entry for same commodity
function useTrend(items: any[], commodity: string, currentPrice: number) {
  const prev = items.find((p) => p.commodity === commodity && p.price_ugx !== currentPrice);
  if (!prev) return null;
  const diff = ((currentPrice - prev.price_ugx) / prev.price_ugx) * 100;
  return diff;
}

function TrendBadge({ diff }: { diff: number | null }) {
  if (diff === null) return <span className="text-gray-300 text-xs">—</span>;
  const up = diff >= 0;
  return (
    <span className={`text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}%
    </span>
  );
}

export default function PricePage() {
  const dispatch = useAppDispatch();
  const { isOfficial } = useAuth();
  const { items, isLoading, isSubmitting, error, successMessage } = useSelector(
    (state: RootState) => state.prices
  );

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ commodity: '', price_ugx: '', unit: 'kg' });

  useEffect(() => { dispatch(fetchPrices()); }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      setShowForm(false);
      setForm({ commodity: '', price_ugx: '', unit: 'kg' });
      const t = setTimeout(() => dispatch(clearPricesMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(createPrice({
      commodity: form.commodity,
      price_ugx: parseFloat(form.price_ugx),
      unit: form.unit,
    }));
  };

  const filtered = items.filter((p) =>
    p.commodity.toLowerCase().includes(search.toLowerCase())
  );

  // Latest price per commodity for summary cards
  const latestByComm: Record<string, typeof items[0]> = {};
  [...items].reverse().forEach((p) => { latestByComm[p.commodity] = p; });
  const summaryCards = Object.values(latestByComm).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Price Log</h1>
          <p className="text-sm text-gray-400 mt-0.5">Daily commodity prices at Nakasero Market</p>
        </div>
        {isOfficial && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Log price
          </button>
        )}
      </div>

      {/* Banners */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700">✓ {successMessage}</div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
      )}

      {/* Summary cards */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {summaryCards.map((p) => {
            const prevItems = items.filter(
              (x) => x.commodity === p.commodity && x.id !== p.id
            );
            const prev = prevItems[0];
            const diff = prev
              ? ((p.price_ugx - prev.price_ugx) / prev.price_ugx) * 100
              : null;

            return (
              <div key={p.commodity} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 truncate">{p.commodity}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {Number(p.price_ugx).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">UGX/{p.unit}</p>
                <div className="mt-1.5">
                  <TrendBadge diff={diff} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log form */}
      {showForm && isOfficial && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Log new price</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Commodity</label>
              <select
                required value={form.commodity}
                onChange={(e) => setForm((f) => ({ ...f, commodity: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Select commodity</option>
                {COMMODITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (UGX)</label>
              <input
                type="number" required min={1} step={1}
                value={form.price_ugx}
                onChange={(e) => setForm((f) => ({ ...f, price_ugx: e.target.value }))}
                placeholder="e.g. 2400"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Per unit</label>
              <select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="sm:col-span-3 flex gap-3 justify-end pt-1">
              <button
                type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >Cancel</button>
              <button
                type="submit" disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-60"
              >
                {isSubmitting ? 'Logging…' : 'Log price'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text" value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search commodity…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Price table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">Loading prices…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No prices logged yet</p>
            <p className="text-xs text-gray-400 mt-1">
              {isOfficial ? 'Use the "Log price" button to add today\'s prices' : 'Market officials will log prices here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr className="text-xs text-gray-400">
                  <th className="text-left px-5 py-3 font-medium">Commodity</th>
                  <th className="text-right px-5 py-3 font-medium">Price (UGX)</th>
                  <th className="text-left px-5 py-3 font-medium">Per</th>
                  <th className="text-left px-5 py-3 font-medium">Trend</th>
                  <th className="text-left px-5 py-3 font-medium">Logged by</th>
                  <th className="text-left px-5 py-3 font-medium">Time</th>
                  {isOfficial && <th className="px-5 py-3 font-medium">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item, idx) => {
                  const sameComm = filtered.filter(
                    (x) => x.commodity === item.commodity && x.id !== item.id
                  );
                  const prev = sameComm[idx] ?? sameComm[0];
                  const diff = prev
                    ? ((item.price_ugx - prev.price_ugx) / prev.price_ugx) * 100
                    : null;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-medium text-gray-900">{item.commodity}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">
                        {Number(item.price_ugx).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{item.unit}</td>
                      <td className="px-5 py-3"><TrendBadge diff={diff} /></td>
                      <td className="px-5 py-3 text-gray-500">{item.logged_by_name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {new Date(item.created_at).toLocaleString('en-UG', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      {isOfficial && (
                        <td className="px-5 py-3">
                          <button
                            onClick={() => dispatch(deletePrice(item.id))}
                            className="text-xs px-3 py-1 rounded-lg text-red-500 hover:bg-red-50 font-medium transition"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
