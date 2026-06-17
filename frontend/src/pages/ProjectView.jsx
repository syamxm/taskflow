import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import RepoInsight from '../components/RepoInsight';
import api from '../api/axios';
import { undoableDelete } from '../lib/undoToast';

const COLUMNS = ['todo', 'in-progress', 'done'];
const COL_LABELS = { todo: 'Todo', 'in-progress': 'In Progress', done: 'Done' };

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

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

  const openEdit = (task) => { setEditTask(task); setModalOpen(true); };
  const openNew = () => { setEditTask(null); setModalOpen(true); };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.priority === filter);

  if (loading) return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-6 w-48 rounded bg-gray-800 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((c) => (
            <div key={c} className="bg-gray-900/50 rounded-xl p-4 space-y-3">
              <div className="h-4 w-24 rounded bg-gray-800 animate-pulse" />
              <div className="h-20 rounded-lg bg-gray-800 animate-pulse" />
              <div className="h-20 rounded-lg bg-gray-800 animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white text-sm transition-colors">
            ← Back
          </button>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project?.color }} />
          <h1 className="text-xl font-bold text-white">{project?.name}</h1>
          {project?.description && <span className="text-sm text-gray-500">{project.description}</span>}
        </div>

        {/* Repo insight */}
        {project?.source === 'github' && (
          <RepoInsight project={project} onRefresh={refreshRepo} refreshing={refreshing} />
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {['all', 'high', 'medium', 'low'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-lg capitalize transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={openNew}
            className="px-4 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
            + New Task
          </button>
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col);
            return (
              <div
                key={col}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); }}
                onDragLeave={() => setDragOverCol((c) => (c === col ? null : c))}
                onDrop={() => handleDrop(col)}
                className={`rounded-xl p-4 transition-colors ${dragOverCol === col ? 'bg-gray-800/60 ring-1 ring-primary-500' : 'bg-gray-900/50'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300">{COL_LABELS[col]}</h3>
                  <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">{colTasks.length}</span>
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
                        className={`cursor-grab active:cursor-grabbing ${draggedId === t._id ? 'opacity-40' : ''}`}
                      >
                        <TaskCard task={t} onEdit={openEdit} onDelete={deleteTask} onStatusChange={changeStatus} />
                      </div>
                    ))
                  )}
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
      />
    </div>
  );
}
