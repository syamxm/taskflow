import { useNavigate } from 'react-router-dom';

export default function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate();
  const progress = project.taskCount > 0
    ? Math.round((project.doneCount / project.taskCount) * 100)
    : 0;

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors cursor-pointer"
      onClick={() => navigate(`/projects/${project._id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
          <h3 className="font-semibold text-white truncate">{project.name}</h3>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(project._id); }}
          className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      {project.description && (
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{project.doneCount}/{project.taskCount} tasks</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: project.color }}
          />
        </div>
      </div>
    </div>
  );
}
