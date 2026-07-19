const LANG_COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

export default function RepoInsight({ project, onRefresh, refreshing }) {
  const gh = project.github || {};
  const loc = gh.loc;
  const branches = gh.branches || [];
  const topLangs = (loc?.byLanguage || []).slice(0, 6);
  const maxLang = topLangs.reduce((m, l) => Math.max(m, l.lines || 0), 0) || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-reveal" style={{ animationDelay: '60ms' }}>
      <div className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5">
        <div className="rounded-card-inner h-full bg-gray-900/80 shadow-glass-inset border border-white/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-400">Lines of Code</h3>
            {loc?.total != null && (
              <span className="text-xl font-bold tracking-tight tabular-nums font-mono text-white">{loc.total.toLocaleString()}</span>
            )}
          </div>
          {topLangs.length === 0 ? (
            <p className="text-xs text-gray-600 py-2">No LOC data — press Refresh.</p>
          ) : (
            <div className="space-y-2.5">
              {topLangs.map((l, i) => (
                <div key={l.language}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{l.language}</span>
                    <span className="font-mono tabular-nums">{(l.lines || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-700 ease-fluid"
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
      </div>

      <div className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5">
        <div className="rounded-card-inner h-full bg-gray-900/80 shadow-glass-inset border border-white/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-400">Branches</h3>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-1 text-xs font-medium text-gray-300 hover:text-white transition-all duration-500 ease-fluid active:scale-[0.98] disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          {branches.length === 0 ? (
            <p className="text-xs text-gray-600 py-2">No branch data — press Refresh.</p>
          ) : (
            <div className="max-h-56 overflow-y-auto divide-y divide-white/5">
              {branches.map((b) => (
                <div key={b.name} className="flex items-center gap-2 py-2">
                  <span className="text-sm text-white truncate">{b.name}</span>
                  {b.name === gh.defaultBranch && (
                    <span className="text-[11px] text-gray-400 rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5">default</span>
                  )}
                  {b.protected && (
                    <span className="text-[11px] text-primary-300 rounded-full border border-primary-400/20 bg-primary-600/10 px-2 py-0.5">protected</span>
                  )}
                  <span className="ml-auto text-xs text-gray-600 font-mono">{b.sha?.slice(0, 7)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
