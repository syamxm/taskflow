import { useState, useEffect } from 'react';

const EMPTY = { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' };

const fieldClass =
  'w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors duration-500 ease-fluid focus:outline-none focus:border-primary-400/60 focus:bg-white/[0.06]';

export default function TaskModal({ isOpen, onClose, onSubmit, task }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, dueDate: form.dueDate || null });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5 animate-modal-in">
        <div className="rounded-card-inner bg-gray-900/90 shadow-glass-inset border border-white/10">
          <div className="flex items-center justify-between pl-7 pr-4 py-4 border-b border-white/5">
            <h2 className="font-bold tracking-tight text-white">{task ? 'Edit Task' : 'New Task'}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-500 ease-fluid text-xl leading-none"
            >
              ×
            </button>
          </div>
          <form onSubmit={submit} className="p-7 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Title *</label>
              <input
                name="title" value={form.title} onChange={handle} required
                className={fieldClass}
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
              <textarea
                name="description" value={form.description} onChange={handle} rows={3}
                className={`${fieldClass} resize-none`}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                <select name="status" value={form.status} onChange={handle} className={fieldClass}>
                  <option value="todo">Todo</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Priority</label>
                <select name="priority" value={form.priority} onChange={handle} className={fieldClass}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Due Date</label>
              <input type="date" name="dueDate" value={form.dueDate} onChange={handle} className={fieldClass} />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-all duration-500 ease-fluid active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-primary-600 hover:bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-500 ease-fluid active:scale-[0.98] shadow-glow"
              >
                {task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
