import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { mockAdmins, mockOperators } from '../data/mockData';
import type { Operator } from '../types';

type Role = 'admin' | 'operator';

interface AuthState {
  role: Role | null;
  adminName: string | null;
  operator: Operator | null;
}

interface AuthContextValue extends AuthState {
  loginAdmin: (email: string, password: string) => boolean;
  loginOperator: (empId: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'cat_auth_v2';

function loadState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { role: null, adminName: null, operator: null };
}

function saveState(s: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadState);

  const loginAdmin = useCallback((email: string, password: string): boolean => {
    const admin = mockAdmins.find(a => a.email === email && a.password === password);
    if (!admin) return false;
    const next: AuthState = { role: 'admin', adminName: admin.name, operator: null };
    setState(next); saveState(next);
    return true;
  }, []);

  const loginOperator = useCallback((empId: string, password: string): boolean => {
    const op = mockOperators.find(o => o.empId === empId && o.password === password);
    if (!op) return false;
    const next: AuthState = { role: 'operator', adminName: null, operator: op };
    setState(next); saveState(next);
    return true;
  }, []);

  const logout = useCallback(() => {
    const next: AuthState = { role: null, adminName: null, operator: null };
    setState(next);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('cat_auth'); // clear legacy key too
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, loginAdmin, loginOperator, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
