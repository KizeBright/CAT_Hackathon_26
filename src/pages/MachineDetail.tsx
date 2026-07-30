import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, CheckCircle } from 'lucide-react';
import { Card, Badge, Button, Skeleton } from '../components/ui/primitives';
import { useLiveFleet } from '../hooks/useLiveFleet';
import { useAuth } from '../hooks/useAuth';
import { machineSummary, deriveFuelUsed } from '../lib/business';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MachineStatus } from '../types';

const STATUS_BADGE: Record<MachineStatus, 'info' | 'success' | 'warning' | 'critical'> = {
  rented: 'info', available: 'success', 'due-today': 'warning', overdue: 'critical',
};

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-black';
const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

export default function MachineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { fleet, logUsage } = useLiveFleet();
  const backPath = role === 'admin' ? '/admin' : '/operator';
  const machine = fleet.find(m => m.id === id);

  const [scanning, setScanning] = useState(false);
  const [empId, setEmpId] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [engineHours, setEngineHours] = useState('');
  const [idleHours, setIdleHours] = useState('');
  const [site, setSite] = useState('');
  const [done, setDone] = useState(false);

  if (!machine) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    </div>
  );

  const summary = machineSummary(machine);
  const activeRental = machine.rentalHistory.find(r => r.status === 'active');
  const fuelPreview = engineHours ? deriveFuelUsed(parseFloat(engineHours) || 0, machine.fuelRateLitersPerHour) : null;
  const scanTime = new Date().toLocaleString();

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logUsage(
      machine.id,
      empId || null,
      operatorName || null,
      parseFloat(engineHours) || 0,
      parseFloat(idleHours) || 0,
      site || machine.currentSite,
    );
    setDone(true);
  };

  const resetLog = () => { setScanning(false); setEmpId(''); setOperatorName(''); setEngineHours(''); setIdleHours(''); setSite(''); setDone(false); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(backPath)} aria-label="Back to dashboard">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-secondary uppercase">{machine.id} — {machine.model}</h1>
            <Badge variant={STATUS_BADGE[machine.status]}>{machine.status}</Badge>
            {machine.priorityFlag === 'low' && <Badge variant="warning">⚠ Low Priority</Badge>}
          </div>
          <p className="text-gray-500 text-sm">{machine.type} · {machine.currentSite}</p>
        </div>
      </div>

      {/* Live stats banner */}
      <Card className="bg-secondary border-0 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Engine Today', value: `${machine.engineHoursToday.toFixed(2)}h`, highlight: true },
            { label: 'Idle Today',   value: `${machine.idleHoursToday.toFixed(2)}h`,   highlight: false },
            { label: 'Fuel Today',   value: `${machine.fuelConsumedToday.toFixed(1)}L`, highlight: false },
            { label: 'GPS',          value: `${machine.lastLocation.lat.toFixed(4)}, ${machine.lastLocation.lng.toFixed(4)}`, highlight: false },
          ].map(({ label, value, highlight }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`font-black font-mono ${highlight ? 'text-primary text-2xl' : 'text-white text-lg'}`}>{value}</p>
            </div>
          ))}
        </div>
        {activeRental && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4 text-sm flex-wrap">
            <span className="text-gray-400">Operator: <span className="text-white font-semibold">{activeRental.empId}</span></span>
            <span className="text-gray-400">Due: <span className="text-white font-semibold">{new Date(activeRental.checkOutDate).toLocaleDateString()}</span></span>
            <span className="text-gray-400">Rate: <span className="text-white font-semibold">${activeRental.dailyRate}/day</span></span>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Usage log scan form ── */}
        <div className="space-y-4">
          <h2 className="font-black text-secondary uppercase tracking-tight text-lg">Log Usage</h2>

          {!scanning && !done && (
            <Card className="text-center py-10">
              <div className="border-2 border-dashed border-gray-200 rounded-sm p-6 mb-4">
                <QrCode size={56} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-mono text-gray-400">{machine.qrCode}</p>
              </div>
              <Button variant="primary" size="lg" onClick={() => setScanning(true)}>
                ✓ Simulate QR Scan
              </Button>
            </Card>
          )}

          {scanning && !done && (
            <Card>
              <div className="bg-gray-50 rounded-sm px-3 py-2 mb-4 flex items-center justify-between">
                <span className="text-xs font-mono text-gray-500">{machine.qrCode}</span>
                <Badge variant="info">Scanned</Badge>
              </div>
              <form onSubmit={handleLogSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>Scan Timestamp (auto)</label>
                  <input value={scanTime} readOnly className={inputClass + ' bg-gray-50 text-gray-500 cursor-not-allowed'} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Operator Name</label>
                    <input value={operatorName} onChange={e => setOperatorName(e.target.value)} placeholder="NULL if blank" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Employee ID</label>
                    <input value={empId} onChange={e => setEmpId(e.target.value)} placeholder="NULL if blank" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Engine Hours</label>
                    <input type="number" min="0" step="0.1" required value={engineHours} onChange={e => setEngineHours(e.target.value)} placeholder="e.g. 7.5" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Idle Hours (separate)</label>
                    <input type="number" min="0" step="0.1" value={idleHours} onChange={e => setIdleHours(e.target.value)} placeholder="e.g. 1.2" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Site</label>
                  <input value={site} onChange={e => setSite(e.target.value)} placeholder={machine.currentSite} className={inputClass} />
                </div>
                {fuelPreview !== null && (
                  <div className="bg-primary/10 border border-primary/30 rounded-sm p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel consumed (derived)</span>
                      <span className="font-black text-secondary">{fuelPreview} L</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{engineHours}h × {machine.fuelRateLitersPerHour} L/h</p>
                  </div>
                )}
                <Button type="submit" variant="primary" size="lg" className="w-full">Submit Log Entry</Button>
              </form>
            </Card>
          )}

          {done && (
            <Card className="text-center py-10">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
              <p className="font-bold text-secondary text-lg uppercase">Usage Logged</p>
              <p className="text-gray-500 text-sm mt-1">
                {machine.id} · {engineHours}h engine · {idleHours || 0}h idle · {fuelPreview}L fuel
              </p>
              <Button variant="primary" className="mt-6" onClick={resetLog}>Log Another</Button>
            </Card>
          )}
        </div>

        {/* ── Machine summary ── */}
        <div className="space-y-4">
          <h2 className="font-black text-secondary uppercase tracking-tight text-lg">Machine Summary</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Total Engine Hours', `${summary.totalEngineHours.toFixed(1)} h`],
              ['Total Idle Hours',   `${summary.totalIdleHours.toFixed(1)} h`],
              ['Total Fuel Used',    `${summary.totalFuel.toFixed(1)} L`],
              ['Total Rented Days',  `${summary.totalRentedDays} days`],
              ['Sites Used',         summary.sites.join(', ') || '—'],
              ['Odometer',           `${machine.engineHoursTotal.toLocaleString()} h`],
            ].map(([label, value]) => (
              <Card key={label} className="py-3">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-bold text-secondary mt-0.5 text-sm">{value}</p>
              </Card>
            ))}
          </div>

          {/* Engine + idle per day chart */}
          {summary.dailyChart.length > 0 && (
            <Card>
              <h3 className="font-semibold text-secondary mb-3 text-xs uppercase tracking-wide">Engine & Idle Hours per Day</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={summary.dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="engine" fill="#FFCD11" radius={[2, 2, 0, 0]} name="Engine h" />
                  <Bar dataKey="idle"   fill="#4A4A4A" radius={[2, 2, 0, 0]} name="Idle h" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      </div>

      {/* ── Rental history ── */}
      <Card>
        <h3 className="font-semibold text-secondary mb-4 text-sm uppercase tracking-wide">Rental History</h3>
        {machine.rentalHistory.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No rental history.</p>
        ) : (
          <div className="relative pl-4 border-l-2 border-gray-200 space-y-3">
            {machine.rentalHistory.map(r => (
              <div key={r.id} className="relative">
                <div className="absolute -left-5 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                <div className="bg-gray-50 rounded-sm p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-sm">{r.empId}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(r.checkInDate).toLocaleDateString()} → {new Date(r.checkOutDate).toLocaleDateString()} ({r.totalDays}d)
                      </p>
                      {r.extended && <p className="text-xs text-orange-500">Extended +{r.extensionDays}d · Extra: ${r.extraUsageCharge}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">${(r.totalDays * r.dailyRate).toLocaleString()}</p>
                      <Badge variant={r.status === 'active' ? 'info' : r.status === 'overdue' ? 'critical' : 'success'}>{r.status}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Recent usage log entries ── */}
      <Card>
        <h3 className="font-semibold text-secondary mb-3 text-sm uppercase tracking-wide">Usage Log ({machine.usageLog.length} entries)</h3>
        {machine.usageLog.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No usage logs yet. Scan the QR above to add one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Operator', 'Emp ID', 'Engine h', 'Idle h', 'Fuel L', 'Site', 'Logged At'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...machine.usageLog].reverse().map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{l.operatorName ?? 'NULL'}</td>
                    <td className="px-3 py-2 text-gray-500">{l.empId ?? 'NULL'}</td>
                    <td className="px-3 py-2 font-mono font-bold">{l.engineHours.toFixed(1)}</td>
                    <td className="px-3 py-2 font-mono text-gray-500">{l.idleHours.toFixed(1)}</td>
                    <td className="px-3 py-2 font-mono">{l.fuelUsed.toFixed(1)}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{l.site}</td>
                    <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{new Date(l.scanTimestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
