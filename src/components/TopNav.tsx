import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User } from 'lucide-react';

const navLinks = [
  { to: '/',        label: 'Dashboard',   end: true },
  { to: '/checkin', label: 'Check In/Out' },
  { to: '/alerts',  label: 'Alerts' },
  { to: '/forecast',label: 'Forecast' },
];

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('cat_auth'); navigate('/login'); };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
        <div className="flex items-center h-14 gap-6">
          <NavLink to="/" className="flex items-center flex-shrink-0 mr-4" aria-label="Home">
            <span className="bg-accent-red text-white text-xs font-black px-2 py-1 tracking-wide uppercase">CAT</span>
            <span className="bg-black text-white text-xs font-bold px-2 py-1 tracking-widest uppercase whitespace-nowrap">Fleet Intelligence</span>
          </NavLink>

          <nav className="hidden lg:flex items-center gap-1 flex-1" aria-label="Main navigation">
            {navLinks.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus:underline ${isActive ? 'text-black border-b-2 border-black' : 'text-gray-600 hover:text-black'}`
                }>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-1 ml-auto">
            <NavLink to="/settings" className="p-2 text-gray-700 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded" aria-label="Settings">
              <User size={18} strokeWidth={1.75} />
            </NavLink>
            <button onClick={handleLogout} className="p-2 text-gray-700 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded" aria-label="Logout">
              <LogOut size={18} strokeWidth={1.75} />
            </button>
          </div>

          <button className="lg:hidden ml-auto p-2 text-gray-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-primary rounded"
            onClick={() => setMobileOpen(o => !o)} aria-label="Toggle navigation">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 text-sm font-medium rounded transition-colors ${isActive ? 'bg-primary text-black' : 'text-gray-700 hover:bg-gray-50'}`
                }>
                {label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded">
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
