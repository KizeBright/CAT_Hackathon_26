import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Clock } from 'lucide-react';
import { Card, Badge, Button, Modal } from '../components/ui/primitives';
import { useLiveFleet } from '../hooks/useLiveFleet';
import { mockOperators } from '../data/mockData';
import type { FleetAlert, AlertType } from '../types';

const CONFIG: Record<AlertType, { icon: React.ReactNode; border: string; bg: string; badge: 'critical'|'warning'|'info' }> = {
  overdue:        { icon: <AlertCircle size={20} className="text-red-600" />,    border: 'border-l-red-500',    bg: 'bg-red-50',    badge: 'critical' },
  'return-today': { icon: <AlertTriangle size={20} className="text-orange-500" />, border: 'border-l-orange-400', bg: 'bg-orange-50', badge: 'warning' },
  'return-1-day': { icon: <Clock size={20} className="text-yellow-500" />,        border: 'border-l-yellow-400', bg: 'bg-yellow-50', badge: 'warning' },
  'return-2-day': { icon: <Info size={20} className="text-blue-500" />,           border: 'border-l-blue-400',   bg: 'bg-blue-50',   badge: 'info' },
};
const TYPE_LABEL: Record<AlertType, string> = { overdue: 'Overdue', 'return-today': 'Due Today', 'return-1-day': '1 Day', 'return-2-day': '2 Days' };

export default function Alerts() {
  const { alerts, acknowledgeAlert, extendRequests, fleet } = useLiveFleet();
  const [filter, setFilter] = useState<'all' | AlertType>('all');
  const [extendAlert, setExtendAlert] = useState<FleetAlert | null>(null);

  const visible = alerts.filter(a => !a.acknowledged && (filter === 'all' || a.type === filter));

  const counts = {
    overdue: alerts.filter(a => a.type === 'overdue'        && !a.acknowledged).length,
    today:   alerts.filter(a => a.type === 'return-today'   && !a.acknowledged).length,
    soon:    alerts.filter(a => (a.type === 'return-1-day' || a.type === 'return-2-day') && !a.acknowledged).length,
  };

  const getRental = (machineId: string) =>
    fleet.find(m => m.id === machineId)?.rentalHistory.find(r => r.status === 'active');

  const getPendingRequest = (machineId: string) =>
    extendRequests.find(r => r.machineId === machineId && r.status === 'pending');

  const getOperator = (empId: string) => mockOperators.find(o => o.empId === empId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-secondary uppercase tracking-tight">Alerts</h1>
        <p className="text-gray-500 text-sm mt-0.5">Auto-generated from active rental due dates</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Overdue',   count: counts.overdue, color: 'bg-red-100 text-red-700',    icon: <AlertCircle size={18} /> },
          { label: 'Due Today', count: counts.today,   color: 'bg-orange-100 text-orange-700', icon: <AlertTriangle size={18} /> },
          { label: 'Due Soon',  count: counts.soon,    color: 'bg-blue-100 text-blue-700',   icon: <Info size={18} /> },
        ].map(({ label, count, color, icon }) => (
          <Card key={label} className="flex items-center gap-3">
            <div className={`p-2 rounded-sm ${color}`}>{icon}</div>
            <div>
              <p className="text-2xl font-black text-secondary">{count}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'overdue', 'return-today', 'return-1-day', 'return-2-day'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${filter === f ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f === 'all' ? 'All' : TYPE_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.length === 0 ? (
          <Card className="text-center py-12">
            <CheckCircle size={40} className="text-green-400 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No active alerts</p>
            <p className="text-gray-400 text-sm mt-1">All rentals are on schedule.</p>
          </Card>
        ) : visible.map(alert => {
          const c = CONFIG[alert.type];
          const rental = getRental(alert.machineId);
          const pendingReq = getPendingRequest(alert.machineId);
          const op = rental ? getOperator(rental.empId) : null;
          return (
            <div key={alert.id} className={`rounded-sm border-l-4 p-4 ${c.border} ${c.bg}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{c.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm text-secondary">{alert.machineName}</span>
                    <Badge variant={c.badge}>{TYPE_LABEL[alert.type]}</Badge>
                    {pendingReq && <Badge variant="warning">⏳ Extend Requested</Badge>}
                  </div>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  {rental && (
                    <p className="text-xs text-gray-500 mt-1">
                      Operator: <span className="font-medium">{op?.name ?? rental.empId}</span>
                      {op && <> · {op.companyName}</>}
                      {' '}· Due: {new Date(rental.checkOutDate).toLocaleDateString()}
                    </p>
                  )}
                  {pendingReq && (
                    <p className="text-xs text-orange-600 mt-1 font-medium">
                      Pending extension to {new Date(pendingReq.requestedNewCheckoutDate).toLocaleDateString()} — review in Extend Requests
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!pendingReq && (
                    <Button size="sm" variant="ghost" onClick={() => setExtendAlert(alert)}>Extend</Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => acknowledgeAlert(alert.id)}>Dismiss</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin direct-extend modal (only shown when no pending request exists) */}
      <Modal open={!!extendAlert} onClose={() => setExtendAlert(null)} title={`Extend Rental — ${extendAlert?.machineName}`}>
        {extendAlert && (() => {
          const rental = getRental(extendAlert.machineId);
          return (
            <AdminExtendForm
              rental={rental ?? null}
              onClose={() => setExtendAlert(null)}
              onExtend={() => {
                acknowledgeAlert(extendAlert.id);
                setExtendAlert(null);
              }}
            />
          );
        })()}
      </Modal>
    </div>
  );
}

// Inline sub-component to avoid re-importing useLiveFleet at top level twice
function AdminExtendForm({ rental, onClose, onExtend }: {
  rental: ReturnType<typeof import('../hooks/useLiveFleet').useLiveFleet>['fleet'][0]['rentalHistory'][0] | null;
  onClose: () => void;
  onExtend: () => void;
}) {
  const [newDate, setNewDate] = useState('');
  const { extendRental } = useLiveFleet();

  const handleConfirm = () => {
    if (!newDate || !rental) return;
    extendRental(rental.machineId, newDate);
    onExtend();
  };

  if (!rental) return null;
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-sm p-3 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-gray-500">Current return date</span><span className="font-semibold">{new Date(rental.checkOutDate).toLocaleDateString()}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Daily rate</span><span className="font-semibold">${rental.dailyRate}/day</span></div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">New Return Date</label>
        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
          min={rental.checkOutDate.slice(0, 10)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-black" />
      </div>
      {newDate && (
        <div className="bg-primary/10 border border-primary/30 rounded-sm p-3 text-sm">
          <p className="font-bold text-secondary">
            +{Math.ceil((new Date(newDate).getTime() - new Date(rental.checkOutDate).getTime()) / 86_400_000)} additional days
          </p>
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="primary" size="lg" className="flex-1" onClick={handleConfirm} disabled={!newDate}>
          Confirm Extension
        </Button>
        <Button variant="secondary" size="lg" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}
