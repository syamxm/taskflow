import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { THEMES, getTheme, setTheme } from '../lib/theme';

export default function Settings() {
  const [status, setStatus] = useState({ connected: false, username: null });
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setThemeState] = useState(getTheme);

  const changeTheme = (value) => {
    setTheme(value);
    setThemeState(value);
  };

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/github/status');
      setStatus(data);
    } catch {
      toast.error('Failed to load GitHub status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const connect = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/github/token', { token });
      setStatus(data);
      setToken('');
      toast.success(`Connected as ${data.username}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect');
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    if (!confirm('Disconnect GitHub? Tracked repos stay but stop syncing.')) return;
    try {
      await api.delete('/github/token');
      setStatus({ connected: false, username: null });
      toast.success('GitHub disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  return (
    <div className="min-h-[100dvh]">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8 animate-reveal">
          <span className="inline-block rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium text-primary-300 mb-4">
            Account
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">Settings</h2>
        </div>

        <div className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5 mb-4 animate-reveal" style={{ animationDelay: '100ms' }}>
          <div className="rounded-card-inner bg-gray-900/80 shadow-glass-inset border border-white/10 p-7">
            <h3 className="font-bold tracking-tight text-white mb-1.5">Appearance</h3>
            <p className="text-sm text-gray-400 mb-6">Theme applies instantly and is remembered on this device.</p>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => changeTheme(t.value)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors duration-500 ease-fluid ${
                    theme === t.value ? 'bg-primary-600 text-white shadow-glow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5 animate-reveal" style={{ animationDelay: '160ms' }}>
          <div className="rounded-card-inner bg-gray-900/80 shadow-glass-inset border border-white/10 p-7">
            <h3 className="font-bold tracking-tight text-white mb-1.5">GitHub</h3>
            <p className="text-sm text-gray-400 mb-6">
              Connect a Personal Access Token (scope <code className="font-mono text-xs text-gray-300 rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5">repo</code> or{' '}
              <code className="font-mono text-xs text-gray-300 rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5">public_repo</code>) to track your repositories.
            </p>

            {loading ? (
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : status.connected ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-gray-300 inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Connected as <span className="text-white font-semibold">{status.username}</span>
                </span>
                <button
                  onClick={disconnect}
                  className="rounded-full border border-red-500/30 bg-red-900/30 hover:bg-red-900/50 px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 transition-all duration-500 ease-fluid active:scale-[0.98]"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <form onSubmit={connect} className="space-y-4">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  placeholder="ghp_..."
                  className="w-full font-mono bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors duration-500 ease-fluid focus:outline-none focus:border-primary-400/60 focus:bg-white/[0.06]"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="group flex items-center gap-2 rounded-full bg-primary-600 hover:bg-primary-500 pl-5 pr-1.5 py-1.5 text-xs font-semibold text-white transition-all duration-500 ease-fluid active:scale-[0.98] shadow-glow disabled:opacity-50"
                >
                  <span>{saving ? 'Connecting…' : 'Connect'}</span>
                  <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-fluid group-hover:translate-x-0.5 group-hover:-translate-y-px">
                    ↗
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
