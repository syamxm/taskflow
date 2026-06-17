const PRIORITY_STYLES = {
  low: 'bg-gray-800 text-gray-400',
  medium: 'bg-yellow-900/40 text-yellow-400',
  high: 'bg-red-900/40 text-red-400',
};

const STATUS_STYLES = {
  todo: 'bg-gray-800 text-gray-300',
  'in-progress': 'bg-blue-900/40 text-blue-400',
  done: 'bg-green-900/40 text-green-400',
};

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={task.status === 'done'}
            onChange={() => onStatusChange(task._id, task.status === 'done' ? 'todo' : 'done')}
            className="mt-1 accent-primary-500 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>
                {task.priority}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status]}`}>
                {task.status}
              </span>
              {task.dueDate && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${overdue ? 'bg-red-900/40 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                  {overdue ? '⚠ ' : ''}{new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onEdit(task)} className="px-2 py-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 text-xs transition-colors">Edit</button>
          <button onClick={() => onDelete(task._id)} className="px-2 py-0.5 rounded text-gray-400 hover:text-red-400 hover:bg-gray-800 text-xs transition-colors">Del</button>
        </div>
      </div>
    </div>
  );
}
