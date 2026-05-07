import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import type { RootState } from '../store/store';
import { fetchPrices } from '../features/prices/pricesSlice';
import { fetchProduce } from '../features/produce/produceSlice';
import { fetchTransactions } from '../features/transactions/transactionsSlice';

export default function ReportsPage() {
  const dispatch     = useAppDispatch();
  const prices       = useSelector((s: RootState) => s.prices.items);
  const produce      = useSelector((s: RootState) => s.produce.items);
  const transactions = useSelector((s: RootState) => s.transactions.items);

  useEffect(() => {
    dispatch(fetchPrices());
    dispatch(fetchProduce());
    dispatch(fetchTransactions());
  }, [dispatch]);

  const totalVolume  = produce.reduce((s, p) => s + Number(p.quantity_kg), 0);
  const totalValue   = transactions.reduce((s, t) => s + Number(t.amount_ugx), 0);
  const todayTx      = transactions.filter(
    (t) => new Date(t.created_at).toDateString() === new Date().toDateString()
  );

  const exportCSV = () => {
    const rows = [
      ['#', 'Commodity', 'Quantity (kg)', 'Amount (UGX)', 'Seller', 'Buyer', 'Date'],
      ...transactions.map((t, i) => [
        i + 1,
        t.commodity ?? '',
        t.quantity_kg,
        t.amount_ugx,
        t.seller_name ?? '',
        t.buyer_name  ?? '',
        new Date(t.created_at).toLocaleDateString(),
      ]),
    ];
    const csv     = rows.map((r) => r.join(',')).join('\n');
    const blob    = new Blob([csv], { type: 'text/csv' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = `agrihub_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPricesCSV = () => {
    const rows = [
      ['#', 'Commodity', 'Price (UGX)', 'Unit', 'Logged By', 'Date'],
      ...prices.map((p, i) => [
        i + 1,
        p.commodity,
        p.price_ugx,
        p.unit,
        p.logged_by_name ?? '',
        new Date(p.created_at).toLocaleDateString(),
      ]),
    ];
    const csv  = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `agrihub_prices_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Market summary — {new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPricesCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export prices
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export transactions
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total produce registered', value: produce.length,               sub: 'items',        color: 'bg-green-50 text-green-600' },
          { label: 'Total volume',             value: `${totalVolume.toLocaleString()} kg`, sub: 'all produce', color: 'bg-teal-50 text-teal-600' },
          { label: 'Total transactions',       value: transactions.length,           sub: 'recorded',     color: 'bg-blue-50 text-blue-600' },
          { label: 'Total market value',       value: `UGX ${totalValue.toLocaleString()}`, sub: 'transacted', color: 'bg-purple-50 text-purple-600' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className={`text-xl font-bold mt-2 ${k.color.split(' ')[1]}`}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Today summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Today's summary</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{todayTx.length}</p>
            <p className="text-xs text-gray-400 mt-1">Transactions today</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {todayTx.reduce((s, t) => s + Number(t.amount_ugx), 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">UGX traded today</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{prices.filter(
              (p) => new Date(p.created_at).toDateString() === new Date().toDateString()
            ).length}</p>
            <p className="text-xs text-gray-400 mt-1">Prices logged today</p>
          </div>
        </div>
      </div>

      {/* Produce report table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Produce register</h2>
          <span className="text-xs text-gray-400">{produce.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-400">
                <th className="text-left px-5 py-3 font-medium">Commodity</th>
                <th className="text-right px-5 py-3 font-medium">Qty (kg)</th>
                <th className="text-left px-5 py-3 font-medium">Source</th>
                <th className="text-left px-5 py-3 font-medium">Farmer</th>
                <th className="text-left px-5 py-3 font-medium">Grade</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {produce.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-sm text-gray-400">No produce registered yet</td></tr>
              ) : produce.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.commodity}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{Number(p.quantity_kg).toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-500">{p.source_location || '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{p.farmer_name || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.quality_grade === 'A' ? 'bg-green-100 text-green-700' :
                      p.quality_grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                      p.quality_grade === 'C' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{p.quality_grade}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === 'verified' ? 'bg-green-100 text-green-700' :
                      p.status === 'sold'     ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(p.created_at).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prices report table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Price log history</h2>
          <span className="text-xs text-gray-400">{prices.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-400">
                <th className="text-left px-5 py-3 font-medium">Commodity</th>
                <th className="text-right px-5 py-3 font-medium">Price (UGX)</th>
                <th className="text-left px-5 py-3 font-medium">Per</th>
                <th className="text-left px-5 py-3 font-medium">Logged by</th>
                <th className="text-left px-5 py-3 font-medium">Date & time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {prices.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-sm text-gray-400">No prices logged yet</td></tr>
              ) : prices.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.commodity}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">{Number(p.price_ugx).toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{p.unit}</td>
                  <td className="px-5 py-3 text-gray-500">{p.logged_by_name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(p.created_at).toLocaleString('en-UG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
