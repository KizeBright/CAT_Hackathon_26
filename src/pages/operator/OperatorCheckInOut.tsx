import { useState, useMemo } from 'react';
import { QrCode, CheckCircle, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, Button, Badge, Modal } from '../../components/ui/primitives';
import { useLiveFleet } from '../../hooks/useLiveFleet';
import { useAuth } from '../../hooks/useAuth';
import { calcAdvancePayment, calcRentalDays, calcExtensionCharge } from '../../lib/business';
import type { Machine } from '../../types';

type Mode = 'rent' | 'return';
type Step = 'select' | 'scan' | 'terms' | 'confirm' | 'done';

const DAILY_RATES: Record<string, number> = {
  Excavator: 600, Bulldozer: 700, 'Wheel Loader': 500, 'Motor Grader': 550,
  'Backhoe Loader': 400, Compactor: 350, 'Skid Steer': 300,
  'Articulated Truck': 900, Telehandler: 380,
};

const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-black';
const lbl = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

export default function OperatorCheckInOut() {
  const { fleet, checkIn, returnMachine, submitExtendRequest } = useLiveFleet();
  const { operator } = useAuth();
  const empId = operator?.empId ?? '';

  const [mode, setMode] = useState<Mode>('rent');
  const [step, setStep] = useState<Step>('select');
  const [selected, setSelected] = useState<Machine | null>(null);
  const [checkoutDate, setCheckoutDate] = useState('');
  const [extEngineHours, setExtEngineHours] = useState('');
  const [doneMsg, setDoneMsg] = useState('');

  // Extend request modal state
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendDate, setExtendDate] = useState('');
  const [extendReason, setExtendReason] = useState('');

  const availableMachines = useMemo(() =>
    fleet.filter(m => m.status === 'available')
      .sort((a, b) => a.priorityFlag === b.priorityFlag ? 0 : a.priorityFlag === 'low' ? 1 : -1),
    [fleet]);

  // Operator can only return their own machines
  const returnableMachines = fleet.filter(m =>
    (m.status === 'rented' || m.status === 'due-today' || m.status === 'overdue') &&
    m.currentOperatorEmpId === empId
  );

  const dailyRate = selected ? (DAILY_RATES[selected.type] ?? 500) : 0;
  const totalDays = checkoutDate ? calcRentalDays(new Date().toISOString(), checkoutDate) : 0;
  const advance = calcAdvancePayment(totalDays, dailyRate);
  const activeRental = selected?.rentalHistory.find(r => r.status === 'active');
  const isOverdue = activeRental ? Date.now() > new Date(activeRental.checkOutDate).getTime() : false;
  const extHours = parseFloat(extEngineHours) || 0;
  const extensionCharge = selected ? calcExtensionCharge(extHours, selected.fuelRateLitersPerHour, dailyRate) : 0;

  const reset = () => {
    setStep('select'); setSelected(null); setCheckoutDate('');
    setExtEngineHours(''); setDoneMsg('');
    setExtendDate(''); setExtendReason('');
  };

  const handleConfirm = () => {
    if (!selected) return;
    if (mode === 'rent') {
      checkIn(selected.id, empId, checkoutDate, dailyRate);
      setDoneMsg(`${selected.model} rented to ${empId}. Advance: $${advance.toFixed(2)}.`);
    } else {
      returnMachine(selected.id, extHours);
      setDoneMsg(`${selected.model} returned. QR invalidated.${extensionCharge > 0 ? ` Extension charge: $${extensionCharge.toFixed(2)}.` : ''}`);
    }
    setStep('done');
  };

  const handleExtendRequest = () => {
    if (!selected || !extendDate || !activeRental) return;
    submitExtendRequest(selected.id, empId, activeRental.checkOutDate, extendDate, extendReason);
    setShowExtendModal(false);
    setDoneMsg(`Extension request submitted for ${selected.model}. Awaiting admin approval.`);
    setStep('done');
  };

  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);
  const steps: Step[] = mode === 'rent' ? ['select', 'scan', 'terms', 'confirm'] : ['select', 'scan', 'confirm'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-secondary uppercase tracking-tight">Check In / Check Out</h1>
        <p className="text-gray-500 text-sm mt-0.5">Logged in as <span className="font-semibold text-black">{empId}</span></p>
      </div>

      <div className="flex border border-gray-200 overflow-hidden rounded-sm">
        {(['rent', 'return'] as Mode[]).map(m => (
          <button key={m} onClick={() => { setMode(m); reset(); }}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors focus:outline-none ${mode === m ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            {m === 'rent' ? '📤 Rent Out' : '📥 Return'}
          </button>
        ))}
      </div>

      {step !== 'done' && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          {steps.map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              <span className={`font-semibold capitalize ${step === s ? 'text-black' : ''}`}>{s}</span>
              {i < steps.length - 1 && <ChevronRight size={12} />}
            </span>
          ))}
        </div>
      )}

      {step === 'done' && (
        <Card className="text-center py-10">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
          <p className="font-bold text-secondary text-lg uppercase">{mode === 'rent' ? 'Rented Out!' : 'Done!'}</p>
          <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">{doneMsg}</p>
          <Button variant="primary" className="mt-6" onClick={reset}>New Transaction</Button>
        </Card>
      )}

      {step === 'select' && (
        <Card>
          <h3 className="font-semibold text-secondary mb-3 text-sm uppercase tracking-wide">
            {mode === 'rent' ? 'Select Available Machine' : 'Select Your Machine to Return'}
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(mode === 'rent' ? availableMachines : returnableMachines).map(m => (
              <button key={m.id} onClick={() => { setSelected(m); setStep('scan'); }}
                className="w-full text-left flex items-center gap-3 p-3 border border-gray-200 rounded-sm hover:border-black hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{m.id} — {m.model}</span>
                    <Badge variant={m.status === 'available' ? 'success' : m.status === 'overdue' ? 'critical' : 'warning'}>{m.status}</Badge>
                    {m.priorityFlag === 'low' && <Badge variant="warning">⚠ Low Priority</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{m.type} · {m.currentSite}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            ))}
            {(mode === 'rent' ? availableMachines : returnableMachines).length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">
                {mode === 'return' ? 'No machines assigned to you.' : 'No machines available.'}
              </p>
            )}
          </div>
        </Card>
      )}

      {step === 'scan' && selected && (
        <Card>
          <div className="bg-gray-50 rounded-sm p-3 mb-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{selected.id} — {selected.model}</p>
              <p className="text-xs text-gray-500">{selected.type}</p>
            </div>
            <Badge variant={selected.status === 'available' ? 'success' : 'warning'}>{selected.status}</Badge>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-sm p-8 text-center mb-4">
            <QrCode size={64} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-mono text-gray-500 mb-1">{selected.qrCode}</p>
          </div>
          {/* Auto-filled operator info */}
          <div className="bg-primary/10 border border-primary/30 rounded-sm p-3 mb-4 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Operator (auto-filled)</p>
            <p className="font-bold text-secondary">{operator?.name} · {empId} · {operator?.companyName}</p>
          </div>
          <Button variant="primary" size="lg" className="w-full" onClick={() => setStep(mode === 'rent' ? 'terms' : 'confirm')}>
            ✓ Simulate QR Scan
          </Button>
        </Card>
      )}

      {step === 'terms' && selected && (
        <Card>
          <h3 className="font-semibold text-secondary mb-4 text-sm uppercase tracking-wide">Rental Terms & Payment</h3>
          <form onSubmit={e => { e.preventDefault(); setStep('confirm'); }} className="space-y-4">
            <div>
              <label className={lbl}>Planned Return Date</label>
              <input type="date" required min={minDateStr} value={checkoutDate} onChange={e => setCheckoutDate(e.target.value)} className={inp} />
            </div>
            {totalDays > 0 && (
              <div className="bg-primary/10 border border-primary/30 rounded-sm p-4 space-y-2 text-sm">
                <p className="font-bold text-secondary uppercase tracking-wide text-xs mb-2">Payment Breakdown</p>
                {[
                  ['Daily rate', `$${dailyRate}/day`],
                  ['Duration', `${totalDays} days`],
                  ['Total rental value', `$${(totalDays * dailyRate).toLocaleString()}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-gray-600">{k}</span><span className="font-semibold">{v}</span></div>
                ))}
                <div className="border-t border-primary/30 pt-2 flex justify-between">
                  <span className="font-bold text-secondary">Advance payment (50%)</span>
                  <span className="font-black text-secondary text-base">${advance.toLocaleString()}</span>
                </div>
              </div>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!checkoutDate}>Review & Confirm</Button>
          </form>
        </Card>
      )}

      {step === 'confirm' && selected && (
        <Card>
          <h3 className="font-semibold text-secondary mb-4 text-sm uppercase tracking-wide">Confirm {mode === 'rent' ? 'Rental' : 'Return'}</h3>

          {mode === 'return' && isOverdue && (
            <div className="bg-orange-50 border border-orange-200 rounded-sm p-3 mb-4">
              <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm mb-2">
                <AlertTriangle size={16} /> Overdue — Extension Charges Apply
              </div>
              <div>
                <label className={lbl}>Engine hours used during extension</label>
                <input type="number" min="0" step="0.1" value={extEngineHours} onChange={e => setExtEngineHours(e.target.value)} placeholder="e.g. 16.5" className={inp} />
              </div>
              {extHours > 0 && <p className="text-sm font-bold text-orange-700 mt-2">Extension charge: ${extensionCharge.toFixed(2)}</p>}
            </div>
          )}

          {mode === 'return' && !isOverdue && activeRental && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-sm p-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Need more time? Request an extension</p>
              <Button variant="ghost" size="sm" onClick={() => setShowExtendModal(true)}>
                Submit Extension Request
              </Button>
            </div>
          )}

          <div className="bg-gray-50 rounded-sm p-4 space-y-2 text-sm mb-4">
            {[
              ['Machine', `${selected.id} — ${selected.model}`],
              ['Operator', `${operator?.name} (${empId})`],
              ['Company', operator?.companyName ?? '—'],
              ...(mode === 'rent'
                ? [['Return date', checkoutDate], ['Duration', `${totalDays} days`], ['Advance payment', `$${advance.toLocaleString()}`]]
                : [['QR code', `${selected.qrCode} → will be invalidated`]]),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="font-semibold text-secondary">{v}</span>
              </div>
            ))}
          </div>
          <Button variant="primary" size="lg" className="w-full" onClick={handleConfirm}>
            {mode === 'rent' ? '✓ Confirm Rental' : '✓ Confirm Return'}
          </Button>
        </Card>
      )}

      {/* Extend request modal */}
      <Modal open={showExtendModal} onClose={() => setShowExtendModal(false)} title={`Request Extension — ${selected?.model}`}>
        {selected && activeRental && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-sm p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Current return date</span><span className="font-semibold">{new Date(activeRental.checkOutDate).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Daily rate</span><span className="font-semibold">${dailyRate}/day</span></div>
            </div>
            <div>
              <label className={lbl}>Requested New Return Date</label>
              <input type="date" value={extendDate} onChange={e => setExtendDate(e.target.value)}
                min={activeRental.checkOutDate.slice(0, 10)}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>Reason (optional)</label>
              <input type="text" value={extendReason} onChange={e => setExtendReason(e.target.value)}
                placeholder="e.g. Project delayed by 5 days" className={inp} />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-sm p-3 text-xs text-blue-700">
              Your request will be reviewed by an admin. The rental date will not change until approved.
            </div>
            <Button variant="primary" size="lg" className="w-full" onClick={handleExtendRequest} disabled={!extendDate}>
              Submit Request
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
