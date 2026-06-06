import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useChatHistory } from '~/lib/persistence';
import { timelineLoading, timelineOpen } from '~/lib/stores/snapshotTimeline';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import type { SnapshotEntry } from '~/lib/persistence/types';
import { webcontainer } from '~/lib/webcontainer';
import { SnapshotPreview } from './SnapshotPreview';
import { cubicEasingFn } from '~/utils/easings';

export function SnapshotTimeline() {
  const { getSnapshotTimeline, updateTimelineEntry, deleteTimelineEntry } = useChatHistory();
  const isOpen = useStore(timelineOpen);
  const isLoading = useStore(timelineLoading);
  const [entries, setEntries] = useState<SnapshotEntry[]>([]);
  const [previewEntry, setPreviewEntry] = useState<SnapshotEntry | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelEditValue, setLabelEditValue] = useState('');

  const loadTimeline = useCallback(async () => {
    timelineLoading.set(true);

    try {
      const timeline = await getSnapshotTimeline();
      setEntries(timeline || []);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      timelineLoading.set(false);
    }
  }, [getSnapshotTimeline]);

  useEffect(() => {
    if (isOpen) {
      loadTimeline();
    }
  }, [isOpen, loadTimeline]);

  const handleRestore = useCallback(async (entry: SnapshotEntry) => {
    const container = await webcontainer;

    try {
      Object.entries(entry.files).forEach(async ([key, value]) => {
        if (value?.type === 'folder') {
          const folderPath = key.startsWith(container.workdir) ? key.replace(container.workdir, '') : key;
          await container.fs.mkdir(folderPath, { recursive: true });
        }
      });
      Object.entries(entry.files).forEach(async ([key, value]) => {
        if (value?.type === 'file') {
          const filePath = key.startsWith(container.workdir) ? key.replace(container.workdir, '') : key;
          await container.fs.writeFile(filePath, value.content, { encoding: value.isBinary ? undefined : 'utf8' });
        }
      });
      workbenchStore.files.set(entry.files);
      toast.success('Snapshot restored successfully');
    } catch (err) {
      toast.error('Failed to restore snapshot');
      console.error(err);
    }
  }, []);

  const handleBookmark = useCallback(
    async (entry: SnapshotEntry) => {
      await updateTimelineEntry(entry.id, { bookmarked: !entry.bookmarked });
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, bookmarked: !e.bookmarked } : e)));
    },
    [updateTimelineEntry],
  );

  const handleRename = useCallback(
    async (entryId: string, newLabel: string) => {
      if (!newLabel.trim()) {
        return;
      }

      await updateTimelineEntry(entryId, { label: newLabel.trim() });
      setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, label: newLabel.trim() } : e)));
      setEditingLabel(null);
      setLabelEditValue('');
    },
    [updateTimelineEntry],
  );

  const handleDelete = useCallback(
    async (entryId: string) => {
      await deleteTimelineEntry(entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    },
    [deleteTimelineEntry],
  );

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    }

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 300, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: cubicEasingFn }}
          className="h-full border-l border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2/70">
            <h3 className="text-sm font-semibold text-bolt-elements-textPrimary">Version History</h3>
            <button
              onClick={() => timelineOpen.set(false)}
              className="p-1 hover:bg-bolt-elements-background-depth-3 rounded transition-colors text-bolt-elements-item-contentDefault hover:text-bolt-elements-item-contentActive"
            >
              <div className="i-ph:x text-lg" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="i-ph:spinner-gap-bold animate-spin text-xl text-bolt-elements-textTertiary" />
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="i-ph:clock-counter-clockwise text-3xl text-bolt-elements-textTertiary mb-2" />
                <p className="text-sm text-bolt-elements-textTertiary">No snapshots yet</p>
                <p className="text-xs text-bolt-elements-textTertiary mt-1">
                  Snapshots are created automatically as you build
                </p>
              </div>
            ) : (
              <div className="py-2">
                {entries
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((entry, index) => (
                    <div
                      key={entry.id}
                      className={classNames(
                        'px-4 py-3 hover:bg-bolt-elements-background-depth-3 transition-colors cursor-pointer border-l-2',
                        entry.bookmarked ? 'border-l-accent-500' : 'border-l-transparent',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0" onClick={() => setPreviewEntry(entry)}>
                          {editingLabel === entry.id ? (
                            <input
                              autoFocus
                              value={labelEditValue}
                              onChange={(e) => setLabelEditValue(e.target.value)}
                              onBlur={() => handleRename(entry.id, labelEditValue)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRename(entry.id, labelEditValue);
                                }

                                if (e.key === 'Escape') {
                                  setEditingLabel(null);
                                }
                              }}
                              className="w-full text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded px-1 py-0.5 text-bolt-elements-textPrimary outline-none"
                            />
                          ) : (
                            <p className="text-sm text-bolt-elements-textPrimary truncate">
                              {entry.label || `Snapshot ${entries.length - index}`}
                            </p>
                          )}
                          <p className="text-xs text-bolt-elements-textTertiary mt-0.5">
                            {formatDate(entry.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookmark(entry);
                            }}
                            className={classNames(
                              'p-1 rounded transition-colors',
                              entry.bookmarked
                                ? 'text-accent-500 hover:bg-accent-500/10'
                                : 'text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-4',
                            )}
                            title={entry.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                          >
                            <div
                              className={classNames(
                                'text-sm',
                                entry.bookmarked ? 'i-ph:bookmark-fill' : 'i-ph:bookmark',
                              )}
                            />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLabel(entry.id);
                              setLabelEditValue(entry.label || '');
                            }}
                            className="p-1 rounded text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-4 transition-colors"
                            title="Rename"
                          >
                            <div className="i-ph:pencil-simple text-sm" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(entry);
                            }}
                            className="p-1 rounded text-bolt-elements-textTertiary hover:text-green-500 hover:bg-green-500/10 transition-colors"
                            title="Restore this version"
                          >
                            <div className="i-ph:arrow-clockwise text-sm" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry.id);
                            }}
                            className="p-1 rounded text-bolt-elements-textTertiary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete snapshot"
                          >
                            <div className="i-ph:trash text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {previewEntry && (
            <SnapshotPreview
              entry={previewEntry}
              onClose={() => setPreviewEntry(null)}
              onRestore={() => {
                handleRestore(previewEntry);
                setPreviewEntry(null);
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
