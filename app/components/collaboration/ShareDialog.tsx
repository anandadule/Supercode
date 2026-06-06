import { useStore } from '@nanostores/react';
import { memo, useCallback, useState } from 'react';
import { collaboratorCount, isCollaborating } from '~/lib/stores/collaboration';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';

interface ShareDialogProps {
  onClose: () => void;
}

export const ShareDialog = memo(({ onClose }: ShareDialogProps) => {
  const count = useStore(collaboratorCount);
  const connected = useStore(isCollaborating);
  const [copied, setCopied] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [currentUrl]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md mx-4 rounded-xl bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bolt-elements-borderColor">
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Share Project</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-colors"
          >
            <div className="i-ph:x text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Collaborator count */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bolt-elements-background-depth-2">
            <div className={classNames('w-3 h-3 rounded-full', connected ? 'bg-green-500' : 'bg-gray-400')} />
            <div className="flex-1">
              <p className="text-sm font-medium text-bolt-elements-textPrimary">
                {connected ? `${count} active collaborator${count !== 1 ? 's' : ''}` : 'Not connected'}
              </p>
              <p className="text-xs text-bolt-elements-textTertiary">
                {connected
                  ? 'Collaborators can see your changes in real-time'
                  : 'Open this page in another tab to start collaborating'}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-bolt-elements-textPrimary">Share this URL with others</p>
            <p className="text-xs text-bolt-elements-textTertiary">
              Open this link in another browser tab or share it with a teammate. All changes sync automatically across
              tabs.
            </p>
          </div>

          {/* URL display and copy */}
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 text-sm rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textSecondary truncate select-all">
              {currentUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className={classNames(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border',
                copied
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : 'bg-accent-500 text-white border-accent-600 hover:bg-accent-600',
              )}
            >
              <div className={copied ? 'i-ph:check-circle text-sm' : 'i-ph:copy-simple text-sm'} />
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
          <p className="text-[11px] text-bolt-elements-textTertiary">
            Collaboration uses BroadcastChannel technology. All participants must be on the same origin (same browser,
            same domain).
          </p>
        </div>
      </div>
    </div>
  );
});
