import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { webcontainer } from '~/lib/webcontainer';
import { workbenchStore } from '~/lib/stores/workbench';
import { useChatHistory } from '~/lib/persistence/useChatHistory';
import type { AppVersion } from '~/lib/persistence/types';

interface VersionHistoryProps {
  open: boolean;
  onClose: () => void;
}

export function VersionHistory({ open, onClose }: VersionHistoryProps) {
  const { getAppVersions, saveAppVersion, deleteAppVersion } = useChatHistory();
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const loadVersions = useCallback(async () => {
    const list = await getAppVersions();
    setVersions(list);
  }, [getAppVersions]);

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open, loadVersions]);

  const handleSave = async () => {
    if (!newLabel.trim()) {
      toast.error('Version label is required');
      return;
    }

    await saveAppVersion(newLabel.trim(), newDescription.trim() || undefined);
    setNewLabel('');
    setNewDescription('');
    setShowSaveForm(false);
    loadVersions();
  };

  const handleRollback = async (version: AppVersion) => {
    setLoading(true);

    try {
      const container = await webcontainer;
      const files = version.files;

      for (const [key, value] of Object.entries(files)) {
        const path = key.startsWith(container.workdir) ? key.replace(container.workdir, '') : key;

        if (value?.type === 'folder') {
          await container.fs.mkdir(path, { recursive: true });
        }
      }

      for (const [key, value] of Object.entries(files)) {
        if (value?.type === 'file') {
          const path = key.startsWith(container.workdir) ? key.replace(container.workdir, '') : key;
          await container.fs.writeFile(path, value.content, { encoding: value.isBinary ? undefined : 'utf8' });
        }
      }
      workbenchStore.files.set({ ...files });
      toast.success(`Rolled back to "${version.label}"`);
      onClose();
    } catch (error) {
      toast.error('Failed to rollback version');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (versionId: string) => {
    await deleteAppVersion(versionId);
    loadVersions();
  };

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-96 bg-bolt-elements-background-depth-1 border-l border-bolt-elements-borderColor shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-bolt-elements-borderColor shrink-0">
          <h2 className="text-sm font-semibold text-bolt-elements-textPrimary">App Versions</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-colors"
          >
            <span className="i-ph:x text-lg" />
          </button>
        </div>

        <div className="p-3 border-b border-bolt-elements-borderColor shrink-0">
          {showSaveForm ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Version label (e.g. v1, milestone 1)"
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:border-accent-500"
                autoFocus
              />
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:border-accent-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary border border-bolt-elements-borderColor transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveForm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors"
            >
              <span className="i-ph:floppy-disk text-sm" />
              Save Current Version
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-bolt-elements-textTertiary">
              <span className="i-ph:clock-counter-clockwise text-3xl mb-2" />
              <p className="text-sm">No versions saved yet</p>
              <p className="text-xs mt-1">Save a version to track your app progress</p>
            </div>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="p-3 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor hover:border-accent-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-accent-500 bg-accent-500/10 px-1.5 py-0.5 rounded">
                        {version.id}
                      </span>
                      <span className="text-sm font-medium text-bolt-elements-textPrimary truncate">
                        {version.label}
                      </span>
                    </div>
                    {version.description && (
                      <p className="text-xs text-bolt-elements-textTertiary mt-1 truncate">{version.description}</p>
                    )}
                    <p className="text-xs text-bolt-elements-textTertiary mt-1">
                      {new Date(version.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleRollback(version)}
                      disabled={loading}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-bolt-elements-textSecondary hover:text-accent-500 hover:bg-accent-500/10 transition-colors disabled:opacity-50"
                      title="Rollback to this version"
                    >
                      <span className="i-ph:arrow-counter-clockwise text-sm" />
                    </button>
                    <button
                      onClick={() => handleDelete(version.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-bolt-elements-textTertiary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete version"
                    >
                      <span className="i-ph:trash text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-bolt-elements-borderColor text-xs text-bolt-elements-textTertiary shrink-0">
          {versions.length} / 30 versions used
          {versions.length >= 30 && <span className="text-amber-500 ml-1">(limit reached)</span>}
        </div>
      </div>
    </>
  );
}
