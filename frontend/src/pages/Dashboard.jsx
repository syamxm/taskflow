import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import ProjectCard from '../components/ProjectCard';
import api from '../api/axios';
import { undoableDelete } from '../lib/undoToast';
import { SkeletonGrid } from '../components/Skeleton';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

const inputClass =
  'w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors duration-500 ease-fluid focus:outline-none focus:border-primary-400/60 focus:bg-white/[0.06]';

const ghostButtonClass =
  'rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2 text-xs font-medium text-gray-300 hover:text-white transition-all duration-500 ease-fluid active:scale-[0.98] disabled:opacity-50';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [showImport, setShowImport] = useState(false);
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [filter, setFilter] = useState('all');
  const [invites, setInvites] = useState([]);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const { data } = await api.get('/projects/invites');
      setInvites(data);
    } catch {
      setInvites([]);
    }
  };

  useEffect(() => { fetchProjects(); fetchInvites(); }, []);

  const respondInvite = async (projectId, action) => {
    try {
      await api.post(`/projects/${projectId}/invites/${action}`);
      setInvites((cur) => cur.filter((i) => i._id !== projectId));
      if (action === 'accept') {
        toast.success('Joined project');
        fetchProjects();
      }
    } catch {
      toast.error('Failed to respond to invite');
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/projects', form);
      setProjects([{ ...data, taskCount: 0, doneCount: 0 }, ...projects]);
      setForm({ name: '', description: '', color: COLORS[0] });
      setShowForm(false);
      toast.success('Project created');
    } catch {
      toast.error('Failed to create project');
    }
  };

  const openImport = async () => {
    if (showImport) { setShowImport(false); return; }
    setShowImport(true);
    setReposLoading(true);
    try {
      const { data } = await api.get('/github/repos');
      setRepos(data);
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('Connect GitHub in Settings first');
        setShowImport(false);
      } else {
        toast.error('Failed to load repos');
      }
    } finally {
      setReposLoading(false);
    }
  };

  const trackRepo = async (repo) => {
    try {
      const { data } = await api.post('/github/track', repo);
      setProjects([{ ...data, taskCount: 0, doneCount: 0 }, ...projects]);
      setRepos(repos.map((r) => (r.repoId === repo.repoId ? { ...r, tracked: true } : r)));
      toast.success('Repo tracked');
    } catch {
      toast.error('Failed to track repo');
    }
  };

  const refreshProject = async (id) => {
    try {
      const { data } = await api.post(`/github/sync/${id}`);
      setProjects(projects.map((p) =>
        p._id === id ? { ...data, taskCount: p.taskCount, doneCount: p.doneCount } : p
      ));
      toast.success('Refreshed from GitHub');
    } catch {
      toast.error('Failed to refresh');
    }
  };

  const refreshAll = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/github/sync-all');
      await fetchProjects();
      toast.success(`Synced ${data.synced} project${data.synced === 1 ? '' : 's'}`);
    } catch (err) {
      if (err.response?.status === 400) toast.error('Connect GitHub in Settings first');
      else toast.error('Failed to sync');
    } finally {
      setSyncing(false);
    }
  };

  const deleteProject = (id) => {
    const idx = projects.findIndex((p) => p._id === id);
    if (idx === -1) return;
    const target = projects[idx];
    undoableDelete({
      label: 'Project',
      onRemove: () => setProjects((cur) => cur.filter((p) => p._id !== id)),
      onRestore: () => setProjects((cur) => {
        if (cur.some((p) => p._id === id)) return cur;
        const next = [...cur];
        next.splice(idx, 0, target);
        return next;
      }),
      commit: () => api.delete(`/projects/${id}`),
    });
  };

  const totalTasks = projects.reduce((a, p) => a + p.taskCount, 0);
  const doneTasks = projects.reduce((a, p) => a + p.doneCount, 0);

  const visibleProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    const updatedAt = (p) => new Date(p.github?.lastPush || p.updatedAt || 0).getTime();
    return projects
      .filter((p) => filter === 'all' || p.source === filter)
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => {
        switch (sortBy) {
          case 'name': return a.name.localeCompare(b.name);
          case 'stars': return (b.github?.stars ?? 0) - (a.github?.stars ?? 0);
          case 'tasks': return b.taskCount - a.taskCount;
          default: return updatedAt(b) - updatedAt(a);
        }
      });
  }, [projects, query, sortBy, filter]);

  return (
    <div className="min-h-[100dvh]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Stats bento */}
        <div className="grid gap-3 md:grid-cols-2 mb-12 animate-reveal">
          <div className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5">
            <div className="rounded-card-inner h-full bg-gray-900/80 shadow-glass-inset border border-white/10 p-7 flex flex-col justify-between gap-6">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium text-primary-300 w-max">
                Projects
              </span>
              <div className="text-6xl font-extrabold tracking-tight tabular-nums text-white">{projects.length}</div>
            </div>
          </div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-1">
            {[
              { label: 'Total Tasks', value: totalTasks },
              { label: 'Completed', value: doneTasks },
            ].map((s) => (
              <div key={s.label} className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5">
                <div className="rounded-card-inner h-full bg-gray-900/80 shadow-glass-inset border border-white/10 px-6 py-5 flex flex-col justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500">{s.label}</span>
                  <div className="text-3xl font-extrabold tracking-tight tabular-nums text-white">{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5 mb-5 animate-reveal" style={{ animationDelay: '60ms' }}>
            <div className="rounded-card-inner bg-gray-900/80 shadow-glass-inset border border-white/10 p-5">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-medium text-primary-300 mb-4">Invites</h3>
              <div className="divide-y divide-white/5">
                {invites.map((inv) => (
                  <div key={inv._id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: inv.color }} />
                    <span className="text-sm text-white font-medium truncate">{inv.name}</span>
                    <span className="text-xs text-gray-500">from {inv.owner?.name}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => respondInvite(inv._id, 'accept')}
                        className="rounded-full bg-primary-600 hover:bg-primary-500 px-3.5 py-1 text-xs font-semibold text-white transition-all duration-500 ease-fluid active:scale-[0.98]"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondInvite(inv._id, 'decline')}
                        className="rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-1 text-xs font-medium text-gray-300 hover:text-white transition-all duration-500 ease-fluid active:scale-[0.98]"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 animate-reveal" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xl font-bold tracking-tight text-white">Projects</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={refreshAll} disabled={syncing} className={ghostButtonClass}>
              {syncing ? 'Refreshing…' : 'Refresh GitHub'}
            </button>
            <button onClick={openImport} className={ghostButtonClass}>
              Import from GitHub
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="group flex items-center gap-2 rounded-full bg-primary-600 hover:bg-primary-500 pl-4 pr-1.5 py-1.5 text-xs font-semibold text-white transition-all duration-500 ease-fluid active:scale-[0.98] shadow-glow"
            >
              <span>New Project</span>
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-fluid group-hover:rotate-90">
                +
              </span>
            </button>
          </div>
        </div>

        {/* Search / sort / filter */}
        {!loading && projects.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5 animate-reveal" style={{ animationDelay: '160ms' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className="flex-1 min-w-[12rem] bg-white/[0.04] border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 transition-colors duration-500 ease-fluid focus:outline-none focus:border-primary-400/60 focus:bg-white/[0.06]"
            />
            <div className="flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1">
              {[
                { value: 'all', label: 'All' },
                { value: 'github', label: 'GitHub' },
                { value: 'manual', label: 'Custom' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-500 ease-fluid ${
                    filter === opt.value ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/[0.04] border border-white/10 rounded-full px-4 py-2 text-xs font-medium text-gray-300 transition-colors duration-500 ease-fluid focus:outline-none focus:border-primary-400/60"
            >
              <option value="updated">Recently updated</option>
              <option value="name">Name</option>
              <option value="stars">Stars</option>
              <option value="tasks">Task count</option>
            </select>
          </div>
        )}

        {/* Import from GitHub */}
        {showImport && (
          <div className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5 mb-5 animate-reveal">
            <div className="rounded-card-inner bg-gray-900/80 shadow-glass-inset border border-white/10 p-5">
              {reposLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : repos.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No repos found. <Link to="/settings" className="text-primary-400 hover:text-primary-300">Check your GitHub connection</Link>.
                </p>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                  {repos.map((r) => (
                    <div key={r.repoId} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{r.fullName}</div>
                        <div className="text-xs text-gray-500 tabular-nums">★ {r.stars} · {r.language || 'n/a'}</div>
                      </div>
                      <button
                        onClick={() => trackRepo(r)}
                        disabled={r.tracked}
                        className="ml-3 rounded-full bg-primary-600 hover:bg-primary-500 px-3.5 py-1 text-xs font-semibold text-white transition-all duration-500 ease-fluid active:scale-[0.98] disabled:opacity-50 disabled:cursor-default"
                      >
                        {r.tracked ? 'Tracked' : 'Track'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* New project form */}
        {showForm && (
          <div className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5 mb-5 animate-reveal">
            <form onSubmit={createProject} className="rounded-card-inner bg-gray-900/80 shadow-glass-inset border border-white/10 p-5 space-y-3">
              <input
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className={inputClass}
                placeholder="Project name *"
              />
              <input
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass}
                placeholder="Description (optional)"
              />
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Color:</span>
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className={`w-6 h-6 rounded-full transition-transform duration-500 ease-fluid ${form.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <button type="submit" className="ml-auto rounded-full bg-primary-600 hover:bg-primary-500 px-5 py-1.5 text-xs font-semibold text-white transition-all duration-500 ease-fluid active:scale-[0.98]">
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects grid */}
        {loading ? (
          <SkeletonGrid />
        ) : projects.length === 0 ? (
          <div className="text-center py-24 animate-reveal">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-lg font-semibold text-white mb-1">No projects yet</p>
            <p className="text-sm text-gray-500 mb-6">Create one or import a repo from GitHub to get started.</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="rounded-full bg-primary-600 hover:bg-primary-500 px-5 py-2 text-xs font-semibold text-white transition-all duration-500 ease-fluid active:scale-[0.98] shadow-glow"
              >
                + New Project
              </button>
              <button onClick={openImport} className={ghostButtonClass}>
                Import from GitHub
              </button>
            </div>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <p>No projects match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-reveal" style={{ animationDelay: '220ms' }}>
            {visibleProjects.map((p) => (
              <ProjectCard key={p._id} project={p} onDelete={deleteProject} onRefresh={refreshProject} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
