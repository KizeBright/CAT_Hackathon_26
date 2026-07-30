import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Card, Badge } from '../components/ui/primitives';
import { useLiveFleet } from '../hooks/useLiveFleet';
import { mockOperators } from '../data/mockData';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MachineStatus } from '../types';

type Filter = 'all' | 'rented' | 'available' | 'due-today';

const STATUS_COLOR: Record<string, string> = { rented: '#1C1C1C', available: '#16a34a', 'due-today': '#FFCD11' };
const STATUS_BADGE: Record<MachineStatus, 'info' | 'success' | 'warning' | 'critical'> = {
  rented: 'info', available: 'success', 'due-today': 'warning', overdue: 'critical',
};

export default function Dashboard() {
  const { fleet } = useLiveFleet();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => ({
    rented:   fleet.filter(m => m.status === 'rented').length,
    available:fleet.filter(m => m.status === 'available').length,
    dueToday: fleet.filter(m => m.status === 'due-today').length,
  }), [fleet]);

  const pieData = [
    { name: 'Rented',    value: counts.rented,    color: STATUS_COLOR.rented },
    { name: 'Available', value: counts.available, color: STATUS_COLOR.available },
    { name: 'Due Today', value: counts.dueToday,  color: STATUS_COLOR['due-today'] },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return fleet
      .filter(m => {
        const matchFilter = filter === 'all' || m.status === filter;
        const matchSearch = !q || m.id.toLowerCase().includes(q) || m.type.toLowerCase().includes(q) || m.model.toLowerCase().includes(q);
        return matchFilter && matchSearch;
      })
      // sort: normal priority first, low priority last
      .sort((a, b) => {
        if (a.priorityFlag === b.priorityFlag) return 0;
        return a.priorityFlag === 'low' ? 1 : -1;
      });
  }, [fleet, filter, search]);

  const handlePieClick = (data: { name?: string }) => {
    const map: Record<string, Filter> = { Rented: 'rented', Available: 'available', 'Due Today': 'due-today' };
    const key = data.name ? map[data.name] : undefined;
    if (key) setFilter(f => f === key ? 'all' : key);
  };

  const statCards = [
    { label: 'Currently Rented',      key: 'rented'    as Filter, count: counts.rented,    border: 'border-black' },
    { label: 'Available',             key: 'available' as Filter, count: counts.available, border: 'border-green-500' },
    { label: 'Due for Return Today',  key: 'due-today' as Filter, count: counts.dueToday,  border: 'border-primary' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <div className="relative rounded overflow-hidden" style={{ minHeight: 200 }}>
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=80)',
            backgroundSize: 'cover', backgroundPosition: 'center 50%',
          }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.55) 60%,rgba(0,0,0,0.25) 100%)' }} />
        <div className="relative px-6 pt-8 pb-6 lg:px-10">
          <h1 className="text-3xl lg:text-4xl font-black text-white uppercase leading-none tracking-tight mb-1">Asset Dashboard</h1>
          <p className="text-primary font-bold uppercase tracking-widest text-sm mb-6">Live Fleet Intelligence</p>
          <div className="flex max-w-lg">
            <div className="flex-1 bg-white flex items-center px-3 gap-2 rounded-l-sm">
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by type or machine ID…"
                className="flex-1 py-2.5 text-sm focus:outline-none" aria-label="Search machines" />
            </div>
            <button className="bg-primary px-4 flex items-center rounded-r-sm hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white" aria-label="Search">
              <Search size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map(({ label, key, count, border }) => (
          <button key={key} onClick={() => setFilter(f => f === key ? 'all' : key)}
            className="text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
            <Card className={`border-l-4 ${border} ${filter === key ? 'ring-2 ring-primary' : ''} hover:shadow-md transition-shadow`}>
              <p className="text-3xl font-black text-secondary">{count}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Pie chart ── */}
        <Card>
          <h3 className="font-semibold text-secondary mb-2 text-sm uppercase tracking-wide">Fleet Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" onClick={handlePieClick} cursor="pointer">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color}
                    stroke={filter === entry.name.toLowerCase().replace(' ', '-') ? '#FFCD11' : 'none'}
                    strokeWidth={3} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 text-center">Click a segment to filter below</p>
        </Card>

        {/* ── Machine list ── */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-secondary text-sm uppercase tracking-wide">
                {filter === 'all' ? 'All Machines' : filter === 'due-today' ? 'Due for Return Today' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                <span className="ml-2 text-gray-400 font-normal normal-case">({filtered.length})</span>
              </h3>
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')} className="text-xs text-gray-400 hover:text-black underline focus:outline-none">
                  Clear
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">No machines match your filter.</p>
              ) : filtered.map(m => (
                <button key={m.id} onClick={() => navigate(`/machine/${m.id}`)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-inset focus:ring-2 focus:ring-primary">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    m.status === 'rented' ? 'bg-blue-500' : m.status === 'available' ? 'bg-green-500' :
                    m.status === 'due-today' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-secondary">{m.id}</span>
                      <span className="text-xs text-gray-500">{m.model}</span>
                      <Badge variant={STATUS_BADGE[m.status]}>{m.status}</Badge>
                      {m.priorityFlag === 'low' && <Badge variant="warning">⚠ Low Priority</Badge>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.currentSite}
                      {m.currentOperatorEmpId && (() => {
                        const op = mockOperators.find(o => o.empId === m.currentOperatorEmpId);
                        return op
                          ? ` · ${op.name} (${op.empId}) · ${op.companyName}`
                          : ` · ${m.currentOperatorEmpId}`;
                      })()}
                    </p>
                  </div>
                  {/* Live engine hours badge */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono font-bold text-secondary">{m.engineHoursToday.toFixed(2)}h</p>
                    <p className="text-xs text-gray-400">engine today</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
