import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import RepoInsight from '../components/RepoInsight';
import api from '../api/axios';
import { undoableDelete } from '../lib/undoToast';
import { useAuth } from '../context/AuthContext';

const COLUMNS = ['todo', 'in-progress', 'done'];
const COL_LABELS = { todo: 'Todo', 'in-progress': 'In Progress', done: 'Done' };

const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviting, setInviting] = useState(false);

  const myId = String(user?.id || user?._id || '');
  const isOwner = project && String(project.owner?._id) === myId;
  const participants = project ? [project.owner, ...(project.members || [])].filter(Boolean) : [];

  const fetchData = async () => {
    try {
      const [proj, taskList] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
      ]);
      setProject(proj.data);
      setTasks(taskList.data);
    } catch {
      toast.error('Project not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const createTask = async (form) => {
    try {
      const { data } = await api.post('/tasks', { ...form, project: id });
      setTasks([data, ...tasks]);
      setModalOpen(false);
      toast.success('Task created');
    } catch {
      toast.error('Failed to create task');
    }
  };

  const updateTask = async (form) => {
    try {
      const { data } = await api.put(`/tasks/${editTask._id}`, form);
      setTasks(tasks.map((t) => (t._id === data._id ? data : t)));
      setEditTask(null);
      setModalOpen(false);
      toast.success('Task updated');
    } catch {
      toast.error('Failed to update task');
    }
  };

  const deleteTask = (taskId) => {
    const idx = tasks.findIndex((t) => t._id === taskId);
    if (idx === -1) return;
    const target = tasks[idx];
    undoableDelete({
      label: 'Task',
      onRemove: () => setTasks((cur) => cur.filter((t) => t._id !== taskId)),
      onRestore: () => setTasks((cur) => {
        if (cur.some((t) => t._id === taskId)) return cur;
        const next = [...cur];
        next.splice(idx, 0, target);
        return next;
      }),
      commit: () => api.delete(`/tasks/${taskId}`),
    });
  };

  const changeStatus = async (taskId, status) => {
    const prev = tasks;
    setTasks((cur) => cur.map((t) => (t._id === taskId ? { ...t, status } : t)));
    try {
      await api.put(`/tasks/${taskId}`, { status });
    } catch {
      setTasks(prev);
      toast.error('Failed to update status');
    }
  };

  const handleDrop = (col) => {
    setDragOverCol(null);
    const task = tasks.find((t) => t._id === draggedId);
    setDraggedId(null);
    if (task && task.status !== col) changeStatus(task._id, col);
  };

  const refreshRepo = async () => {
    setRefreshing(true);
    try {
      const { data } = await api.post(`/github/sync/${id}`);
      setProject(data);
      toast.success('Refreshed from GitHub');
    } catch {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post(`/projects/${id}/invite`, { query: inviteQuery });
      toast.success('Invite sent');
      setInviteQuery('');
      setShowInvite(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (memberId) => {
    if (!confirm('Remove this member? Their tasks stay but become unassigned.')) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      toast.success('Member removed');
      fetchData();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const openEdit = (task) => { setEditTask(task); setModalOpen(true); };
  const openNew = () => { setEditTask(null); setModalOpen(true); };

  const filtered = tasks
    .filter((t) => filter === 'all' || t.priority === filter)
    .filter((t) => assigneeFilter === 'all' || String(t.assignee?._id || t.assignee || '') === myId);

  if (loading) return (
    <div className="min-h-[100dvh]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <div className="h-7 w-48 rounded-full bg-white/[0.06] animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((c) => (
            <div key={c} className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5">
              <div className="rounded-card-inner bg-gray-900/40 border border-white/5 p-4 space-y-3 animate-pulse">
                <div className="h-4 w-24 rounded-full bg-white/[0.06]" />
                <div className="h-20 rounded-2xl bg-white/[0.06]" />
                <div className="h-20 rounded-2xl bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-[100dvh]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-8 animate-reveal">
          <button
            onClick={() => navigate('/')}
            title="Back to dashboard"
            className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-500 ease-fluid active:scale-[0.98]"
          >
            ←
          </button>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project?.color }} />
          <h1 className="text-2xl font-bold tracking-tight text-white">{project?.name}</h1>
          {project?.description && <span className="text-sm text-gray-500">{project.description}</span>}
        </div>

        {/* Members */}
        <div className="flex flex-wrap items-center gap-2 mb-8 animate-reveal" style={{ animationDelay: '60ms' }}>
          {participants.map((p) => {
            const isProjectOwner = String(p._id) === String(project?.owner?._id);
            return (
              <span
                key={p._id}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] pl-1 pr-3 py-1"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold ${
                    isProjectOwner ? 'bg-primary-600/20 text-primary-300' : 'bg-white/[0.06] text-gray-300'
                  }`}
                >
                  {initials(p.name)}
                </span>
                <span className="text-xs text-gray-300">{p.name}</span>
                {isProjectOwner && <span className="text-[10px] text-gray-500">owner</span>}
                {isOwner && !isProjectOwner && (
                  <button
                    onClick={() => removeMember(p._id)}
                    title="Remove member"
                    className="text-gray-500 hover:text-red-400 transition-colors duration-500 ease-fluid text-sm leading-none"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
          {(project?.pendingInvites || []).map((p) => (
            <span
              key={p._id}
              className="inline-flex items-center gap-2 rounded-full border border-dashed border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-gray-500"
            >
              {p.name} · pending
            </span>
          ))}
          {isOwner && (
            showInvite ? (
              <form onSubmit={sendInvite} className="inline-flex items-center gap-2">
                <input
                  value={inviteQuery}
                  onChange={(e) => setInviteQuery(e.target.value)}
                  required
                  autoFocus
                  placeholder="Username or email"
                  className="w-44 bg-white/[0.04] border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white placeholder-gray-500 transition-colors duration-500 ease-fluid focus:outline-none focus:border-primary-400/60 focus:bg-white/[0.06]"
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="rounded-full bg-primary-600 hover:bg-primary-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-all duration-500 ease-fluid active:scale-[0.98] disabled:opacity-50"
                >
                  {inviting ? 'Inviting…' : 'Invite'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="text-gray-500 hover:text-white transition-colors duration-500 ease-fluid text-sm leading-none px-1"
                >
                  ×
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowInvite(true)}
                className="rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white transition-all duration-500 ease-fluid active:scale-[0.98]"
              >
                + Invite
              </button>
            )
          )}
        </div>

        {/* Repo insight */}
        {project?.source === 'github' && (
          <RepoInsight project={project} onRefresh={isOwner ? refreshRepo : null} refreshing={refreshing} />
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 animate-reveal" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1">
              {['all', 'high', 'medium', 'low'].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-full capitalize transition-colors duration-500 ease-fluid ${
                    filter === f ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1">
              {[
                { value: 'all', label: 'All tasks' },
                { value: 'mine', label: 'My tasks' },
              ].map((f) => (
                <button key={f.value} onClick={() => setAssigneeFilter(f.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-500 ease-fluid ${
                    assigneeFilter === f.value ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openNew}
            className="group flex items-center gap-2 rounded-full bg-primary-600 hover:bg-primary-500 pl-4 pr-1.5 py-1.5 text-xs font-semibold text-white transition-all duration-500 ease-fluid active:scale-[0.98] shadow-glow"
          >
            <span>New Task</span>
            <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-fluid group-hover:rotate-90">
              +
            </span>
          </button>
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-reveal" style={{ animationDelay: '160ms' }}>
          {COLUMNS.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col);
            return (
              <div
                key={col}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); }}
                onDragLeave={() => setDragOverCol((c) => (c === col ? null : c))}
                onDrop={() => handleDrop(col)}
                className={`rounded-card p-1.5 transition-all duration-500 ease-fluid ${
                  dragOverCol === col
                    ? 'bg-white/[0.04] ring-1 ring-primary-400/60 shadow-glow'
                    : 'bg-white/[0.02] ring-1 ring-white/5'
                }`}
              >
                <div className="rounded-card-inner bg-gray-900/40 border border-white/5 p-4 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-400">{COL_LABELS[col]}</h3>
                    <span className="text-xs text-gray-400 tabular-nums rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[3rem]">
                    {colTasks.length === 0 ? (
                      <p className="text-xs text-gray-600 text-center py-4">{draggedId ? 'Drop here' : 'No tasks'}</p>
                    ) : (
                      colTasks.map((t) => (
                        <div
                          key={t._id}
                          draggable
                          onDragStart={() => setDraggedId(t._id)}
                          onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                          className={`cursor-grab active:cursor-grabbing transition-opacity duration-300 ${draggedId === t._id ? 'opacity-40' : ''}`}
                        >
                          <TaskCard task={t} onEdit={openEdit} onDelete={deleteTask} onStatusChange={changeStatus} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        onSubmit={editTask ? updateTask : createTask}
        task={editTask}
        participants={participants}
      />
    </div>
  );
}
