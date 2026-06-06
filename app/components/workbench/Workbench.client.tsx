import { useStore } from '@nanostores/react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Popover, Transition } from '@headlessui/react';
import { diffLines, type Change } from 'diff';
import { getLanguageFromExtension } from '~/utils/getLanguageFromExtension';
import type { FileHistory } from '~/types/actions';
import { DiffView } from './DiffView';
import {
  type OnChangeCallback as OnEditorChange,
  type OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';
import { IconButton } from '~/components/ui/IconButton';
import { Slider, type SliderOptions } from '~/components/ui/Slider';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';
import { EditorPanel } from './EditorPanel';
import { Preview } from './Preview';
import useViewport from '~/lib/hooks';
import { timelineOpen } from '~/lib/stores/snapshotTimeline';
import { SnapshotTimeline } from '~/components/chat/SnapshotTimeline';
import { VersionHistory } from './VersionHistory';
import { autoInstallStatus, autoInstallMessage } from '~/lib/runtime/auto-install';

import { usePreviewStore } from '~/lib/stores/previews';
import { chatStore } from '~/lib/stores/chat';
import type { ElementInfo } from './Inspector';
import { ExportChatButton } from '~/components/chat/chatExportAndImport/ExportChatButton';
import { DeployButton } from '~/components/deploy/DeployButton';
import { useChatHistory } from '~/lib/persistence';
import { streamingState } from '~/lib/stores/streaming';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { showCollaborationPanel, collaboratorCount, isCollaborating } from '~/lib/stores/collaboration';
import { CollaborationPanel } from '~/components/collaboration/CollaborationPanel';

interface WorkspaceProps {
  chatStarted?: boolean;
  isStreaming?: boolean;
  metadata?: {
    gitUrl?: string;
  };
  updateChatMestaData?: (metadata: any) => void;
  setSelectedElement?: (element: ElementInfo | null) => void;
}

const viewTransition = { ease: cubicEasingFn };

const sliderOptions: SliderOptions<WorkbenchViewType> = {
  left: {
    value: 'code',
    text: 'Code',
  },
  middle: {
    value: 'diff',
    text: 'Diff',
  },
  right: {
    value: 'preview',
    text: 'Preview',
  },
};

const workbenchVariants = {
  closed: {
    width: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    width: 'var(--workbench-width)',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

const FileModifiedDropdown = memo(
  ({
    fileHistory,
    onSelectFile,
  }: {
    fileHistory: Record<string, FileHistory>;
    onSelectFile: (filePath: string) => void;
  }) => {
    const modifiedFiles = Object.entries(fileHistory);
    const hasChanges = modifiedFiles.length > 0;
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFiles = useMemo(() => {
      return modifiedFiles.filter(([filePath]) => filePath.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [modifiedFiles, searchQuery]);

    return (
      <div className="flex items-center gap-2">
        <Popover className="relative">
          {({ open }: { open: boolean }) => (
            <>
              <Popover.Button className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 transition-colors text-bolt-elements-item-contentDefault">
                <span>File Changes</span>
                {hasChanges && (
                  <span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-500 text-xs flex items-center justify-center border border-accent-500/30">
                    {modifiedFiles.length}
                  </span>
                )}
              </Popover.Button>
              <Transition
                show={open}
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Popover.Panel className="absolute right-0 z-20 mt-2 w-80 origin-top-right rounded-xl bg-bolt-elements-background-depth-2 shadow-xl border border-bolt-elements-borderColor">
                  <div className="p-2">
                    <div className="relative mx-2 mb-2">
                      <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-bolt-elements-textSecondary">
                        <div className="i-ph:magnifying-glass" />
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                      {filteredFiles.length > 0 ? (
                        filteredFiles.map(([filePath, history]) => {
                          const extension = filePath.split('.').pop() || '';
                          const language = getLanguageFromExtension(extension);

                          return (
                            <button
                              key={filePath}
                              onClick={() => onSelectFile(filePath)}
                              className="w-full px-3 py-2 text-left rounded-md hover:bg-bolt-elements-background-depth-1 transition-colors group bg-transparent"
                            >
                              <div className="flex items-center gap-2">
                                <div className="shrink-0 w-5 h-5 text-bolt-elements-textSecondary">
                                  {['typescript', 'javascript', 'jsx', 'tsx'].includes(language) && (
                                    <div className="i-ph:file-js" />
                                  )}
                                  {['css', 'scss', 'less'].includes(language) && <div className="i-ph:paint-brush" />}
                                  {language === 'html' && <div className="i-ph:code" />}
                                  {language === 'json' && <div className="i-ph:brackets-curly" />}
                                  {language === 'python' && <div className="i-ph:file-text" />}
                                  {language === 'markdown' && <div className="i-ph:article" />}
                                  {['yaml', 'yml'].includes(language) && <div className="i-ph:file-text" />}
                                  {language === 'sql' && <div className="i-ph:database" />}
                                  {language === 'dockerfile' && <div className="i-ph:cube" />}
                                  {language === 'shell' && <div className="i-ph:terminal" />}
                                  {![
                                    'typescript',
                                    'javascript',
                                    'css',
                                    'html',
                                    'json',
                                    'python',
                                    'markdown',
                                    'yaml',
                                    'yml',
                                    'sql',
                                    'dockerfile',
                                    'shell',
                                    'jsx',
                                    'tsx',
                                    'scss',
                                    'less',
                                  ].includes(language) && <div className="i-ph:file-text" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex flex-col min-w-0">
                                      <span className="truncate text-sm font-medium text-bolt-elements-textPrimary">
                                        {filePath.split('/').pop()}
                                      </span>
                                      <span className="truncate text-xs text-bolt-elements-textSecondary">
                                        {filePath}
                                      </span>
                                    </div>
                                    {(() => {
                                      // Calculate diff stats
                                      const { additions, deletions } = (() => {
                                        if (!history.originalContent) {
                                          return { additions: 0, deletions: 0 };
                                        }

                                        const normalizedOriginal = history.originalContent.replace(/\r\n/g, '\n');
                                        const normalizedCurrent =
                                          history.versions[history.versions.length - 1]?.content.replace(
                                            /\r\n/g,
                                            '\n',
                                          ) || '';

                                        if (normalizedOriginal === normalizedCurrent) {
                                          return { additions: 0, deletions: 0 };
                                        }

                                        const changes = diffLines(normalizedOriginal, normalizedCurrent, {
                                          newlineIsToken: false,
                                          ignoreWhitespace: true,
                                          ignoreCase: false,
                                        });

                                        return changes.reduce(
                                          (acc: { additions: number; deletions: number }, change: Change) => {
                                            if (change.added) {
                                              acc.additions += change.value.split('\n').length;
                                            }

                                            if (change.removed) {
                                              acc.deletions += change.value.split('\n').length;
                                            }

                                            return acc;
                                          },
                                          { additions: 0, deletions: 0 },
                                        );
                                      })();

                                      const showStats = additions > 0 || deletions > 0;

                                      return (
                                        showStats && (
                                          <div className="flex items-center gap-1 text-xs shrink-0">
                                            {additions > 0 && <span className="text-green-500">+{additions}</span>}
                                            {deletions > 0 && <span className="text-red-500">-{deletions}</span>}
                                          </div>
                                        )
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <div className="w-12 h-12 mb-2 text-bolt-elements-textSecondary">
                            <div className="i-ph:file-dashed" />
                          </div>
                          <p className="text-sm font-medium text-bolt-elements-textPrimary">
                            {searchQuery ? 'No matching files' : 'No modified files'}
                          </p>
                          <p className="text-xs text-bolt-elements-textSecondary mt-1">
                            {searchQuery ? 'Try another search' : 'Changes will appear here as you edit'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasChanges && (
                    <div className="border-t border-bolt-elements-borderColor p-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(filteredFiles.map(([filePath]) => filePath).join('\n'));
                          toast('File list copied to clipboard', {
                            icon: <div className="i-ph:check-circle text-accent-500" />,
                          });
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-bolt-elements-background-depth-1 hover:bg-bolt-elements-background-depth-3 transition-colors text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
                      >
                        Copy File List
                      </button>
                    </div>
                  )}
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    );
  },
);

export const Workbench = memo(
  ({
    chatStarted,
    isStreaming,
    metadata: _metadata,
    updateChatMestaData: _updateChatMestaData,
    setSelectedElement,
  }: WorkspaceProps) => {
    renderLogger.trace('Workbench');

    const [fileHistory, setFileHistory] = useState<Record<string, FileHistory>>({});

    // const modifiedFiles = Array.from(useStore(workbenchStore.unsavedFiles).keys());

    const hasPreview = useStore(computed(workbenchStore.previews, (previews) => previews.length > 0));
    const showWorkbench = useStore(workbenchStore.showWorkbench);
    const selectedFile = useStore(workbenchStore.selectedFile);
    const currentDocument = useStore(workbenchStore.currentDocument);
    const unsavedFiles = useStore(workbenchStore.unsavedFiles);
    const files = useStore(workbenchStore.files);
    const selectedView = useStore(workbenchStore.currentView);
    const { showChat } = useStore(chatStore);
    const canHideChat = showWorkbench || !showChat;

    const isSmallViewport = useViewport(1024);
    const streaming = useStore(streamingState);
    const { exportChat } = useChatHistory();
    const [isSyncing, setIsSyncing] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const installStatus = useStore(autoInstallStatus);
    const installMessage = useStore(autoInstallMessage);

    const collabCount = useStore(collaboratorCount);
    const isCollabActive = useStore(isCollaborating);
    const isCollabPanelOpen = useStore(showCollaborationPanel);

    const setSelectedView = (view: WorkbenchViewType) => {
      workbenchStore.currentView.set(view);
    };

    useEffect(() => {
      if (hasPreview) {
        setSelectedView('preview');
      }
    }, [hasPreview]);

    useEffect(() => {
      workbenchStore.setDocuments(files);
    }, [files]);

    const onEditorChange = useCallback<OnEditorChange>((update) => {
      workbenchStore.setCurrentDocumentContent(update.content);
    }, []);

    const onEditorScroll = useCallback<OnEditorScroll>((position) => {
      workbenchStore.setCurrentDocumentScrollPosition(position);
    }, []);

    const onFileSelect = useCallback((filePath: string | undefined) => {
      workbenchStore.setSelectedFile(filePath);
    }, []);

    const onFileSave = useCallback(() => {
      workbenchStore
        .saveCurrentDocument()
        .then(() => {
          // Explicitly refresh all previews after a file save
          const previewStore = usePreviewStore();
          previewStore.refreshAllPreviews();
        })
        .catch(() => {
          toast.error('Failed to update file content');
        });
    }, []);

    const onFileReset = useCallback(() => {
      workbenchStore.resetCurrentDocument();
    }, []);

    const handleSelectFile = useCallback((filePath: string) => {
      workbenchStore.setSelectedFile(filePath);
      workbenchStore.currentView.set('diff');
    }, []);

    const handleSyncFiles = useCallback(async () => {
      setIsSyncing(true);

      try {
        const directoryHandle = await window.showDirectoryPicker();
        await workbenchStore.syncFiles(directoryHandle);
        toast.success('Files synced successfully');
      } catch (error) {
        console.error('Error syncing files:', error);
        toast.error('Failed to sync files');
      } finally {
        setIsSyncing(false);
      }
    }, []);

    return (
      chatStarted && (
        <motion.div
          initial="closed"
          animate={showWorkbench ? 'open' : 'closed'}
          variants={workbenchVariants}
          className="z-workbench relative h-full"
        >
          <div
            className={classNames('h-full w-full transition-all duration-200 bolt-ease-cubic-bezier', {
              'w-full': isSmallViewport,
              hidden: !showWorkbench && !isSmallViewport,
            })}
          >
            <div className="relative h-full w-full">
              <div className="h-full flex flex-col bg-bolt-elements-background-depth-2 overflow-hidden">
                <div className="flex items-center px-3 py-2 border-b border-bolt-elements-borderColor gap-1.5">
                  {isSmallViewport && (
                    <button
                      className="i-ph:arrow-left text-lg text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary mr-1"
                      title="Back to chat"
                      onClick={() => workbenchStore.showWorkbench.set(false)}
                    />
                  )}
                  <button
                    className={`${showChat ? 'i-ph:sidebar-simple-fill' : 'i-ph:sidebar-simple'} text-lg text-bolt-elements-textSecondary mr-1`}
                    disabled={!canHideChat || isSmallViewport}
                    onClick={() => {
                      if (canHideChat) {
                        chatStore.setKey('showChat', !showChat);
                      }
                    }}
                  />
                  <Slider selected={selectedView} options={sliderOptions} setSelected={setSelectedView} />
                  <div className="ml-auto" />
                  {selectedView === 'code' && (
                    <div className="flex items-center gap-0.5">
                      {/* Export Chat Button */}
                      <ExportChatButton exportChat={exportChat} />

                      {/* Sync Button */}
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger
                          disabled={isSyncing || streaming}
                          className="rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 w-7 h-7 bg-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-colors flex"
                        >
                          {isSyncing ? (
                            <div className="i-svg-spinners:90-ring-with-bg text-xs" />
                          ) : (
                            <div className="i-ph:cloud-arrow-down text-sm" />
                          )}
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content
                          className={classNames(
                            'min-w-[200px] z-[250]',
                            'bg-bolt-elements-background-depth-1',
                            'rounded-lg shadow-xl',
                            'border border-bolt-elements-borderColor',
                            'py-1',
                          )}
                          sideOffset={5}
                          align="end"
                        >
                          <DropdownMenu.Item
                            className="cursor-pointer flex items-center w-full px-4 py-2 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive gap-2"
                            onClick={handleSyncFiles}
                            disabled={isSyncing}
                          >
                            <div className="i-ph:cloud-arrow-down text-base" />
                            <span>{isSyncing ? 'Syncing...' : 'Sync Files'}</span>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>

                      {/* Timeline Button */}
                      <button
                        onClick={() => timelineOpen.set(!timelineOpen.get())}
                        className="rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 w-7 h-7 bg-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-colors flex"
                        title="Version History"
                      >
                        <div className="i-ph:clock-counter-clockwise text-sm" />
                      </button>

                      {/* App Versions Button */}
                      <button
                        onClick={() => setShowVersionHistory(true)}
                        className="rounded-md items-center justify-center w-7 h-7 bg-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-colors flex"
                        title="App Versions"
                      >
                        <div className="i-ph:git-branch text-sm" />
                      </button>

                      {/* Auto-install indicator */}
                      {installStatus !== 'idle' && (
                        <div
                          className={classNames(
                            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
                            installStatus === 'installing' && 'bg-blue-500/10 text-blue-400',
                            installStatus === 'failed' && 'bg-red-500/10 text-red-400',
                          )}
                          title={installMessage}
                        >
                          {installStatus === 'installing' ? (
                            <div className="i-svg-spinners:90-ring-with-bg text-sm" />
                          ) : (
                            <div className="i-ph:warning text-sm" />
                          )}
                          <span className="hidden sm:inline">{installMessage}</span>
                        </div>
                      )}

                      {/* Toggle Terminal Button */}
                      <button
                        onClick={() => {
                          workbenchStore.toggleTerminal(!workbenchStore.showTerminal.get());
                        }}
                        className="rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 w-7 h-7 bg-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-colors flex"
                      >
                        <div className="i-ph:terminal text-sm" />
                      </button>

                      {/* Collaboration Button */}
                      <button
                        onClick={() => showCollaborationPanel.set(!isCollabPanelOpen)}
                        className={`rounded-md items-center justify-center w-7 h-7 bg-transparent transition-colors flex ${
                          isCollabPanelOpen
                            ? 'text-accent-500 bg-accent-500/10'
                            : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive'
                        }`}
                        title={
                          isCollabActive
                            ? `${collabCount} active collaborator${collabCount !== 1 ? 's' : ''}`
                            : 'Collaborators'
                        }
                      >
                        <div className="i-ph:users-three text-sm" />
                        {isCollabActive && collabCount > 0 && (
                          <span className="text-[10px] ml-0.5 font-medium">{collabCount}</span>
                        )}
                      </button>
                    </div>
                  )}

                  {selectedView === 'diff' && (
                    <FileModifiedDropdown fileHistory={fileHistory} onSelectFile={handleSelectFile} />
                  )}
                  {hasPreview && (
                    <>
                      <DeployButton />
                      <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden text-sm">
                        <button
                          onClick={() =>
                            window.open(
                              'https://github.com/stackblitz-labs/bolt.diy/issues/new?template=bug_report.yml',
                              '_blank',
                            )
                          }
                          className="rounded-l-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs bg-accent-500 text-white hover:text-bolt-elements-item-contentAccent [&:not(:disabled,.disabled)]:hover:bg-bolt-elements-button-primary-backgroundHover outline-accent-500 flex gap-1.5"
                          title="Report Bug"
                        >
                          <div className="i-ph:bug" />
                          <span>Report Bug</span>
                        </button>
                        <div className="w-px bg-bolt-elements-borderColor" />
                        <button
                          onClick={async () => {
                            try {
                              const { downloadDebugLog } = await import('~/utils/debugLogger');
                              await downloadDebugLog();
                            } catch (error) {
                              console.error('Failed to download debug log:', error);
                            }
                          }}
                          className="rounded-r-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs bg-accent-500 text-white hover:text-bolt-elements-item-contentAccent [&:not(:disabled,.disabled)]:hover:bg-bolt-elements-button-primary-backgroundHover outline-accent-500 flex gap-1.5"
                          title="Download Debug Log"
                        >
                          <div className="i-ph:download" />
                          <span>Debug Log</span>
                        </button>
                      </div>
                    </>
                  )}
                  <IconButton
                    icon="i-ph:x-circle"
                    className="-mr-1"
                    size="xl"
                    onClick={() => {
                      workbenchStore.showWorkbench.set(false);
                    }}
                  />
                </div>
                <div className="flex-1 flex overflow-hidden">
                  <div className="relative flex-1">
                    <View initial={{ x: '0%' }} animate={{ x: selectedView === 'code' ? '0%' : '-100%' }}>
                      <EditorPanel
                        editorDocument={currentDocument}
                        isStreaming={isStreaming}
                        selectedFile={selectedFile}
                        files={files}
                        unsavedFiles={unsavedFiles}
                        fileHistory={fileHistory}
                        onFileSelect={onFileSelect}
                        onEditorScroll={onEditorScroll}
                        onEditorChange={onEditorChange}
                        onFileSave={onFileSave}
                        onFileReset={onFileReset}
                      />
                    </View>
                    <View
                      initial={{ x: '100%' }}
                      animate={{ x: selectedView === 'diff' ? '0%' : selectedView === 'code' ? '100%' : '-100%' }}
                    >
                      <DiffView fileHistory={fileHistory} setFileHistory={setFileHistory} />
                    </View>
                    <View initial={{ x: '100%' }} animate={{ x: selectedView === 'preview' ? '0%' : '100%' }}>
                      <Preview setSelectedElement={setSelectedElement} />
                    </View>
                  </div>
                  <SnapshotTimeline />
                  <VersionHistory open={showVersionHistory} onClose={() => setShowVersionHistory(false)} />
                  <CollaborationPanel />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )
    );
  },
);

// View component for rendering content with motion transitions
interface ViewProps extends HTMLMotionProps<'div'> {
  children: JSX.Element;
}

const View = memo(({ children, ...props }: ViewProps) => {
  return (
    <motion.div className="absolute inset-0" transition={viewTransition} {...props}>
      {children}
    </motion.div>
  );
});
