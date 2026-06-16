const LANG_COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

export default function RepoInsight({ project, onRefresh, refreshing }) {
  const gh = project.github || {};
  const loc = gh.loc;
  const branches = gh.branches || [];
  const topLangs = (loc?.byLanguage || []).slice(0, 6);
  const maxLang = topLangs.reduce((m, l) => Math.max(m, l.lines || 0), 0) || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">Lines of Code</h3>
          {loc?.total != null && (
            <span className="text-lg font-bold text-white">{loc.total.toLocaleString()}</span>
          )}
        </div>
        {topLangs.length === 0 ? (
          <p className="text-xs text-gray-600 py-2">No LOC data — press Refresh.</p>
        ) : (
          <div className="space-y-2">
            {topLangs.map((l, i) => (
              <div key={l.language}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{l.language}</span>
                  <span>{(l.lines || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${Math.round(((l.lines || 0) / maxLang) * 100)}%`,
                      backgroundColor: LANG_COLORS[i % LANG_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">Branches</h3>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="px-3 py-1 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {branches.length === 0 ? (
          <p className="text-xs text-gray-600 py-2">No branch data — press Refresh.</p>
        ) : (
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-800">
            {branches.map((b) => (
              <div key={b.name} className="flex items-center gap-2 py-2">
                <span className="text-sm text-white truncate">{b.name}</span>
                {b.name === gh.defaultBranch && (
                  <span className="text-xs text-gray-400 bg-gray-800 rounded-full px-2 py-0.5">default</span>
                )}
                {b.protected && (
                  <span className="text-xs text-primary-400 bg-gray-800 rounded-full px-2 py-0.5">protected</span>
                )}
                <span className="ml-auto text-xs text-gray-600 font-mono">{b.sha?.slice(0, 7)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
