import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { AdminLayout, OperatorLayout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MachineDetail from './pages/MachineDetail';
import Alerts from './pages/Alerts';
import DemandForecast from './pages/DemandForecast';
import Settings from './pages/Settings';
import ExtendRequests from './pages/admin/ExtendRequests';
import OperatorPortal from './pages/operator/OperatorPortal';
import OperatorCheckInOut from './pages/operator/OperatorCheckInOut';
import OperatorHistory from './pages/operator/OperatorHistory';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin"                   element={<Dashboard />} />
            <Route path="/admin/machine/:id"       element={<MachineDetail />} />
            <Route path="/admin/alerts"            element={<Alerts />} />
            <Route path="/admin/extend-requests"   element={<ExtendRequests />} />
            <Route path="/admin/forecast"          element={<DemandForecast />} />
            <Route path="/admin/settings"          element={<Settings />} />
          </Route>

          {/* Operator routes */}
          <Route element={<OperatorLayout />}>
            <Route path="/operator"                element={<OperatorPortal />} />
            <Route path="/operator/checkin"        element={<OperatorCheckInOut />} />
            <Route path="/operator/history"        element={<OperatorHistory />} />
            <Route path="/operator/machine/:id"    element={<MachineDetail />} />
          </Route>

          {/* Catch-all → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
