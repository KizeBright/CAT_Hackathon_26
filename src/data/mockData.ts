import type { Machine, RentalRecord, UsageLogEntry, Operator, Admin } from '../types';

const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const hoursAgo = (h: number) => { const d = new Date(); d.setHours(d.getHours() - h); return d; };

let _rs = 1; const rid = () => `RNT-${String(_rs++).padStart(3, '0')}`;
let _ls = 1; const lid = () => `LOG-${String(_ls++).padStart(3, '0')}`;

function makeLog(machineId: string, empId: string | null, name: string | null, site: string,
  startH: Date, engineH: number, idleH: number, fuelRate: number): UsageLogEntry {
  const end = new Date(startH.getTime() + (engineH + idleH) * 3_600_000);
  return {
    id: lid(), machineId, empId, operatorName: name,
    scanTimestamp: iso(startH), engineStartTime: iso(startH), engineEndTime: iso(end),
    engineHours: engineH, idleHours: idleH,
    fuelUsed: parseFloat((engineH * fuelRate).toFixed(1)), site,
  };
}

function makeRental(machineId: string, empId: string, checkInDaysAgo: number,
  durationDays: number, dailyRate: number, status: RentalRecord['status'],
  extended = false, extensionDays = 0): RentalRecord {
  const checkIn = daysAgo(checkInDaysAgo);
  const planned = new Date(checkIn); planned.setDate(planned.getDate() + durationDays);
  const actual = status === 'completed' ? iso(planned) : null;
  const totalDays = durationDays + extensionDays;
  return {
    id: rid(), machineId, empId,
    checkInDate: iso(checkIn), checkOutDate: iso(planned), actualReturnDate: actual,
    dailyRate, advancePaymentAmount: parseFloat((totalDays * dailyRate * 0.5).toFixed(2)),
    totalDays, extended, extensionDays,
    extraUsageCharge: extended ? parseFloat((extensionDays * 2 * dailyRate).toFixed(2)) : 0,
    status,
  };
}

// ── Usage logs ────────────────────────────────────────────────────────────────
const logs001 = [
  makeLog('CAT-001', 'EMP-101', 'Mike Johnson',  'Downtown Project',   hoursAgo(26), 7.5, 1.2, 18.4),
  makeLog('CAT-001', 'EMP-101', 'Mike Johnson',  'Downtown Project',   hoursAgo(50), 8.0, 0.8, 18.4),
  makeLog('CAT-001', 'EMP-102', 'Alex Turner',   'Metro Line 3',       hoursAgo(74), 6.5, 2.1, 18.4),
];
const logs002 = [
  makeLog('CAT-002', 'EMP-201', 'Sarah Chen',    'Highway 45',         hoursAgo(24), 9.0, 0.5, 22.1),
  makeLog('CAT-002', 'EMP-201', 'Sarah Chen',    'Highway 45',         hoursAgo(48), 8.5, 0.7, 22.1),
];
const logs003 = [
  makeLog('CAT-003', 'EMP-301', 'Tom Rivera',    'Quarry Site B',      hoursAgo(25), 6.0, 3.5, 15.7),
  makeLog('CAT-003', 'EMP-301', 'Tom Rivera',    'Quarry Site B',      hoursAgo(49), 5.5, 4.0, 15.7),
];
const logs007 = [
  makeLog('CAT-007', null,      null,             'Unassigned',         hoursAgo(72), 1.0, 5.5, 6.5),
  makeLog('CAT-007', null,      null,             'Unassigned',         hoursAgo(96), 0.5, 6.0, 6.5),
];
const logs008 = [
  makeLog('CAT-008', 'EMP-501', 'Carlos Mendez', 'Mine Site Alpha',    hoursAgo(22), 10.0, 0.3, 35.6),
  makeLog('CAT-008', 'EMP-501', 'Carlos Mendez', 'Mine Site Alpha',    hoursAgo(46),  9.5, 0.5, 35.6),
];
const logs009 = [
  makeLog('CAT-009', 'EMP-601', 'David Kim',     'Port Expansion',     hoursAgo(23), 8.0, 1.0, 28.9),
];

// ── Rental histories ──────────────────────────────────────────────────────────
const rentals011 = [makeRental('CAT-011', 'EMP-701', 20, 15, 550, 'overdue')];

