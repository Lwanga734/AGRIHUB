import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import type { RootState } from '../store/store';
import { fetchTransactions, createTransaction, clearTransactionMessages } from '../features/transactions/transactionsSlice';
import { fetchProduce } from '../features/produce/produceSlice';
import { useAuth } from '../features/auth/useAuth';

export default function TransactionsPage() {
  const dispatch = useAppDispatch();
  const { user, isOfficial } = useAuth();

  const { items, isLoading, isSubmitting, error, successMessage } = useSelector(
    (state: RootState) => state.transactions
  );
  const produce = useSelector((state: RootState) => state.produce.items);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    produce_id: 0,
    buyer_id: user?.id ?? 0,
    amount_ugx: '',
    quantity_kg: '',
  });

  // Available produce — only verified items not yet sold
  const availableProduce = produce.filter((p) => p.status === 'verified');

  useEffect(() => {
    dispatch(fetchTransactions());
    dispatch(fetchProduce());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      setShowForm(false);
      setForm({ produce_id: 0, buyer_id: user?.id ?? 0, amount_ugx: '', quantity_kg: '' });
      const t = setTimeout(() => dispatch(clearTransactionMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(createTransaction({
      produce_id:  form.produce_id,
      buyer_id:    form.buyer_id,
      amount_ugx:  parseFloat(form.amount_ugx),
      quantity_kg: parseFloat(form.quantity_kg),
    }));
  };

  // Auto-fill quantity when produce is selected
  const handleProduceChange = (id: number) => {
    const selected = produce.find((p) => p.id === id);
    setForm((f) => ({
      ...f,
      produce_id:  id,
      quantity_kg: selected ? String(selected.quantity_kg) : '',
    }));
  };

  const filtered = items.filter((t) =>
    t.commodity?.toLowerCase().includes(search.toLowerCase()) ||
    t.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.seller_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const totalValue   = items.reduce((sum, t) => sum + Number(t.amount_ugx), 0);
  const todayItems   = items.filter((t) => new Date(t.created_at).toDateString() === new Date().toDateString());
  const todayValue   = todayItems.reduce((sum, t) => sum + Number(t.amount_ugx), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {items.length} transaction{items.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Record transaction
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">Total transactions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{items.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">all time</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">Today's transactions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{todayItems.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{new Date().toDateString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">Today's total value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {todayValue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">UGX</p>
        </div>
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

      {/* Record form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Record new transaction</h2>

          {availableProduce.length === 0 && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-700">
              No verified produce available. Produce must be verified by a market official before it can be sold.
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Produce selection */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Select produce
              </label>
              <select
                required
                value={form.produce_id || ''}
                onChange={(e) => handleProduceChange(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose verified produce…</option>
                {availableProduce.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.commodity} — {p.quantity_kg} kg
                    {p.source_location ? ` (${p.source_location})` : ''}
                    {' '}· Grade {p.quality_grade}
                    {p.farmer_name ? ` · ${p.farmer_name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Quantity sold (kg)
              </label>
              <input
                type="number" required min={0.1} step={0.1}
                value={form.quantity_kg}
                onChange={(e) => setForm((f) => ({ ...f, quantity_kg: e.target.value }))}
                placeholder="e.g. 25"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Amount paid (UGX)
              </label>
              <input
                type="number" required min={1} step={1}
                value={form.amount_ugx}
                onChange={(e) => setForm((f) => ({ ...f, amount_ugx: e.target.value }))}
                placeholder="e.g. 120000"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Unit price preview */}
            {form.amount_ugx && form.quantity_kg && (
              <div className="sm:col-span-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-700">
                Unit price: UGX{' '}
                <strong>
                  {(parseFloat(form.amount_ugx) / parseFloat(form.quantity_kg)).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </strong>{' '}
                per kg
              </div>
            )}

            <div className="sm:col-span-2 flex gap-3 justify-end pt-1">
              <button
                type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || availableProduce.length === 0}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Recording…' : 'Record transaction'}
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
          placeholder="Search by commodity, buyer or seller…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Loading transactions…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">Record the first transaction for today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr className="text-xs text-gray-400">
                  <th className="text-left px-5 py-3 font-medium">#</th>
                  <th className="text-left px-5 py-3 font-medium">Commodity</th>
                  <th className="text-right px-5 py-3 font-medium">Qty (kg)</th>
                  <th className="text-right px-5 py-3 font-medium">Amount (UGX)</th>
                  <th className="text-right px-5 py-3 font-medium">Unit price</th>
                  <th className="text-left px-5 py-3 font-medium">Seller</th>
                  <th className="text-left px-5 py-3 font-medium">Buyer</th>
                  <th className="text-left px-5 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t, idx) => {
                  const unitPrice = t.quantity_kg > 0
                    ? Number(t.amount_ugx) / Number(t.quantity_kg)
                    : 0;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{t.commodity ?? '—'}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{Number(t.quantity_kg).toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">
                        {Number(t.amount_ugx).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500 text-xs">
                        {unitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}/kg
                      </td>
                      <td className="px-5 py-3 text-gray-500">{t.seller_name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-500">{t.buyer_name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {new Date(t.created_at).toLocaleString('en-UG', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer totals */}
              <tfoot className="border-t border-gray-100 bg-gray-50">
                <tr className="text-xs font-semibold text-gray-700">
                  <td colSpan={3} className="px-5 py-3">
                    Total ({filtered.length} transactions)
                  </td>
                  <td className="px-5 py-3 text-right">
                    {filtered.reduce((s, t) => s + Number(t.amount_ugx), 0).toLocaleString()} UGX
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
