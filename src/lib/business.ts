import type { Machine, FleetAlert, AlertType, UsageLogEntry, ExtendRequest } from '../types';
import { FORECAST_MONTHS, historicalRentalsByType } from '../data/mockData';

export function generateQrCode(machineId: string): string {
  return `QR-${machineId}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function calcAdvancePayment(totalDays: number, dailyRate: number): number {
  return parseFloat((totalDays * dailyRate * 0.5).toFixed(2));
}

export function calcExtensionCharge(extEngineHours: number, fuelRate: number, dailyRate: number): number {
  return parseFloat((extEngineHours * fuelRate * 1.5 + (extEngineHours / 8) * dailyRate).toFixed(2));
}

export function calcRentalDays(checkIn: string, checkOut: string): number {
  return Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000));
}

export function deriveFuelUsed(engineHours: number, fuelRate: number): number {
  return parseFloat((engineHours * fuelRate).toFixed(1));
}

// ── Alert generation ──────────────────────────────────────────────────────────
export function generateAlerts(machines: Machine[]): FleetAlert[] {
  const now = new Date();
  const alerts: FleetAlert[] = [];
  for (const m of machines) {
    const active = m.rentalHistory.find(r => r.status === 'active' || r.status === 'overdue');
    if (!active) continue;
    const diffDays = (new Date(active.checkOutDate).getTime() - now.getTime()) / 86_400_000;
    let type: AlertType | null = null;
    if (diffDays < 0) type = 'overdue';
    else if (diffDays < 1) type = 'return-today';
    else if (diffDays < 2) type = 'return-1-day';
    else if (diffDays < 3) type = 'return-2-day';
    if (!type) continue;
    const due = new Date(active.checkOutDate).toLocaleDateString();
    const msgs: Record<AlertType, string> = {
      overdue: `${m.model} overdue by ${Math.abs(Math.floor(diffDays))} day(s). Extra charges apply.`,
      'return-today': `${m.model} due for return today. Operator: ${active.empId}.`,
      'return-1-day': `${m.model} due for return tomorrow (${due}).`,
      'return-2-day': `${m.model} due for return in 2 days (${due}).`,
    };
    alerts.push({ id: `ALT-${m.id}-${type}`, machineId: m.id, machineName: `${m.model} ${m.type}`, rentalId: active.id, type, message: msgs[type], createdAt: now.toISOString(), acknowledged: false });
  }
  return alerts;
}

// ── Anomaly scoring → sets priorityFlag ──────────────────────────────────────
export interface AnomalyResult { machineId: string; score: number; flagged: boolean; reasons: string[]; }

export function scoreAnomalies(machines: Machine[]): AnomalyResult[] {
  const avgIdle = machines.reduce((s, m) => s + m.idleHoursToday, 0) / machines.length;
  const avgEngine = machines.reduce((s, m) => s + m.engineHoursToday, 0) / machines.length;
  return machines.map(m => {
    const reasons: string[] = [];
    let score = 0;
    const idleRatio = m.engineHoursToday > 0 ? m.idleHoursToday / (m.engineHoursToday + m.idleHoursToday) : 0;
    if (idleRatio > 0.4) { score += 0.4; reasons.push(`High idle ratio: ${(idleRatio * 100).toFixed(0)}%`); }
    if (m.idleHoursToday > avgIdle * 2) { score += 0.3; reasons.push(`Idle ${m.idleHoursToday}h vs avg ${avgIdle.toFixed(1)}h`); }
    if (m.engineHoursToday < avgEngine * 0.3 && m.status === 'rented') { score += 0.3; reasons.push(`Low utilization: ${m.engineHoursToday}h vs avg ${avgEngine.toFixed(1)}h`); }
    return { machineId: m.id, score: Math.min(score, 1), flagged: score >= 0.5, reasons };
  });
}

// ── Machine summary ───────────────────────────────────────────────────────────
export function machineSummary(m: Machine) {
  const totalEngineHours = m.usageLog.reduce((s, l) => s + l.engineHours, 0);
  const totalIdleHours   = m.usageLog.reduce((s, l) => s + l.idleHours, 0);
  const totalFuel        = m.usageLog.reduce((s, l) => s + l.fuelUsed, 0);
  const sites = [...new Set(m.usageLog.map(l => l.site))];
  const totalRentedDays  = m.rentalHistory.reduce((s, r) => s + r.totalDays, 0);
  const byDay: Record<string, { engine: number; idle: number }> = {};
  for (const log of m.usageLog) {
    const day = log.engineStartTime.slice(0, 10);
    if (!byDay[day]) byDay[day] = { engine: 0, idle: 0 };
    byDay[day].engine += log.engineHours;
    byDay[day].idle   += log.idleHours;
  }
  const dailyChart = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date: date.slice(5), engine: v.engine, idle: v.idle }));
  return { totalEngineHours, totalIdleHours, totalFuel, sites, totalRentedDays, dailyChart };
}

// ── Demand forecast (3-month moving average + 3% trend) ──────────────────────
export interface ForecastPoint { month: string; historical: number | null; forecast: number | null; }

export function buildForecast(type: string, windowSize = 3): ForecastPoint[] {
  const history = historicalRentalsByType[type] ?? historicalRentalsByType['Excavator'];
  const result: ForecastPoint[] = history.map(h => ({ month: h.month, historical: h.count, forecast: null }));
  const values = history.map(h => h.count);
  for (const month of FORECAST_MONTHS) {
    const window = values.slice(-windowSize);
    const projected = parseFloat((window.reduce((s, v) => s + v, 0) / window.length * 1.03).toFixed(1));
    values.push(projected);
    result.push({ month, historical: null, forecast: projected });
  }
  return result;
}

// kept for UsageLogEntry type usage
export function engineHoursFromLog(log: UsageLogEntry): number {
  return parseFloat(((new Date(log.engineEndTime).getTime() - new Date(log.engineStartTime).getTime()) / 3_600_000).toFixed(2));
}

// ── Extend request approval ───────────────────────────────────────────────────
// Returns updated machine fleet + updated request (pure, no side effects)
export function approveExtendRequest(
  req: ExtendRequest,
  machines: Machine[],
  resolvedBy: string,
): { updatedMachines: Machine[]; updatedRequest: ExtendRequest } {
  const updatedMachines = machines.map(m => {
    if (m.id !== req.machineId) return m;
    const history = m.rentalHistory.map(r => {
      if (r.status !== 'active') return r;
      const extraDays = Math.ceil(
        (new Date(req.requestedNewCheckoutDate).getTime() - new Date(r.checkOutDate).getTime()) / 86_400_000
      );
      return { ...r, checkOutDate: req.requestedNewCheckoutDate, extended: true, extensionDays: r.extensionDays + extraDays };
    });
    return { ...m, rentalHistory: history };
  });
  const updatedRequest: ExtendRequest = {
    ...req,
    status: 'approved',
    resolvedAt: new Date().toISOString(),
    resolvedBy,
  };
  return { updatedMachines, updatedRequest };
}
