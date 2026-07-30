export interface LastLocation {
  lat: number;
  lng: number;
  timestamp: string;
}

export type MachineStatus = 'rented' | 'available' | 'due-today' | 'overdue';

export interface Machine {
  id: string;
  type: string;
  model: string;
  status: MachineStatus;
  currentSite: string;
  currentOperatorEmpId: string | null;
  qrCode: string;
  engineHoursTotal: number;
  engineHoursToday: number;
  idleHoursToday: number;
  fuelConsumedToday: number;
  fuelRateLitersPerHour: number;
  lastLocation: LastLocation;
  rentalHistory: RentalRecord[];
  usageLog: UsageLogEntry[];
  priorityFlag: 'normal' | 'low';
}

export type RentalStatus = 'active' | 'completed' | 'overdue';

export interface RentalRecord {
  id: string;
  machineId: string;
  empId: string;
  checkInDate: string;
  checkOutDate: string;
  actualReturnDate: string | null;
  dailyRate: number;
  advancePaymentAmount: number;
  totalDays: number;
  extended: boolean;
  extensionDays: number;
  extraUsageCharge: number;
  status: RentalStatus;
}

export interface UsageLogEntry {
  id: string;
  machineId: string;
  empId: string | null;
  operatorName: string | null;
  scanTimestamp: string;
  engineStartTime: string;
  engineEndTime: string;
  engineHours: number;
  idleHours: number;
  fuelUsed: number;
  site: string;
}

export type AlertType = 'return-2-day' | 'return-1-day' | 'return-today' | 'overdue';

export interface FleetAlert {
  id: string;
  machineId: string;
  machineName: string;
  rentalId: string;
  type: AlertType;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

// ── Auth types ────────────────────────────────────────────────────────────────

export interface Operator {
  empId: string;
  name: string;
  companyName: string;
  password: string;
}

export interface Admin {
  email: string;
  password: string;
  name: string;
}

export type ExtendRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ExtendRequest {
  id: string;
  machineId: string;
  empId: string;
  requestedNewCheckoutDate: string;
  currentCheckoutDate: string;
  reason: string;
  status: ExtendRequestStatus;
  requestedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}
