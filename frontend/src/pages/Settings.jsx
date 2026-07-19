import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function Settings() {
  const [status, setStatus] = useState({ connected: false, username: null });
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 pt-24 pb-16">
        <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-1">GitHub</h3>
          <p className="text-sm text-gray-400 mb-4">
            Connect a Personal Access Token (scope <code className="text-gray-300">repo</code> or{' '}
            <code className="text-gray-300">public_repo</code>) to track your repositories.
          </p>

          {loading ? (
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          ) : status.connected ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">
                Connected as <span className="text-white font-medium">{status.username}</span>
              </span>
              <button
                onClick={disconnect}
                className="px-4 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <form onSubmit={connect} className="space-y-3">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                placeholder="ghp_..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              />
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Connecting…' : 'Connect'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
