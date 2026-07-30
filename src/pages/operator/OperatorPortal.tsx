import { useNavigate } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import { Card, Badge } from '../../components/ui/primitives';
import { useLiveFleet } from '../../hooks/useLiveFleet';
import { useAuth } from '../../hooks/useAuth';

export default function OperatorPortal() {
  const { fleet } = useLiveFleet();
  const { operator } = useAuth();
  const navigate = useNavigate();

  const myMachines = fleet.filter(m => m.currentOperatorEmpId === operator?.empId);
  const myHistory = fleet.flatMap(m =>
    m.rentalHistory.filter(r => r.empId === operator?.empId).map(r => ({ ...r, machine: m }))
  );
  const activeCount = myHistory.filter(r => r.status === 'active').length;
  const completedCount = myHistory.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-secondary uppercase tracking-tight">My Rentals</h1>
        <p className="text-gray-500 text-sm mt-0.5">Currently assigned equipment</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Rentals',    value: activeCount,    color: 'text-green-600' },
          { label: 'Completed Rentals', value: completedCount, color: 'text-gray-600' },
          { label: 'Machines Now',      value: myMachines.length, color: 'text-black' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="font-semibold text-secondary mb-3 text-sm uppercase tracking-wide">Currently Rented</h3>
        {myMachines.length === 0 ? (
          <div className="text-center py-8">
            <Package size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No machines currently assigned to you.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myMachines.map(m => {
              const rental = m.rentalHistory.find(r => r.status === 'active');
              return (
                <button key={m.id} onClick={() => navigate(`/operator/machine/${m.id}`)}
                  className="w-full text-left flex items-center gap-3 p-3 border border-gray-200 rounded-sm hover:border-black hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{m.id} — {m.model}</span>
                      <Badge variant={m.status === 'overdue' ? 'critical' : m.status === 'due-today' ? 'warning' : 'success'}>
                        {m.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{m.type} · {m.currentSite}</p>
                    {rental && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Due: {new Date(rental.checkOutDate).toLocaleDateString()} · {m.engineHoursToday.toFixed(1)}h engine today
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
