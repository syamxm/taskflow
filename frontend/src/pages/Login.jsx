import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10 animate-reveal">
          <span className="inline-block rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium text-primary-300 mb-5">
            Workspace
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">TaskFlow</h1>
          <p className="text-sm text-gray-400">Sign in to your workspace</p>
        </div>

        <div className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5 animate-reveal" style={{ animationDelay: '120ms' }}>
          <form onSubmit={submit} className="rounded-card-inner bg-gray-900/80 shadow-glass-inset border border-white/10 p-7 space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input type="email" name="email" value={form.email} onChange={handle} required
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors duration-500 ease-fluid focus:outline-none focus:border-primary-400/60 focus:bg-white/[0.06]"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input type="password" name="password" value={form.password} onChange={handle} required
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors duration-500 ease-fluid focus:outline-none focus:border-primary-400/60 focus:bg-white/[0.06]"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="group w-full flex items-center justify-between rounded-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 pl-6 pr-1.5 py-1.5 text-sm font-semibold text-white transition-all duration-500 ease-fluid active:scale-[0.98] shadow-glow">
              <span>{loading ? 'Signing in…' : 'Sign In'}</span>
              <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-fluid group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
                ↗
              </span>
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6 animate-reveal" style={{ animationDelay: '240ms' }}>
          No account?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300 transition-colors duration-500 ease-fluid">Register</Link>
        </p>
      </div>
    </div>
  );
}
