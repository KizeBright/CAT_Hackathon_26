import { Card, Badge } from '../../components/ui/primitives';
import { useLiveFleet } from '../../hooks/useLiveFleet';
import { useAuth } from '../../hooks/useAuth';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { ExtendRequestStatus } from '../../types';

const statusBadge: Record<ExtendRequestStatus, { variant: 'warning'|'success'|'critical'; icon: React.ReactNode }> = {
  pending:  { variant: 'warning',  icon: <Clock size={14} /> },
  approved: { variant: 'success',  icon: <CheckCircle size={14} /> },
  rejected: { variant: 'critical', icon: <XCircle size={14} /> },
};

export default function OperatorHistory() {
  const { fleet, extendRequests } = useLiveFleet();
  const { operator } = useAuth();
  const empId = operator?.empId ?? '';

  const myRentals = fleet.flatMap(m =>
    m.rentalHistory
      .filter(r => r.empId === empId)
      .map(r => ({ ...r, machine: m }))
  ).sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

  const myRequests = extendRequests
    .filter(r => r.empId === empId)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-secondary uppercase tracking-tight">My History</h1>
        <p className="text-gray-500 text-sm mt-0.5">All rentals and extension requests</p>
      </div>

      {/* Extend requests */}
      {myRequests.length > 0 && (
        <Card>
          <h3 className="font-semibold text-secondary mb-3 text-sm uppercase tracking-wide">Extension Requests</h3>
          <div className="space-y-3">
            {myRequests.map(req => {
              const machine = fleet.find(m => m.id === req.machineId);
              const cfg = statusBadge[req.status];
              return (
                <div key={req.id} className="border border-gray-200 rounded-sm p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{machine?.model ?? req.machineId}</span>
                        <Badge variant={cfg.variant}>
                          <span className="flex items-center gap-1">{cfg.icon}{req.status}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Requested: {new Date(req.currentCheckoutDate).toLocaleDateString()} → {new Date(req.requestedNewCheckoutDate).toLocaleDateString()}
                      </p>
                      {req.reason && <p className="text-xs text-gray-400 mt-0.5">Reason: {req.reason}</p>}
                      {req.resolvedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {req.status === 'approved' ? 'Approved' : 'Rejected'} by {req.resolvedBy} on {new Date(req.resolvedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(req.requestedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Rental history */}
      <Card>
        <h3 className="font-semibold text-secondary mb-3 text-sm uppercase tracking-wide">Rental History</h3>
        {myRentals.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No rental history found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRentals.map(r => (
              <div key={r.id} className="border border-gray-200 rounded-sm p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{r.machine.model} ({r.machineId})</span>
                      <Badge variant={r.status === 'active' ? 'success' : r.status === 'overdue' ? 'critical' : 'info'}>
                        {r.status}
                      </Badge>
                      {r.extended && <Badge variant="warning">Extended</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(r.checkInDate).toLocaleDateString()} → {new Date(r.checkOutDate).toLocaleDateString()} · {r.totalDays} days
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Daily: ${r.dailyRate} · Advance: ${r.advancePaymentAmount.toLocaleString()}
                      {r.extraUsageCharge > 0 && ` · Extra: $${r.extraUsageCharge.toLocaleString()}`}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{r.machine.currentSite}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
