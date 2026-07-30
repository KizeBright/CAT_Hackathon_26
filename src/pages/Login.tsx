import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type LoginRole = 'admin' | 'operator';

export default function Login() {
  const [role, setRole] = useState<LoginRole>('admin');
  const [email, setEmail]       = useState('');
  const [empId, setEmpId]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const { loginAdmin, loginOperator } = useAuth();

  const handleRoleSwitch = (r: LoginRole) => {
    setRole(r); setError(''); setEmail(''); setEmpId(''); setPassword('');
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    if (role === 'admin') {
      if (!email || !/\S+@\S+\.\S+/.test(email)) { setError('Valid email required'); setLoading(false); return; }
      const ok = loginAdmin(email, password);
      if (!ok) { setError('Invalid admin credentials'); setLoading(false); return; }
      navigate('/admin');
    } else {
      if (!empId) { setError('Employee ID required'); setLoading(false); return; }
      const ok = loginOperator(empId, password);
      if (!ok) { setError('Invalid employee ID or password'); setLoading(false); return; }
      navigate('/operator');
    }
  };

  const inp = (err?: boolean) =>
    `w-full px-3 py-2.5 border text-sm focus:outline-none focus:ring-2 focus:ring-black rounded-sm ${err ? 'border-red-400' : 'border-gray-300'}`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 lg:px-12">
        <div className="flex items-center">
          <span className="bg-accent-red text-white text-xs font-black px-2 py-1 tracking-wide uppercase">CAT</span>
          <span className="bg-black text-white text-xs font-bold px-2 py-1 tracking-widest uppercase">Fleet Intelligence</span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Hero panel */}
        <div className="hidden lg:flex flex-1 flex-col justify-between relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #111 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #FFCD11 0, #FFCD11 1px, transparent 0, transparent 40px)', backgroundSize: '56px 56px' }} />
          <div className="relative px-12 pt-16">
            <h1 className="text-5xl font-black text-white uppercase leading-none tracking-tight mb-2">Heavy Equipment</h1>
            <h2 className="text-5xl font-black text-primary uppercase leading-none tracking-tight mb-6">Rental & Fleet</h2>
            <p className="text-gray-400 text-lg max-w-md leading-relaxed">
              Real-time visibility into your entire heavy equipment fleet. Maximize utilization, minimize downtime.
            </p>
          </div>
          <div className="relative px-12 pb-12 grid grid-cols-3 gap-4">
            {[['98%', 'Uptime SLA'], ['2.4x', 'ROI Increase'], ['40%', 'Less Downtime']].map(([val, lbl]) => (
              <div key={lbl} className="bg-white/5 border border-white/10 p-4 rounded-sm">
                <div className="text-primary text-2xl font-black">{val}</div>
                <div className="text-gray-400 text-sm">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Login form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white max-w-lg lg:max-w-none">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center mb-8">
              <span className="bg-accent-red text-white text-xs font-black px-2 py-1 tracking-wide uppercase">CAT</span>
              <span className="bg-black text-white text-xs font-bold px-2 py-1 tracking-widest uppercase">Fleet Intelligence</span>
            </div>

            <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-1">Sign In</h2>
            <p className="text-gray-500 text-sm mb-6">Access your fleet portal</p>

            {/* Role toggle */}
            <div className="flex border border-gray-200 overflow-hidden rounded-sm mb-6">
              {(['admin', 'operator'] as LoginRole[]).map(r => (
                <button key={r} type="button" onClick={() => handleRoleSwitch(r)}
                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors focus:outline-none ${role === r ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                  {r === 'admin' ? '🔑 Admin Login' : '👷 Operator Login'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {role === 'admin' ? (
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="admin@catfleet.com" className={inp()} />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Employee ID</label>
                  <input type="text" value={empId} onChange={e => setEmpId(e.target.value)}
                    placeholder="EMP-101" className={inp()} />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className={inp() + ' pr-10'} />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                    aria-label={showPw ? 'Hide password' : 'Show password'}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full bg-primary text-black font-bold py-3 text-sm uppercase tracking-wide rounded-sm hover:brightness-95 transition-all focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 bg-gray-50 rounded-sm p-3 text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700 uppercase tracking-wide text-xs mb-1">Demo credentials</p>
              <p>Admin: admin@catfleet.com / admin123</p>
              <p>Operator: EMP-101 / pass123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