export const machines: Machine[] = [
  {
    id: 'CAT-001', type: 'Excavator', model: 'CAT 320', status: 'rented',
    currentSite: 'Downtown Project', currentOperatorEmpId: 'EMP-101',
    qrCode: 'QR-CAT001-A7F3', engineHoursTotal: 4320, engineHoursToday: 7.5,
    idleHoursToday: 1.2, fuelConsumedToday: 138.0, fuelRateLitersPerHour: 18.4,
    lastLocation: { lat: 41.8781, lng: -87.6298, timestamp: iso(hoursAgo(1)) },
    rentalHistory: [
      makeRental('CAT-001', 'EMP-101', 14, 30, 600, 'active'),
      makeRental('CAT-001', 'EMP-102', 90, 46, 600, 'completed'),
    ],
    usageLog: logs001, priorityFlag: 'normal',
  },
  {
    id: 'CAT-002', type: 'Bulldozer', model: 'CAT D6', status: 'rented',
    currentSite: 'Highway 45 Expansion', currentOperatorEmpId: 'EMP-201',
    qrCode: 'QR-CAT002-B2E9', engineHoursTotal: 2870, engineHoursToday: 9.0,
    idleHoursToday: 0.5, fuelConsumedToday: 198.9, fuelRateLitersPerHour: 22.1,
    lastLocation: { lat: 41.8827, lng: -87.6233, timestamp: iso(hoursAgo(1)) },
    rentalHistory: [makeRental('CAT-002', 'EMP-201', 20, 46, 700, 'active')],
    usageLog: logs002, priorityFlag: 'normal',
  },
  {
    id: 'CAT-003', type: 'Wheel Loader', model: 'CAT 950', status: 'due-today',
    currentSite: 'Quarry Site B', currentOperatorEmpId: 'EMP-301',
    qrCode: 'QR-CAT003-C5D1', engineHoursTotal: 6100, engineHoursToday: 6.0,
    idleHoursToday: 3.5, fuelConsumedToday: 94.2, fuelRateLitersPerHour: 15.7,
    lastLocation: { lat: 41.8700, lng: -87.6450, timestamp: iso(hoursAgo(2)) },
    rentalHistory: [makeRental('CAT-003', 'EMP-301', 10, 10, 500, 'active')],
    usageLog: logs003, priorityFlag: 'low',
  },
  {
    id: 'CAT-005', type: 'Backhoe Loader', model: 'CAT 420', status: 'available',
    currentSite: 'Depot', currentOperatorEmpId: null,
    qrCode: 'QR-CAT005-E1P7', engineHoursTotal: 1540, engineHoursToday: 0,
    idleHoursToday: 0, fuelConsumedToday: 0, fuelRateLitersPerHour: 9.8,
    lastLocation: { lat: 41.8500, lng: -87.6500, timestamp: iso(daysAgo(1)) },
    rentalHistory: [makeRental('CAT-005', 'EMP-401', 60, 20, 400, 'completed')],
    usageLog: [], priorityFlag: 'normal',
  },
  {
    id: 'CAT-006', type: 'Compactor', model: 'CAT CS56', status: 'available',
    currentSite: 'Depot', currentOperatorEmpId: null,
    qrCode: 'QR-CAT006-F4Q3', engineHoursTotal: 3200, engineHoursToday: 0,
    idleHoursToday: 0, fuelConsumedToday: 0, fuelRateLitersPerHour: 8.2,
    lastLocation: { lat: 41.8600, lng: -87.7000, timestamp: iso(daysAgo(1)) },
    rentalHistory: [], usageLog: [], priorityFlag: 'normal',
  },
  {
    id: 'CAT-007', type: 'Skid Steer', model: 'CAT 262D', status: 'available',
    currentSite: 'Depot', currentOperatorEmpId: null,
    qrCode: 'QR-CAT007-G9R5', engineHoursTotal: 2100, engineHoursToday: 0,
    idleHoursToday: 0, fuelConsumedToday: 0, fuelRateLitersPerHour: 6.5,
    lastLocation: { lat: 41.8900, lng: -87.6100, timestamp: iso(daysAgo(2)) },
    rentalHistory: [], usageLog: logs007, priorityFlag: 'low',
  },
  {
    id: 'CAT-008', type: 'Articulated Truck', model: 'CAT 740', status: 'rented',
    currentSite: 'Mine Site Alpha', currentOperatorEmpId: 'EMP-501',
    qrCode: 'QR-CAT008-H3S8', engineHoursTotal: 5600, engineHoursToday: 10.0,
    idleHoursToday: 0.3, fuelConsumedToday: 356.0, fuelRateLitersPerHour: 35.6,
    lastLocation: { lat: 41.9200, lng: -87.5800, timestamp: iso(hoursAgo(1)) },
    rentalHistory: [makeRental('CAT-008', 'EMP-501', 44, 120, 900, 'active', true, 14)],
    usageLog: logs008, priorityFlag: 'normal',
  },
  {
    id: 'CAT-009', type: 'Excavator', model: 'CAT 390', status: 'rented',
    currentSite: 'Port Expansion', currentOperatorEmpId: 'EMP-601',
    qrCode: 'QR-CAT009-I6T4', engineHoursTotal: 7200, engineHoursToday: 8.0,
    idleHoursToday: 1.0, fuelConsumedToday: 231.2, fuelRateLitersPerHour: 28.9,
    lastLocation: { lat: 41.8300, lng: -87.6700, timestamp: iso(hoursAgo(1)) },
    rentalHistory: [makeRental('CAT-009', 'EMP-601', 5, 90, 800, 'active')],
    usageLog: logs009, priorityFlag: 'normal',
  },
  {
    id: 'CAT-010', type: 'Telehandler', model: 'CAT TH357', status: 'available',
    currentSite: 'Depot', currentOperatorEmpId: null,
    qrCode: 'QR-CAT010-J2U6', engineHoursTotal: 890, engineHoursToday: 0,
    idleHoursToday: 0, fuelConsumedToday: 0, fuelRateLitersPerHour: 7.1,
    lastLocation: { lat: 41.8650, lng: -87.6350, timestamp: iso(daysAgo(1)) },
    rentalHistory: [], usageLog: [], priorityFlag: 'normal',
  },
  {
    id: 'CAT-011', type: 'Motor Grader', model: 'CAT 140', status: 'overdue',
    currentSite: 'Airport Runway', currentOperatorEmpId: 'EMP-701',
    qrCode: 'QR-CAT011-K4M1', engineHoursTotal: 8900, engineHoursToday: 3.2,
    idleHoursToday: 0.8, fuelConsumedToday: 39.4, fuelRateLitersPerHour: 12.3,
    lastLocation: { lat: 41.9742, lng: -87.9073, timestamp: iso(hoursAgo(3)) },
    rentalHistory: rentals011, usageLog: [], priorityFlag: 'normal',
  },
];

