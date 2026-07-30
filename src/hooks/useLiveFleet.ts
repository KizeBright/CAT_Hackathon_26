import { useState, useEffect, useCallback } from 'react';
import { machines as initialMachines } from '../data/mockData';
import { generateAlerts, scoreAnomalies, generateQrCode, approveExtendRequest } from '../lib/business';
import type { Machine, FleetAlert, RentalRecord, ExtendRequest } from '../types';

const cloneFleet = (): Machine[] => JSON.parse(JSON.stringify(initialMachines));

export function useLiveFleet() {
  const [fleet, setFleet] = useState<Machine[]>(cloneFleet);
  const [alerts, setAlerts] = useState<FleetAlert[]>([]);
  const [extendRequests, setExtendRequests] = useState<ExtendRequest[]>([]);

  // Recompute alerts + priorityFlag whenever fleet changes
  useEffect(() => {
    setAlerts(generateAlerts(fleet));
    const anomalies = scoreAnomalies(fleet);
    setFleet(prev => prev.map(m => {
      const a = anomalies.find(x => x.machineId === m.id);
      const flag = a?.flagged ? 'low' : 'normal';
      return m.priorityFlag === flag ? m : { ...m, priorityFlag: flag };
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleet.map(m => `${m.engineHoursToday}-${m.idleHoursToday}`).join(',')]);

  // ── Live tick: engine hours + GPS jitter every 5s ─────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setFleet(prev => prev.map(m => {
        if (m.status !== 'rented' && m.status !== 'due-today' && m.status !== 'overdue') return m;
        const dE = parseFloat((Math.random() * 0.002).toFixed(4));
        const dI = parseFloat((Math.random() * 0.0005).toFixed(4));
        return {
          ...m,
          engineHoursToday:  parseFloat((m.engineHoursToday  + dE).toFixed(3)),
          idleHoursToday:    parseFloat((m.idleHoursToday    + dI).toFixed(3)),
          fuelConsumedToday: parseFloat((m.fuelConsumedToday + dE * m.fuelRateLitersPerHour).toFixed(2)),
          lastLocation: {
            lat: parseFloat((m.lastLocation.lat + (Math.random() - 0.5) * 0.0002).toFixed(6)),
            lng: parseFloat((m.lastLocation.lng + (Math.random() - 0.5) * 0.0002).toFixed(6)),
            timestamp: new Date().toISOString(),
          },
        };
      }));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const checkIn = useCallback((machineId: string, empId: string, plannedCheckout: string, dailyRate: number) => {
    setFleet(prev => prev.map(m => {
      if (m.id !== machineId) return m;
      const days = Math.max(1, Math.ceil((new Date(plannedCheckout).getTime() - Date.now()) / 86_400_000));
      const rental: RentalRecord = {
        id: `RNT-${Date.now()}`, machineId, empId,
        checkInDate: new Date().toISOString(), checkOutDate: plannedCheckout,
        actualReturnDate: null, dailyRate,
        advancePaymentAmount: parseFloat((days * dailyRate * 0.5).toFixed(2)),
        totalDays: days, extended: false, extensionDays: 0, extraUsageCharge: 0, status: 'active',
      };
      return { ...m, status: 'rented', currentOperatorEmpId: empId, rentalHistory: [...m.rentalHistory, rental] };
    }));
  }, []);

  const returnMachine = useCallback((machineId: string, extEngineHours = 0) => {
    setFleet(prev => prev.map(m => {
      if (m.id !== machineId) return m;
      const now = new Date().toISOString();
      const history = m.rentalHistory.map(r => {
        if (r.status !== 'active') return r;
        const isLate = Date.now() > new Date(r.checkOutDate).getTime();
        const extra = isLate && extEngineHours > 0
          ? parseFloat((extEngineHours * m.fuelRateLitersPerHour * 1.5 + (extEngineHours / 8) * r.dailyRate).toFixed(2)) : 0;
        return { ...r, actualReturnDate: now, status: 'completed' as const, extended: isLate, extensionDays: isLate ? Math.ceil(extEngineHours / 8) : 0, extraUsageCharge: extra };
      });
      return { ...m, status: 'available', currentOperatorEmpId: null, qrCode: generateQrCode(m.id), rentalHistory: history };
    }));
  }, []);

  const extendRental = useCallback((machineId: string, newCheckout: string) => {
    setFleet(prev => prev.map(m => {
      if (m.id !== machineId) return m;
      const history = m.rentalHistory.map(r => {
        if (r.status !== 'active') return r;
        const extraDays = Math.ceil((new Date(newCheckout).getTime() - new Date(r.checkOutDate).getTime()) / 86_400_000);
        return { ...r, checkOutDate: newCheckout, extended: true, extensionDays: r.extensionDays + extraDays };
      });
      return { ...m, rentalHistory: history };
    }));
  }, []);

  const logUsage = useCallback((machineId: string, empId: string | null, operatorName: string | null, engineHours: number, idleHours: number, site: string) => {
    setFleet(prev => prev.map(m => {
      if (m.id !== machineId) return m;
      const now = new Date();
      const start = new Date(now.getTime() - (engineHours + idleHours) * 3_600_000);
      const entry = {
        id: `LOG-${Date.now()}`, machineId, empId, operatorName,
        scanTimestamp: now.toISOString(), engineStartTime: start.toISOString(), engineEndTime: now.toISOString(),
        engineHours, idleHours, fuelUsed: parseFloat((engineHours * m.fuelRateLitersPerHour).toFixed(1)), site,
      };
      return { ...m, usageLog: [...m.usageLog, entry] };
    }));
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  }, []);

  // ── Extend request actions ────────────────────────────────────────────────
  const submitExtendRequest = useCallback((
    machineId: string,
    empId: string,
    currentCheckoutDate: string,
    requestedNewCheckoutDate: string,
    reason: string,
  ) => {
    const req: ExtendRequest = {
      id: `EXT-${Date.now()}`,
      machineId, empId,
      requestedNewCheckoutDate, currentCheckoutDate,
      reason, status: 'pending',
      requestedAt: new Date().toISOString(),
      resolvedAt: null, resolvedBy: null,
    };
    setExtendRequests(prev => [...prev, req]);
  }, []);

  const resolveExtendRequest = useCallback((reqId: string, action: 'approved' | 'rejected', resolvedBy: string) => {
    setExtendRequests(prev => prev.map(r => {
      if (r.id !== reqId) return r;
      if (action === 'rejected') {
        return { ...r, status: 'rejected', resolvedAt: new Date().toISOString(), resolvedBy };
      }
      // approved: update fleet via pure function
      setFleet(fleet => {
        const { updatedMachines, updatedRequest } = approveExtendRequest(r, fleet, resolvedBy);
        // also clear related overdue alert if no longer overdue
        setAlerts(alerts => alerts.map(a => {
          if (a.machineId !== r.machineId || a.type !== 'overdue') return a;
          const newDiff = new Date(updatedRequest.requestedNewCheckoutDate).getTime() - Date.now();
          return newDiff > 0 ? { ...a, acknowledged: true } : a;
        }));
        return updatedMachines;
      });
      return { ...r, status: 'approved', resolvedAt: new Date().toISOString(), resolvedBy };
    }));
  }, []);

  return {
    fleet, alerts, extendRequests,
    checkIn, returnMachine, extendRental, logUsage, acknowledgeAlert,
    submitExtendRequest, resolveExtendRequest,
  };
}
