/* eslint-disable @blitz/lines-around-comment */
import { useStore } from '@nanostores/react';
import { memo, useCallback, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  collaborators,
  myCollaboratorId,
  showCollaborationPanel,
  collaboratorCount,
  isCollaborating,
} from '~/lib/stores/collaboration';
import { PresenceAvatar } from '~/components/collaboration/PresenceAvatar';
import { ShareDialog } from '~/components/collaboration/ShareDialog';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';

const panelVariants = {
  closed: {
    width: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    width: 300,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

const roleBadgeClass: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-500 border-red-500/20',
  editor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  viewer: 'bg-green-500/10 text-green-500 border-green-500/20',
};

function formatLastSeen(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 10) {
    return 'just now';
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  return `${Math.floor(minutes / 60)}h ago`;
}

function getStatusColor(timestamp: number): string {
  const seconds = (Date.now() - timestamp) / 1000;

  if (seconds < 15) {
    return 'bg-green-500';
  }

  if (seconds < 45) {
    return 'bg-yellow-500';
  }

  return 'bg-gray-400';
}

function truncateFilePath(file: string, maxLen: number = 30): string {
  if (file.length <= maxLen) {
    return file;
  }

  const parts = file.split('/');
  const fileName = parts.pop() || '';

  if (fileName.length <= maxLen - 3) {
    return '.../' + fileName;
  }

  return fileName.slice(0, maxLen - 3) + '...';
}

export const CollaborationPanel = memo(() => {
  const collabList = useStore(collaborators);
  const myId = useStore(myCollaboratorId);
  const isOpen = useStore(showCollaborationPanel);
  const count = useStore(collaboratorCount);
  const connected = useStore(isCollaborating);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleClose = useCallback(() => {
    showCollaborationPanel.set(false);
  }, []);

  // Filter out the current user from the list for display
  const otherCollaborators = collabList.filter((c) => c.id !== myId);
  const me = collabList.find((c) => c.id === myId);

  return (
    <>
      <motion.div
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        variants={panelVariants}
        className="border-l border-bolt-elements-borderColor overflow-hidden h-full"
      >
        <div className="w-[300px] h-full flex flex-col bg-bolt-elements-background-depth-1">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2/70">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Collaborators</h3>
              {connected && count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-bolt-elements-background-depth-3 text-bolt-elements-textTertiary">
                  {count}
                </span>
              )}
            </div>
            <button
              onClick={handleClose}
              className="rounded-md p-1 bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-colors"
            >
              <div className="i-ph:x text-sm" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {/* Connection status */}
            <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
              <span className={classNames('w-2 h-2 rounded-full', connected ? 'bg-green-500' : 'bg-gray-400')} />
              <span className="text-xs text-bolt-elements-textTertiary">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Me (current user) */}
            {me && (
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-bolt-elements-background-depth-1">
                <PresenceAvatar name={me.name} color={me.color} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-bolt-elements-textPrimary truncate">{me.name}</span>
                    <span className="text-[10px] text-bolt-elements-textTertiary bg-bolt-elements-background-depth-2 px-1 py-0.5 rounded">
                      You
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={classNames(
                        'text-[10px] px-1 py-0.5 rounded border font-medium',
                        roleBadgeClass[me.role] || roleBadgeClass.editor,
                      )}
                    >
                      {me.role}
                    </span>
                    <span className={classNames('w-1.5 h-1.5 rounded-full', getStatusColor(me.lastSeen))} />
                    <span className="text-[10px] text-bolt-elements-textTertiary">{formatLastSeen(me.lastSeen)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            {otherCollaborators.length > 0 && (
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="flex-1 h-px bg-bolt-elements-borderColor" />
                <span className="text-[10px] text-bolt-elements-textTertiary">
                  {otherCollaborators.length} other{otherCollaborators.length !== 1 ? 's' : ''}
                </span>
                <div className="flex-1 h-px bg-bolt-elements-borderColor" />
              </div>
            )}

            {/* Other collaborators */}
            {otherCollaborators.length > 0 ? (
              otherCollaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-bolt-elements-background-depth-1 transition-colors"
                >
                  <PresenceAvatar name={collab.name} color={collab.color} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-bolt-elements-textPrimary truncate">{collab.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span
                        className={classNames(
                          'text-[10px] px-1 py-0.5 rounded border font-medium capitalize',
                          roleBadgeClass[collab.role] || roleBadgeClass.editor,
                        )}
                      >
                        {collab.role}
                      </span>
                      <span className={classNames('w-1.5 h-1.5 rounded-full', getStatusColor(collab.lastSeen))} />
                      <span className="text-[10px] text-bolt-elements-textTertiary">
                        {formatLastSeen(collab.lastSeen)}
                      </span>
                    </div>
                    {collab.cursor && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-bolt-elements-textTertiary">
                        <div className="i-ph:cursor text-xs shrink-0" />
                        <span className="truncate">{truncateFilePath(collab.cursor.file)}</span>
                        <span>:{collab.cursor.line}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="w-10 h-10 mb-3 rounded-full bg-bolt-elements-background-depth-3 flex items-center justify-center">
                  <div className="i-ph:users-three text-lg text-bolt-elements-textTertiary" />
                </div>
                <p className="text-sm font-medium text-bolt-elements-textPrimary mb-1">No other collaborators</p>
                <p className="text-xs text-bolt-elements-textTertiary">
                  Share the project URL with others to collaborate in real-time
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-bolt-elements-borderColor p-3">
            <button
              onClick={() => setShowShareDialog(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-bolt-elements-background-depth-1 hover:bg-bolt-elements-background-depth-3 transition-colors text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary border border-bolt-elements-borderColor"
            >
              <div className="i-ph:share-network text-sm" />
              <span>Share Project</span>
            </button>
          </div>
        </div>
      </motion.div>

      {showShareDialog && <ShareDialog onClose={() => setShowShareDialog(false)} />}
    </>
  );
});
