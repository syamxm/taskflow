const PRIORITY_STYLES = {
  low: 'border-white/10 bg-white/[0.05] text-gray-400',
  medium: 'border-yellow-500/20 bg-yellow-900/30 text-yellow-400',
  high: 'border-red-500/20 bg-red-900/30 text-red-400',
};

const STATUS_STYLES = {
  todo: 'border-white/10 bg-white/[0.05] text-gray-300',
  'in-progress': 'border-blue-500/20 bg-blue-900/30 text-blue-400',
  done: 'border-green-500/20 bg-green-900/30 text-green-400',
};

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div className="rounded-2xl bg-gray-900/80 border border-white/10 shadow-glass-inset p-4 transition-all duration-500 ease-fluid hover:border-white/20 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={task.status === 'done'}
            onChange={() => onStatusChange(task._id, task.status === 'done' ? 'todo' : 'done')}
            className="mt-1 accent-primary-500 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-sm transition-colors duration-500 ease-fluid ${task.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${PRIORITY_STYLES[task.priority]}`}>
                {task.priority}
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLES[task.status]}`}>
                {task.status}
              </span>
              {task.dueDate && (
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full border tabular-nums ${overdue ? 'border-red-500/20 bg-red-900/30 text-red-400' : 'border-white/10 bg-white/[0.05] text-gray-400'}`}>
                  {overdue ? '⚠ ' : ''}{new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-500 ease-fluid"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors duration-500 ease-fluid"
          >
            Del
          </button>
        </div>
      </div>
    </div>
  );
}