// ── Historical rentals per type (for forecast engine) ────────────────────────
export const historicalRentalsByType: Record<string, { month: string; count: number }[]> = {
  Excavator: [
    { month: 'Jan', count: 8 }, { month: 'Feb', count: 7 }, { month: 'Mar', count: 10 },
    { month: 'Apr', count: 12 }, { month: 'May', count: 14 }, { month: 'Jun', count: 13 },
    { month: 'Jul', count: 11 }, { month: 'Aug', count: 12 },
  ],
  Bulldozer: [
    { month: 'Jan', count: 4 }, { month: 'Feb', count: 3 }, { month: 'Mar', count: 5 },
    { month: 'Apr', count: 6 }, { month: 'May', count: 7 }, { month: 'Jun', count: 6 },
    { month: 'Jul', count: 5 }, { month: 'Aug', count: 6 },
  ],
  'Wheel Loader': [
    { month: 'Jan', count: 3 }, { month: 'Feb', count: 4 }, { month: 'Mar', count: 5 },
    { month: 'Apr', count: 5 }, { month: 'May', count: 6 }, { month: 'Jun', count: 5 },
    { month: 'Jul', count: 4 }, { month: 'Aug', count: 5 },
  ],
  'Articulated Truck': [
    { month: 'Jan', count: 2 }, { month: 'Feb', count: 2 }, { month: 'Mar', count: 3 },
    { month: 'Apr', count: 4 }, { month: 'May', count: 5 }, { month: 'Jun', count: 4 },
    { month: 'Jul', count: 3 }, { month: 'Aug', count: 4 },
  ],
};

export const FORECAST_MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

// ── Mock operators ────────────────────────────────────────────────────────────
export const mockOperators: Operator[] = [
  { empId: 'EMP-101', name: 'Mike Johnson',   companyName: 'BuildRight Construction', password: 'pass123' },
  { empId: 'EMP-201', name: 'Sarah Chen',     companyName: 'Highway Solutions LLC',   password: 'pass123' },
  { empId: 'EMP-301', name: 'Tom Rivera',     companyName: 'Quarry Masters Inc.',     password: 'pass123' },
  { empId: 'EMP-501', name: 'Carlos Mendez',  companyName: 'Alpha Mining Corp.',      password: 'pass123' },
  { empId: 'EMP-601', name: 'David Kim',      companyName: 'Port Builders Group',     password: 'pass123' },
  { empId: 'EMP-701', name: 'Linda Torres',   companyName: 'AirSide Contractors',     password: 'pass123' },
];

// ── Mock admins ───────────────────────────────────────────────────────────────
export const mockAdmins: Admin[] = [
  { email: 'admin@catfleet.com',   password: 'admin123', name: 'Fleet Admin' },
  { email: 'manager@catfleet.com', password: 'admin123', name: 'Operations Manager' },
];
