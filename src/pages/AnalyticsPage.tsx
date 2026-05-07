import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import type { RootState } from '../store/store';
import { fetchPrices } from '../features/prices/pricesSlice';
import { fetchProduce } from '../features/produce/produceSlice';
import { fetchTransactions } from '../features/transactions/transactionsSlice';

// ── Simple bar chart component ───────────────────────────────
function BarChart({ data, color = '#16a34a' }: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-28 truncate flex-shrink-0">{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 w-16 text-right flex-shrink-0">
            {d.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Simple line sparkline ────────────────────────────────────
function Sparkline({ values, color = '#16a34a' }: { values: number[]; color?: string }) {
  if (values.length < 2) return <span className="text-xs text-gray-400">Not enough data</span>;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 200;
  const h = 48;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AnalyticsPage() {
  const dispatch = useAppDispatch();
  const prices       = useSelector((state: RootState) => state.prices.items);
  const produce      = useSelector((state: RootState) => state.produce.items);
  const transactions = useSelector((state: RootState) => state.transactions.items);

  useEffect(() => {
    dispatch(fetchPrices());
    dispatch(fetchProduce());
    dispatch(fetchTransactions());
  }, [dispatch]);

  // ── Produce volume by commodity ──────────────────────────
  const volumeByComm: Record<string, number> = {};
  produce.forEach((p) => {
    volumeByComm[p.commodity] = (volumeByComm[p.commodity] || 0) + Number(p.quantity_kg);
  });
  const volumeData = Object.entries(volumeByComm)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  // ── Transaction value by commodity ──────────────────────
  const valueByComm: Record<string, number> = {};
  transactions.forEach((t) => {
    const key = t.commodity ?? 'Unknown';
    valueByComm[key] = (valueByComm[key] || 0) + Number(t.amount_ugx);
  });
  const valueData = Object.entries(valueByComm)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  // ── Price trend per commodity (latest 10 entries) ────────
  const commPriceTrends: Record<string, number[]> = {};
  [...prices].reverse().forEach((p) => {
    if (!commPriceTrends[p.commodity]) commPriceTrends[p.commodity] = [];
    commPriceTrends[p.commodity].push(Number(p.price_ugx));
  });
  const trendCommodities = Object.keys(commPriceTrends).slice(0, 4);

  // ── Summary KPIs ─────────────────────────────────────────
  const totalVolume    = produce.reduce((s, p) => s + Number(p.quantity_kg), 0);
  const totalTxValue   = transactions.reduce((s, t) => s + Number(t.amount_ugx), 0);
  const verifiedCount  = produce.filter((p) => p.status === 'verified').length;
  const soldCount      = produce.filter((p) => p.status === 'sold').length;

  // ── Produce status breakdown ─────────────────────────────
  const statusData = [
    { label: 'Pending',  value: produce.filter((p) => p.status === 'pending').length,  color: '#f59e0b' },
    { label: 'Verified', value: verifiedCount,                                           color: '#16a34a' },
    { label: 'Sold',     value: soldCount,                                               color: '#2563eb' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Market performance — Nakasero Market</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total produce volume',  value: `${totalVolume.toLocaleString()} kg`,     icon: '📦', color: 'bg-green-50 text-green-600' },
          { label: 'Total transaction value', value: `UGX ${totalTxValue.toLocaleString()}`, icon: '💰', color: 'bg-blue-50 text-blue-600' },
          { label: 'Items verified',         value: verifiedCount,                            icon: '✅', color: 'bg-amber-50 text-amber-600' },
          { label: 'Items sold',             value: soldCount,                                icon: '🏷️', color: 'bg-purple-50 text-purple-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-lg mb-3 ${kpi.color}`}>
              {kpi.icon}
            </div>
            <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Volume by commodity */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Produce volume by commodity (kg)</h2>
          {volumeData.length > 0 ? (
            <BarChart data={volumeData} color="#16a34a" />
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">No produce data yet</p>
          )}
        </div>

        {/* Transaction value by commodity */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Transaction value by commodity (UGX)</h2>
          {valueData.length > 0 ? (
            <BarChart data={valueData} color="#2563eb" />
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">No transaction data yet</p>
          )}
        </div>
      </div>

      {/* Produce status breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Produce status breakdown</h2>
        <div className="flex items-center gap-6">
          {statusData.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-sm text-gray-600">{s.label}</span>
              <span className="text-sm font-semibold text-gray-900">{s.value}</span>
            </div>
          ))}
          <div className="flex-1 h-4 rounded-full overflow-hidden bg-gray-100 flex">
            {statusData.map((s) => {
              const pct = produce.length > 0 ? (s.value / produce.length) * 100 : 0;
              return (
                <div
                  key={s.label}
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: s.color }}
                  title={`${s.label}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Price trends */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Price trends by commodity (UGX/unit)</h2>
        {trendCommodities.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No price data yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {trendCommodities.map((comm) => {
              const vals = commPriceTrends[comm];
              const latest = vals[vals.length - 1];
              const first  = vals[0];
              const change = ((latest - first) / first) * 100;
              return (
                <div key={comm} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{comm}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        UGX {latest.toLocaleString()}
                      </span>
                      <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Sparkline values={vals} color={change >= 0 ? '#16a34a' : '#ef4444'} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent transactions summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No transactions recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Commodity</th>
                  <th className="text-right pb-2 font-medium">Qty (kg)</th>
                  <th className="text-right pb-2 font-medium">Amount (UGX)</th>
                  <th className="text-right pb-2 font-medium">Unit price</th>
                  <th className="text-left pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.slice(0, 10).map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 font-medium text-gray-900">{t.commodity ?? '—'}</td>
                    <td className="py-2.5 text-right text-gray-600">{Number(t.quantity_kg).toLocaleString()}</td>
                    <td className="py-2.5 text-right text-gray-900 font-semibold">{Number(t.amount_ugx).toLocaleString()}</td>
                    <td className="py-2.5 text-right text-gray-400 text-xs">
                      {t.quantity_kg > 0
                        ? (Number(t.amount_ugx) / Number(t.quantity_kg)).toLocaleString(undefined, { maximumFractionDigits: 0 })
                        : '—'}/kg
                    </td>
                    <td className="py-2.5 text-gray-400 text-xs">
                      {new Date(t.created_at).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })}
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
