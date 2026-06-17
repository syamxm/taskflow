import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import ProjectCard from '../components/ProjectCard';
import api from '../api/axios';
import { undoableDelete } from '../lib/undoToast';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

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

  useEffect(() => { fetchProjects(); }, []);

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
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Projects', value: projects.length },
            { label: 'Total Tasks', value: totalTasks },
            { label: 'Completed', value: doneTasks },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Projects</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAll}
              disabled={syncing}
              className="px-4 py-1.5 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {syncing ? 'Refreshing…' : 'Refresh GitHub'}
            </button>
            <button
              onClick={openImport}
              className="px-4 py-1.5 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Import from GitHub
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              + New Project
            </button>
          </div>
        </div>

        {/* Search / sort / filter */}
        {!loading && projects.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className="flex-1 min-w-[12rem] bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
            <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5">
              {[
                { value: 'all', label: 'All' },
                { value: 'github', label: 'GitHub' },
                { value: 'manual', label: 'Custom' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
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
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-primary-500"
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
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
            {reposLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : repos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No repos found. <Link to="/settings" className="text-primary-400 hover:text-primary-300">Check your GitHub connection</Link>.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-800">
                {repos.map((r) => (
                  <div key={r.repoId} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{r.fullName}</div>
                      <div className="text-xs text-gray-500">★ {r.stars} · {r.language || 'n/a'}</div>
                    </div>
                    <button
                      onClick={() => trackRepo(r)}
                      disabled={r.tracked}
                      className="ml-3 px-3 py-1 text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-default text-white bg-primary-600 hover:bg-primary-700"
                    >
                      {r.tracked ? 'Tracked' : 'Track'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New project form */}
        {showForm && (
          <form onSubmit={createProject} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4 space-y-3">
            <input
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              placeholder="Project name *"
            />
            <input
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              placeholder="Description (optional)"
            />
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Color:</span>
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`w-6 h-6 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <button type="submit" className="ml-auto px-4 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
                Create
              </button>
            </div>
          </form>
        )}

        {/* Projects grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📋</p>
            <p>No projects yet. Create one to get started.</p>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>No projects match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleProjects.map((p) => (
              <ProjectCard key={p._id} project={p} onDelete={deleteProject} onRefresh={refreshProject} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
