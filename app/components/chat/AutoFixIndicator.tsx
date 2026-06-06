import { useStore } from '@nanostores/react';
import { autoFixInProgress, autoFixHistory, autoFixHistoryOpen } from '~/lib/stores/autoFix';

export function AutoFixIndicator() {
  const isFixing = useStore(autoFixInProgress);
  const showHistory = useStore(autoFixHistoryOpen);
  const history = useStore(autoFixHistory);

  if (!isFixing && history.length === 0) {
    return null;
  }

  return (
    <>
      {/* Fixing indicator */}
      {isFixing && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm text-purple-500 mb-2">
          <div className="i-svg-spinners:90-ring-with-bg text-sm animate-spin" />
          <span>Auto-fixing error...</span>
        </div>
      )}

      {/* History dialog */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[500px] max-h-[70vh] bg-bolt-elements-background-depth-1 rounded-xl border border-bolt-elements-borderColor shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-bolt-elements-borderColor">
              <h3 className="text-sm font-semibold text-bolt-elements-textPrimary">Auto-Fix History</h3>
              <button
                onClick={() => autoFixHistoryOpen.set(false)}
                className="p-1 hover:bg-bolt-elements-background-depth-2 rounded transition-colors"
              >
                <div className="i-ph:x text-lg text-bolt-elements-item-contentDefault" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {history.length === 0 ? (
                <p className="text-sm text-bolt-elements-textTertiary text-center py-8">No auto-fix attempts yet</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((attempt) => (
                    <div
                      key={attempt.id}
                      className={`p-3 rounded-lg border ${
                        attempt.success ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`text-sm ${
                            attempt.success ? 'i-ph:check-circle text-green-500' : 'i-ph:x-circle text-red-500'
                          }`}
                        />
                        <span className="text-xs text-bolt-elements-textTertiary">
                          {new Date(attempt.timestamp).toLocaleString()}
                        </span>
                        <span className="text-xs text-bolt-elements-textTertiary">({attempt.errorSource})</span>
                      </div>
                      <p className="text-xs text-bolt-elements-textPrimary mb-1 truncate">{attempt.error}</p>
                      {attempt.fixSummary && (
                        <p className="text-xs text-bolt-elements-textTertiary">{attempt.fixSummary}</p>
                      )}
                      {attempt.messages.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1">
                          {attempt.messages.map((msg, i) => (
                            <p key={i} className="text-xs text-bolt-elements-textTertiary">
                              {msg}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
