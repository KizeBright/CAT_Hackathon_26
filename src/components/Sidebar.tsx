import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, MapPin, Bell, BarChart2, MessageSquare,
  Activity, TrendingUp, ClipboardCheck, Settings, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/equipment', icon: Truck, label: 'Equipment' },
  { to: '/checkin', icon: ClipboardCheck, label: 'Check In/Out' },
  { to: '/map', icon: MapPin, label: 'Live Map' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
  { to: '/health', icon: Activity, label: 'Fleet Health' },
  { to: '/forecast', icon: TrendingUp, label: 'Demand Forecast' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => { localStorage.removeItem('cat_auth'); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-secondary font-black text-sm">CAT</span>
        </div>
        {!collapsed && <span className="font-bold text-white text-sm leading-tight">Fleet Intelligence</span>}
      </div>
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                isActive ? 'bg-primary text-secondary font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
            aria-label={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-800 p-3 space-y-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Logout"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-secondary text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed left-0 top-0 h-full w-56 bg-secondary z-40 transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen bg-secondary sticky top-0 transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'} flex-shrink-0`}>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-6 bg-primary text-secondary rounded-full p-0.5 shadow focus:outline-none focus:ring-2 focus:ring-primary z-10"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={14} /> : <X size={14} />}
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}
