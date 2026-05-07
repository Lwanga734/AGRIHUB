import { useEffect, useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { fetchProduce, createProduce, verifyProduce, clearProduceMessages } from '../features/produce/produceSlice';
import { useAuth } from '../features/auth/useAuth';
import type { ProduceFormData } from '../features/produce/produce.types';

const COMMODITIES = [
  'Tomatoes', 'Maize', 'Beans', 'Sweet potatoes', 'Cabbage',
  'Onions', 'Carrots', 'Bananas', 'Cassava', 'Groundnuts',
  'Sorghum', 'Millet', 'Rice', 'Irish potatoes', 'Pumpkin',
];

const GRADE_COLORS = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-yellow-100 text-yellow-700',
  C: 'bg-red-100 text-red-700',
  ungraded: 'bg-gray-100 text-gray-500',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-green-100 text-green-700',
  sold: 'bg-blue-100 text-blue-700',
};

export default function ProducePage() {
  const dispatch = useAppDispatch();
  const { isOfficial, isFarmer } = useAuth();
  const { items, isLoading, isSubmitting, error, successMessage } = useSelector(
    (state: RootState) => state.produce
  );

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [verifyModal, setVerifyModal] = useState<{ id: number; commodity: string } | null>(null);
  const [grade, setGrade] = useState('A');
  const [gradeNotes, setGradeNotes] = useState('');

  const [form, setForm] = useState<ProduceFormData>({
    commodity: '',
    quantity_kg: 0,
    source_location: '',
    notes: '',
  });

  useEffect(() => {
    dispatch(fetchProduce());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      setShowForm(false);
      setVerifyModal(null);
      setForm({ commodity: '', quantity_kg: 0, source_location: '', notes: '' });
      const t = setTimeout(() => dispatch(clearProduceMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(createProduce(form));
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyModal) return;
    dispatch(verifyProduce({ id: verifyModal.id, grade, notes: gradeNotes }));
  };

  const filtered = items.filter((p) =>
    p.commodity.toLowerCase().includes(search.toLowerCase()) ||
    p.source_location?.toLowerCase().includes(search.toLowerCase()) ||
    p.farmer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Produce Entry</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {items.length} item{items.length !== 1 ? 's' : ''} registered at Nakasero Market
          </p>
        </div>
        {(isFarmer || isOfficial) && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Register produce
          </button>
        )}
      </div>

      {/* Success / Error banners */}
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

      {/* Register form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Register new produce</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Commodity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Commodity</label>
              <select
                required
                value={form.commodity}
                onChange={(e) => setForm((f) => ({ ...f, commodity: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select commodity</option>
                {COMMODITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity (kg)</label>
              <input
                type="number" required min={0.1} step={0.1}
                value={form.quantity_kg || ''}
                onChange={(e) => setForm((f) => ({ ...f, quantity_kg: parseFloat(e.target.value) }))}
                placeholder="e.g. 50"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Source location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Source location</label>
              <input
                type="text" required
                value={form.source_location}
                onChange={(e) => setForm((f) => ({ ...f, source_location: e.target.value }))}
                placeholder="e.g. Masaka, Wakiso"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional info"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Actions */}
            <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Registering…' : 'Register produce'}
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
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by commodity, location or farmer…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Produce table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Loading produce…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No produce found</p>
            <p className="text-xs text-gray-400 mt-1">Register the first produce entry for today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr className="text-xs text-gray-400">
                  <th className="text-left px-5 py-3 font-medium">Commodity</th>
                  <th className="text-right px-5 py-3 font-medium">Qty (kg)</th>
                  <th className="text-left px-5 py-3 font-medium">Location</th>
                  <th className="text-left px-5 py-3 font-medium">Farmer</th>
                  <th className="text-left px-5 py-3 font-medium">Grade</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Time</th>
                  {isOfficial && <th className="px-5 py-3 font-medium">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-medium text-gray-900">{item.commodity}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{item.quantity_kg}</td>
                    <td className="px-5 py-3 text-gray-500">{item.source_location || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{item.farmer_name || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GRADE_COLORS[item.quality_grade]}`}>
                        {item.quality_grade}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(item.created_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    {isOfficial && (
                      <td className="px-5 py-3">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => { setVerifyModal({ id: item.id, commodity: item.commodity }); setGrade('A'); setGradeNotes(''); }}
                            className="text-xs px-3 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition"
                          >
                            Verify
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verify modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Verify produce</h3>
            <p className="text-sm text-gray-400 mb-5">{verifyModal.commodity}</p>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality grade</label>
                <div className="flex gap-2">
                  {['A', 'B', 'C'].map((g) => (
                    <button
                      key={g} type="button"
                      onClick={() => setGrade(g)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition
                        ${grade === g
                          ? g === 'A' ? 'bg-green-600 text-white border-green-600'
                            : g === 'B' ? 'bg-yellow-500 text-white border-yellow-500'
                            : 'bg-red-500 text-white border-red-500'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      Grade {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={gradeNotes}
                  onChange={(e) => setGradeNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional quality notes…"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setVerifyModal(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving…' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
