import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    api.get('/admin/users')
      .then((res) => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [user]);

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="min-h-[100dvh]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8 animate-reveal">
          <span className="inline-block rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium text-primary-300 mb-4">
            Admin
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">Users</h2>
        </div>

        <div className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5 animate-reveal" style={{ animationDelay: '100ms' }}>
          <div className="rounded-card-inner bg-gray-900/80 shadow-glass-inset border border-white/10 p-4 sm:p-6">
            {loading ? (
              <div className="space-y-3 animate-pulse p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 rounded-xl bg-white/[0.06]" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-[0.2em] font-medium text-gray-400">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2 text-right">Projects</th>
                      <th className="px-3 py-2 text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-3 py-3 text-white font-medium whitespace-nowrap">{u.name}</td>
                        <td className="px-3 py-3 text-gray-400 whitespace-nowrap">{u.email}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${
                              u.role === 'admin'
                                ? 'border-primary-400/20 bg-primary-600/10 text-primary-300'
                                : 'border-white/10 bg-white/[0.05] text-gray-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-gray-300">{u.projectCount}</td>
                        <td className="px-3 py-3 text-right text-gray-500 tabular-nums whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
