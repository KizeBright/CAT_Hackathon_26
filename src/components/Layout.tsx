import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminNav } from './AdminNav';
import { OperatorNav } from './OperatorNav';

export function AdminLayout() {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/operator" replace />;
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminNav />
      <main className="flex-1">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function OperatorLayout() {
  const { role, operator } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (role !== 'operator') return <Navigate to="/admin" replace />;
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <OperatorNav />
      {/* Operator profile strip */}
      {operator && (
        <div className="bg-black text-white px-4 lg:px-8 py-2 flex items-center gap-4 text-xs">
          <span className="font-bold text-primary uppercase tracking-wide">{operator.name}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-300">{operator.empId}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-300">{operator.companyName}</span>
        </div>
      )}
      <main className="flex-1">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Legacy Layout kept for /settings route
export function Layout() {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  return role === 'admin'
    ? <AdminLayout />
    : <OperatorLayout />;
}
