import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function timeAgo(date) {
  if (!date) return '';
  const days = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const badgeClass = 'rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] text-gray-300';

export default function ProjectCard({ project, onDelete, onRefresh }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const isGithub = project.source === 'github';
  const myId = user?.id || user?._id;
  const shared = myId && String(project.owner) !== String(myId);
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
      className="group rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5 cursor-pointer transition-all duration-500 ease-fluid hover:-translate-y-1 hover:shadow-lift"
      onClick={() => navigate(`/projects/${project._id}`)}
    >
      <div className="rounded-card-inner h-full bg-gray-900/80 shadow-glass-inset border border-white/10 p-5 transition-colors duration-500 ease-fluid group-hover:border-white/20">
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
            {shared && (
              <span className="rounded-full border border-primary-400/20 bg-primary-600/10 px-2 py-0.5 text-[10px] font-medium text-primary-300 flex-shrink-0">
                shared
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!shared && isGithub && onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh from GitHub"
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-primary-300 hover:bg-white/10 transition-colors duration-500 ease-fluid text-sm leading-none disabled:opacity-50"
              >
                <span className={`inline-block ${refreshing ? 'animate-spin' : ''}`}>↻</span>
              </button>
            )}
            {!shared && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(project._id); }}
              title="Delete project"
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-white/10 transition-colors duration-500 ease-fluid text-lg leading-none"
            >
              ×
            </button>
            )}
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>
        )}

        {isGithub ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {project.github?.language && (
                <span className={badgeClass}>{project.github.language}</span>
              )}
              <span className={`${badgeClass} tabular-nums`}>★ {project.github?.stars ?? 0}</span>
              <span className={`${badgeClass} tabular-nums`}>{project.github?.openIssues ?? 0} issues</span>
              {loc != null && (
                <span className={`${badgeClass} font-mono tabular-nums`}>{loc.toLocaleString()} LOC</span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>updated {timeAgo(project.github?.lastPush)}</span>
              <a
                href={project.github?.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary-400 hover:text-primary-300 transition-colors duration-500 ease-fluid"
              >
                GitHub ↗
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5 tabular-nums">
              <span>{project.doneCount}/{project.taskCount} tasks</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-700 ease-fluid"
                style={{ width: `${progress}%`, backgroundColor: project.color }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
