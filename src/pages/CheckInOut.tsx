import { useState, useMemo } from 'react';
import { QrCode, CheckCircle, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui/primitives';
import { useLiveFleet } from '../hooks/useLiveFleet';
import { calcAdvancePayment, calcRentalDays, calcExtensionCharge } from '../lib/business';
import type { Machine } from '../types';

type Mode = 'rent' | 'return';
type Step = 'select' | 'scan' | 'employee' | 'terms' | 'confirm' | 'done';

const DAILY_RATES: Record<string, number> = {
  Excavator: 600, Bulldozer: 700, 'Wheel Loader': 500, 'Motor Grader': 550,
  'Backhoe Loader': 400, Compactor: 350, 'Skid Steer': 300,
  'Articulated Truck': 900, Telehandler: 380,
};

const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-black';
const lbl = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

export default function CheckInOut() {
  const { fleet, checkIn, returnMachine, extendRental } = useLiveFleet();
  const [mode, setMode] = useState<Mode>('rent');
  const [step, setStep] = useState<Step>('select');
  const [selected, setSelected] = useState<Machine | null>(null);
  const [empId, setEmpId] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  const [extEngineHours, setExtEngineHours] = useState('');
  const [newCheckoutDate, setNewCheckoutDate] = useState('');
  const [doneMsg, setDoneMsg] = useState('');

  // Available machines sorted: normal priority first, low priority last
  const availableMachines = useMemo(() =>
    fleet.filter(m => m.status === 'available')
      .sort((a, b) => a.priorityFlag === b.priorityFlag ? 0 : a.priorityFlag === 'low' ? 1 : -1),
    [fleet]);

  const returnableMachines = fleet.filter(m => m.status === 'rented' || m.status === 'due-today' || m.status === 'overdue');

  const dailyRate = selected ? (DAILY_RATES[selected.type] ?? 500) : 0;
  const totalDays = checkoutDate ? calcRentalDays(new Date().toISOString(), checkoutDate) : 0;
  const advance = calcAdvancePayment(totalDays, dailyRate);
  const activeRental = selected?.rentalHistory.find(r => r.status === 'active');
  const isOverdue = activeRental ? Date.now() > new Date(activeRental.checkOutDate).getTime() : false;
  const extHours = parseFloat(extEngineHours) || 0;
  const extensionCharge = selected ? calcExtensionCharge(extHours, selected.fuelRateLitersPerHour, dailyRate) : 0;

  const reset = () => { setStep('select'); setSelected(null); setEmpId(''); setCheckoutDate(''); setExtEngineHours(''); setNewCheckoutDate(''); setDoneMsg(''); };

  const handleConfirm = () => {
    if (!selected) return;
    if (mode === 'rent') {
      checkIn(selected.id, empId || 'EMP-UNKNOWN', checkoutDate, dailyRate);
      setDoneMsg(`${selected.model} rented to ${empId || 'operator'}. Advance: $${advance.toFixed(2)}.`);
    } else {
      returnMachine(selected.id, extHours);
      setDoneMsg(`${selected.model} returned. QR invalidated.${extensionCharge > 0 ? ` Extension charge: $${extensionCharge.toFixed(2)}.` : ''}`);
    }
    setStep('done');
  };

  const handleExtend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !newCheckoutDate) return;
    extendRental(selected.id, newCheckoutDate);
    setDoneMsg(`Rental for ${selected.model} extended to ${newCheckoutDate}.`);
    setStep('done');
  };

  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);
  const steps = mode === 'rent' ? ['select','scan','employee','terms','confirm'] : ['select','scan','employee','confirm'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-secondary uppercase tracking-tight">Check In / Check Out</h1>
        <p className="text-gray-500 text-sm mt-0.5">Multi-step rental transaction flow</p>
      </div>

      {/* Mode toggle */}
      <div className="flex border border-gray-200 overflow-hidden rounded-sm">
        {(['rent','return'] as Mode[]).map(m => (
          <button key={m} onClick={() => { setMode(m); reset(); }}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors focus:outline-none ${mode === m ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            {m === 'rent' ? '📤 Rent Out' : '📥 Return'}
          </button>
        ))}
      </div>

      {/* Step indicator */}
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

      {/* ── DONE ── */}
      {step === 'done' && (
        <Card className="text-center py-10">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
          <p className="font-bold text-secondary text-lg uppercase">{mode === 'rent' ? 'Rented Out!' : 'Returned!'}</p>
          <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">{doneMsg}</p>
          <Button variant="primary" className="mt-6" onClick={reset}>New Transaction</Button>
        </Card>
      )}

      {/* ── SELECT ── */}
      {step === 'select' && (
        <Card>
          <h3 className="font-semibold text-secondary mb-3 text-sm uppercase tracking-wide">
            {mode === 'rent' ? 'Select Available Machine' : 'Select Machine to Return'}
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
              <p className="text-center text-gray-400 py-8 text-sm">No machines available.</p>
            )}
          </div>
        </Card>
      )}

      {/* ── SCAN ── */}
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
          <Button variant="primary" size="lg" className="w-full" onClick={() => setStep('employee')}>
            ✓ Simulate QR Scan
          </Button>
        </Card>
      )}

      {/* ── EMPLOYEE ── */}
      {step === 'employee' && selected && (
        <Card>
          <h3 className="font-semibold text-secondary mb-4 text-sm uppercase tracking-wide">Employee Identification</h3>
          <form onSubmit={e => { e.preventDefault(); setStep(mode === 'rent' ? 'terms' : 'confirm'); }} className="space-y-4">
            <div>
              <label className={lbl}>Employee ID</label>
              <input value={empId} onChange={e => setEmpId(e.target.value)} placeholder="EMP-101 (leave blank for NULL)" className={inp} />
            </div>
            <p className="text-xs text-gray-400">Leave blank to record as NULL operator.</p>
            <Button type="submit" variant="primary" size="lg" className="w-full">Continue</Button>
          </form>
        </Card>
      )}

      {/* ── TERMS (rent only) ── */}
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
                <p className="text-xs text-gray-400">= {totalDays} days × ${dailyRate}/day ÷ 2</p>
              </div>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!checkoutDate}>Review & Confirm</Button>
          </form>
        </Card>
      )}

      {/* ── CONFIRM ── */}
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
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Or extend rental instead</p>
              <form onSubmit={handleExtend} className="flex gap-2">
                <input type="date" min={activeRental.checkOutDate.slice(0, 10)} value={newCheckoutDate}
                  onChange={e => setNewCheckoutDate(e.target.value)} className={inp + ' flex-1'} />
                <Button type="submit" variant="ghost" disabled={!newCheckoutDate}>Extend</Button>
              </form>
            </div>
          )}

          <div className="bg-gray-50 rounded-sm p-4 space-y-2 text-sm mb-4">
            {[
              ['Machine', `${selected.id} — ${selected.model}`],
              ['Operator', empId || 'NULL'],
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
    </div>
  );
}
