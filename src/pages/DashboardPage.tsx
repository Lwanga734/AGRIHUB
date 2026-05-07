import { useAuth } from '../features/auth/useAuth';

const STATS = [
  {
    label: 'Produce registered today',
    value: '124',
    unit: 'items',
    change: '+12%',
    up: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
      </svg>
    ),
    color: 'text-green-600 bg-green-50',
  },
  {
    label: 'Average bean price',
    value: 'UGX 2,400',
    unit: 'per kg',
    change: '+5%',
    up: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    color: 'text-amber-600 bg-amber-50',
  },
  {
    label: 'Transactions today',
    value: '87',
    unit: 'recorded',
    change: '-3%',
    up: false,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    color: 'text-blue-600 bg-blue-50',
  },
  {
    label: 'Active traders',
    value: '43',
    unit: 'at market',
    change: '+8%',
    up: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-purple-600 bg-purple-50',
  },
];

const RECENT_ACTIVITY = [
  { time: '08:42', action: 'Produce registered', detail: '50 kg Tomatoes — Farmer Okello', type: 'produce' },
  { time: '09:15', action: 'Price logged',        detail: 'Maize — UGX 1,800/kg',          type: 'price' },
  { time: '09:33', action: 'Transaction recorded', detail: 'Beans — UGX 240,000',           type: 'transaction' },
  { time: '10:01', action: 'Quality check',        detail: 'Cabbage — Grade A approved',    type: 'quality' },
  { time: '10:22', action: 'Price logged',         detail: 'Sweet potatoes — UGX 900/kg',  type: 'price' },
];

const TYPE_COLORS: Record<string, string> = {
  produce:     'bg-green-100 text-green-700',
  price:       'bg-amber-100 text-amber-700',
  transaction: 'bg-blue-100 text-blue-700',
  quality:     'bg-purple-100 text-purple-700',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('en-UG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Welcome */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Good morning, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{today} · Nakasero Market</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.unit}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${stat.up ? 'text-green-600' : 'text-red-500'}`}>
                {stat.change}
              </span>
              <span className="text-xs text-gray-400">vs yesterday</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent activity — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent activity</h2>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xs text-gray-400 w-10 flex-shrink-0 pt-0.5">{item.time}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${TYPE_COLORS[item.type]}`}>
                  {item.action}
                </span>
                <span className="text-sm text-gray-600 truncate">{item.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions — 1/3 width */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Register produce', path: '/produce', color: 'bg-green-600 hover:bg-green-700 text-white' },
              { label: 'Log a price',      path: '/prices',  color: 'bg-amber-500 hover:bg-amber-600 text-white' },
              { label: 'Record transaction', path: '/transactions', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
              { label: 'View analytics',  path: '/analytics', color: 'bg-gray-100 hover:bg-gray-200 text-gray-700' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.path}
                className={`block w-full text-center py-2.5 rounded-lg text-sm font-medium transition ${action.color}`}
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Top commodities table */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Today's commodity prices</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Commodity</th>
                <th className="text-right pb-2 font-medium">Price (UGX/kg)</th>
                <th className="text-right pb-2 font-medium">Change</th>
                <th className="text-right pb-2 font-medium">Volume (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { name: 'Tomatoes',       price: '1,200', change: '+3%',  up: true,  vol: '820' },
                { name: 'Maize',          price: '1,800', change: '+1%',  up: true,  vol: '1,540' },
                { name: 'Beans',          price: '2,400', change: '+5%',  up: true,  vol: '630' },
                { name: 'Sweet potatoes', price: '900',   change: '-2%',  up: false, vol: '440' },
                { name: 'Cabbage',        price: '700',   change: '0%',   up: true,  vol: '290' },
              ].map((row) => (
                <tr key={row.name}>
                  <td className="py-2.5 font-medium text-gray-900">{row.name}</td>
                  <td className="py-2.5 text-right text-gray-700">{row.price}</td>
                  <td className={`py-2.5 text-right text-xs font-medium ${row.up ? 'text-green-600' : 'text-red-500'}`}>
                    {row.change}
                  </td>
                  <td className="py-2.5 text-right text-gray-400">{row.vol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}