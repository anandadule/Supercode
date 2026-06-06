import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SnapshotEntry } from '~/lib/persistence/types';
import { workbenchStore } from '~/lib/stores/workbench';

interface SnapshotPreviewProps {
  entry: SnapshotEntry;
  onClose: () => void;
  onRestore: () => void;
}

export function SnapshotPreview({ entry, onClose, onRestore }: SnapshotPreviewProps) {
  const fileCount = useMemo(() => {
    return Object.values(entry.files).filter((f) => f?.type === 'file').length;
  }, [entry.files]);

  const folderCount = useMemo(() => {
    return Object.values(entry.files).filter((f) => f?.type === 'folder').length;
  }, [entry.files]);

  const currentFiles = useMemo(() => {
    return workbenchStore.files.get();
  }, []);

  const diffStats = useMemo(() => {
    const entryFiles = Object.entries(entry.files).filter(([, v]) => v?.type === 'file');
    const currentFilePaths = new Set(
      Object.entries(currentFiles)
        .filter(([, v]) => v?.type === 'file')
        .map(([k]) => k),
    );
    const added = entryFiles.filter(([path]) => !currentFilePaths.has(path)).length;
    const same = entryFiles.filter(([path]) => currentFilePaths.has(path)).length;

    return { added, same, total: entryFiles.length };
  }, [entry.files, currentFiles]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="absolute inset-x-0 bottom-0 bg-bolt-elements-background-depth-2 border-t border-bolt-elements-borderColor rounded-t-xl shadow-xl z-10"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-bolt-elements-textPrimary">
              {entry.label || 'Snapshot Preview'}
            </h4>
            <button
              onClick={onClose}
              className="p-1 hover:bg-bolt-elements-background-depth-3 rounded transition-colors text-bolt-elements-item-contentDefault"
            >
              <div className="i-ph:x text-lg" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-bolt-elements-background-depth-1 rounded-lg p-3">
              <div className="i-ph:files text-lg text-bolt-elements-textTertiary mb-1" />
              <p className="text-lg font-semibold text-bolt-elements-textPrimary">{fileCount}</p>
              <p className="text-xs text-bolt-elements-textTertiary">Files</p>
            </div>
            <div className="bg-bolt-elements-background-depth-1 rounded-lg p-3">
              <div className="i-ph:folder text-lg text-bolt-elements-textTertiary mb-1" />
              <p className="text-lg font-semibold text-bolt-elements-textPrimary">{folderCount}</p>
              <p className="text-xs text-bolt-elements-textTertiary">Folders</p>
            </div>
          </div>

          <div className="bg-bolt-elements-background-depth-1 rounded-lg p-3 mb-4">
            <p className="text-xs text-bolt-elements-textTertiary mb-1">Changes vs current</p>
            <div className="flex gap-3 text-sm">
              <span className="text-green-500">+{diffStats.added} added</span>
              <span className="text-bolt-elements-textTertiary">{diffStats.same} unchanged</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onRestore}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors"
            >
              Restore this version
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-4 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
