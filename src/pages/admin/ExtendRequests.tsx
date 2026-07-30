import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Inbox } from 'lucide-react';
import { Card, Badge, Button } from '../../components/ui/primitives';
import { useLiveFleet } from '../../hooks/useLiveFleet';
import { useAuth } from '../../hooks/useAuth';
import { mockOperators } from '../../data/mockData';
import type { ExtendRequestStatus } from '../../types';

const statusCfg: Record<ExtendRequestStatus, { variant: 'warning'|'success'|'critical'; icon: React.ReactNode }> = {
  pending:  { variant: 'warning',  icon: <Clock size={14} /> },
  approved: { variant: 'success',  icon: <CheckCircle size={14} /> },
  rejected: { variant: 'critical', icon: <XCircle size={14} /> },
};

export default function ExtendRequests() {
  const { fleet, extendRequests, resolveExtendRequest } = useLiveFleet();
  const { adminName } = useAuth();
  const [filter, setFilter] = useState<ExtendRequestStatus | 'all'>('pending');

  const visible = extendRequests.filter(r => filter === 'all' || r.status === filter)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const pendingCount = extendRequests.filter(r => r.status === 'pending').length;

  const getOperator = (empId: string) => mockOperators.find(o => o.empId === empId);
  const getMachine = (machineId: string) => fleet.find(m => m.id === machineId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-secondary uppercase tracking-tight">Extend Requests</h1>
          <p className="text-gray-500 text-sm mt-0.5">Operator-submitted rental extension requests</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1.5 rounded-sm">
            {pendingCount} pending
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${filter === f ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="text-center py-12">
          <Inbox size={40} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">No {filter === 'all' ? '' : filter} requests</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {visible.map(req => {
            const op = getOperator(req.empId);
            const machine = getMachine(req.machineId);
            const cfg = statusCfg[req.status];
            const extraDays = Math.ceil(
              (new Date(req.requestedNewCheckoutDate).getTime() - new Date(req.currentCheckoutDate).getTime()) / 86_400_000
            );
            const activeRental = machine?.rentalHistory.find(r => r.status === 'active');
            const extraCharge = activeRental && machine
              ? parseFloat(((extraDays * activeRental.dailyRate) * 1.1).toFixed(2))
              : 0;

            return (
              <Card key={req.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-secondary">{machine?.model ?? req.machineId}</span>
                      <span className="text-gray-400 text-sm">{req.machineId}</span>
                      <Badge variant={cfg.variant}>
                        <span className="flex items-center gap-1">{cfg.icon}{req.status}</span>
                      </Badge>
                    </div>

                    {/* Operator + company */}
                    <div className="bg-gray-50 rounded-sm p-2 text-xs space-y-0.5">
                      <p><span className="text-gray-500">Operator:</span> <span className="font-semibold">{op?.name ?? req.empId}</span> ({req.empId})</p>
                      <p><span className="text-gray-500">Company:</span> <span className="font-semibold">{op?.companyName ?? '—'}</span></p>
                    </div>

                    <div className="text-sm space-y-1">
                      <div className="flex gap-6">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Current return</p>
                          <p className="font-semibold">{new Date(req.currentCheckoutDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Requested return</p>
                          <p className="font-semibold text-black">{new Date(req.requestedNewCheckoutDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Extension</p>
                          <p className="font-semibold">+{extraDays} days</p>
                        </div>
                        {extraCharge > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Est. extra charge</p>
                            <p className="font-semibold text-orange-600">${extraCharge.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                      {req.reason && (
                        <p className="text-xs text-gray-500 italic">"{req.reason}"</p>
                      )}
                    </div>

                    {req.resolvedAt && (
                      <p className="text-xs text-gray-400">
                        {req.status === 'approved' ? 'Approved' : 'Rejected'} by {req.resolvedBy} · {new Date(req.resolvedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button variant="primary" size="sm"
                        onClick={() => resolveExtendRequest(req.id, 'approved', adminName ?? 'Admin')}>
                        ✓ Approve
                      </Button>
                      <Button variant="secondary" size="sm"
                        onClick={() => resolveExtendRequest(req.id, 'rejected', adminName ?? 'Admin')}>
                        ✗ Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
