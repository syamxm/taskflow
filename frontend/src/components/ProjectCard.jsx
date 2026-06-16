import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function timeAgo(date) {
  if (!date) return '';
  const days = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function ProjectCard({ project, onDelete, onRefresh }) {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const isGithub = project.source === 'github';
  const loc = project.github?.loc?.total;

  const handleRefresh = async (e) => {
    e.stopPropagation();
    setRefreshing(true);
    try {
      await onRefresh(project._id);
    } finally {
      setRefreshing(false);
    }
  };

  const progress = project.taskCount > 0
    ? Math.round((project.doneCount / project.taskCount) * 100)
    : 0;

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors cursor-pointer"
      onClick={() => navigate(`/projects/${project._id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {isGithub ? (
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          ) : (
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
          )}
          <h3 className="font-semibold text-white truncate">{project.name}</h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isGithub && onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh from GitHub"
              className="text-gray-600 hover:text-primary-400 transition-colors text-sm leading-none disabled:opacity-50"
            >
              <span className={`inline-block ${refreshing ? 'animate-spin' : ''}`}>↻</span>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project._id); }}
            className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>
      )}

      {isGithub ? (
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          {project.github?.language && <span>{project.github.language}</span>}
          <span>★ {project.github?.stars ?? 0}</span>
          <span>{project.github?.openIssues ?? 0} issues</span>
          {loc != null && <span>{loc.toLocaleString()} LOC</span>}
          <span className="ml-auto">updated {timeAgo(project.github?.lastPush)}</span>
          <a
            href={project.github?.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-primary-400 hover:text-primary-300"
          >
            GitHub ↗
          </a>
        </div>
      ) : (
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
      )}
    </div>
  );
}
