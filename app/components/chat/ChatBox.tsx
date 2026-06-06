import React, { useState, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from './APIKeyManager';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';
import { toast } from 'react-toastify';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { SupabaseConnection } from './SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import type { ProviderInfo } from '~/types/model';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import { useFileAutocomplete } from '~/lib/hooks/useFileAutocomplete';
import { FileMentionDropdown } from './FileMentionDropdown';
import { useSlashCommands } from '~/lib/hooks/useSlashCommands';
import { agentMode } from '~/lib/stores/agentMode';
import { PromptLibrary } from './PromptLibrary';

import { DesignSystemSelector } from './DesignSystemSelector';
import { FigmaImport } from './FigmaImport';

interface ChatBoxProps {
  isModelSettingsCollapsed: boolean;
  setIsModelSettingsCollapsed: (collapsed: boolean) => void;
  provider: any;
  providerList: any[];
  modelList: any[];
  apiKeys: Record<string, string>;
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement | undefined>;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  ttsEnabled?: boolean;
  ttsSpeaking?: boolean;
  toggleTts?: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  setProvider?: ((provider: ProviderInfo) => void) | undefined;
  model?: string | undefined;
  setModel?: ((model: string) => void) | undefined;
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  onWebSearchResult?: (result: string) => void;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
  clearMessages: () => void;
  setInput: (value: string) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [showSlashHint, setShowSlashHint] = useState(false);
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const currentAgent = agentMode.get();

  const placeholders = [
    'Build a todo app with authentication...',
    'Create a landing page for a SaaS product...',
    'Design a dashboard with real-time charts...',
    'Make a REST API with Express and SQLite...',
    'Build a chat app with WebSockets...',
  ];
  const TYPING_SPEED = 50;
  const DELETING_SPEED = 30;
  const PAUSE_AFTER_TYPING = 2000;
  const PAUSE_AFTER_DELETING = 500;

  useEffect(() => {
    let index = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = placeholders[index];

      if (isDeleting) {
        charIndex--;
        setTypedPlaceholder(current.substring(0, charIndex));

        if (charIndex === 0) {
          isDeleting = false;
          index = (index + 1) % placeholders.length;
          timeout = setTimeout(tick, PAUSE_AFTER_DELETING);

          return;
        }

        timeout = setTimeout(tick, DELETING_SPEED);
      } else {
        charIndex++;
        setTypedPlaceholder(current.substring(0, charIndex));

        if (charIndex === current.length) {
          isDeleting = true;
          timeout = setTimeout(tick, PAUSE_AFTER_TYPING);

          return;
        }

        timeout = setTimeout(tick, TYPING_SPEED);
      }
    };

    timeout = setTimeout(tick, PAUSE_AFTER_DELETING);

    return () => clearTimeout(timeout);
  }, []);

  const {
    mentionTriggered,
    mentionQuery,
    filteredFiles,
    isOpen: mentionOpen,
    selectedIndex: mentionSelectedIndex,
    handleInputChange: handleMentionChange,
    handleKeyDown: handleMentionKeyDown,
    selectFile: selectMentionFile,
  } = useFileAutocomplete(
    props.textareaRef as React.RefObject<HTMLTextAreaElement | null>,
    props.input,
    props.setInput,
  );

  const { handleInputChange: handleSlashChange, handleKeyDown: handleSlashKeyDown } = useSlashCommands(
    props.input,
    props.setInput,
    props.clearMessages,
    (_text) => {
      toast.success('Opening prompt creator...');
    },
  );

  // Show slash command hint when user types /
  useEffect(() => {
    if (props.input === '/') {
      setShowSlashHint(true);
    } else if (props.input.startsWith('/') && props.input.length > 1) {
      setShowSlashHint(props.input.indexOf(' ') === -1);
    } else {
      setShowSlashHint(false);
    }
  }, [props.input]);

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleMentionChange(event, props.handleInputChange);
    handleSlashChange(event, props.handleInputChange);
  };

  const handleTextareaKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && mentionTriggered) {
      event.preventDefault();
      return;
    }

    const mentionHandled = handleMentionKeyDown(event, () => undefined);

    if (mentionHandled) {
      return;
    }

    // Don't process slashes inside @-mention
    if (!mentionTriggered) {
      const slashResult = handleSlashKeyDown(event, (e) => {
        if (e.key === 'Enter') {
          if (e.shiftKey) {
            return;
          }

          e.preventDefault();

          if (props.isStreaming) {
            props.handleStop?.();
            return;
          }

          if (e.nativeEvent.isComposing) {
            return;
          }

          props.handleSendMessage?.(e);
        }
      });

      if (slashResult.handled) {
        return;
      }
    }
  };

  const handleSelectPromptFromLibrary = (promptText: string) => {
    props.setInput(promptText);
  };

  return (
    <div className="relative w-full max-w-chat mx-auto z-prompt">
      {/* Slash command hint */}
      {showSlashHint && (
        <div className="mb-2 px-4 py-2 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-xs text-bolt-elements-textTertiary">
          <div className="flex flex-col gap-1">
            <span>
              <span className="font-mono text-accent-500">/clear</span> — Reset conversation and start fresh
            </span>
            <span>
              <span className="font-mono text-accent-500">/create &lt;description&gt;</span> — Save a custom prompt
            </span>
          </div>
        </div>
      )}

      {/* Rotating conic gradient glow around chatbox border */}
      <div className="absolute -inset-[2px] rounded-2xl overflow-hidden pointer-events-none z-0">
        <div
          className={classNames(
            'absolute transition-all duration-500',
            props.isStreaming ? 'top-[-50%] left-[-50%] w-[200%] h-[200%]' : 'top-0 left-0 w-full h-full blur-sm',
          )}
          style={{
            background: props.isStreaming
              ? 'conic-gradient(from 0deg at 50% 50%, transparent 0%, #3b82f6 10%, transparent 20%, transparent 50%, #3b82f6 60%, transparent 70%)'
              : 'radial-gradient(circle at 0% 0%, #3b82f6 0%, #60a5fa 10%, transparent 40%)',
            animation: props.isStreaming ? 'conic-sweep 4s linear infinite' : 'none',
          }}
        />
      </div>
      <style>{`
          @keyframes conic-sweep {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      <div
        className={classNames(
          'relative bg-bolt-elements-background-depth-2 backdrop-blur-md border rounded-2xl p-4 shadow-xl transition-all duration-200',
          props.isStreaming
            ? 'border-blue-500/30'
            : 'border-bolt-elements-borderColor hover:border-bolt-elements-borderColor/80',
        )}
      >
        <div>
          <ClientOnly>
            {() => (
              <div className={props.isModelSettingsCollapsed ? 'hidden' : ''}>
                <ModelSelector
                  key={props.provider?.name + ':' + props.modelList.length}
                  model={props.model}
                  setModel={props.setModel}
                  modelList={props.modelList}
                  provider={props.provider}
                  setProvider={props.setProvider}
                  providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
                  apiKeys={props.apiKeys}
                  modelLoading={props.isModelLoading}
                />
                {(props.providerList || []).length > 0 &&
                  props.provider &&
                  (props.provider.name === 'Ollama' || !LOCAL_PROVIDERS.includes(props.provider.name)) && (
                    <APIKeyManager
                      provider={props.provider}
                      apiKey={props.apiKeys[props.provider.name] || ''}
                      setApiKey={(key) => {
                        props.onApiKeysChange(props.provider.name, key);
                      }}
                    />
                  )}
              </div>
            )}
          </ClientOnly>
        </div>
        <FilePreview
          files={props.uploadedFiles}
          imageDataList={props.imageDataList}
          onRemove={(index) => {
            props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
            props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
          }}
        />
        <ClientOnly>
          {() => (
            <ScreenshotStateManager
              setUploadedFiles={props.setUploadedFiles}
              setImageDataList={props.setImageDataList}
              uploadedFiles={props.uploadedFiles}
              imageDataList={props.imageDataList}
            />
          )}
        </ClientOnly>
        {props.selectedElement && (
          <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none border-bolt-elements-borderColor text-bolt-elements-textPrimary flex py-1 px-2.5 font-medium text-xs">
            <div className="flex gap-2 items-center lowercase">
              <code className="bg-accent-500 rounded-4px px-1.5 py-1 mr-0.5 text-white">
                {props?.selectedElement?.tagName}
              </code>
              selected for inspection
            </div>
            <button
              className="bg-transparent text-accent-500 pointer-auto"
              onClick={() => props.setSelectedElement?.(null)}
            >
              Clear
            </button>
          </div>
        )}
        <div className="relative bg-transparent rounded-lg">
          <div className="relative">
            <textarea
              ref={props.textareaRef as React.RefObject<HTMLTextAreaElement>}
              className={classNames(
                'w-full pl-4 pt-4 pr-16 outline-none resize-none text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent text-sm',
                'transition-all duration-200',
              )}
              onDragEnter={(e) => {
                e.preventDefault();
                e.currentTarget.style.border = '2px solid var(--bolt-elements-borderColorActive)';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.border = '2px solid var(--bolt-elements-borderColorActive)';
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';

                const files = Array.from(e.dataTransfer.files);
                files.forEach((file) => {
                  if (file.type.startsWith('image/')) {
                    const reader = new FileReader();

                    reader.onload = (e) => {
                      const base64Image = e.target?.result as string;
                      props.setUploadedFiles?.([...props.uploadedFiles, file]);
                      props.setImageDataList?.([...props.imageDataList, base64Image]);
                    };
                    reader.readAsDataURL(file);
                  }
                });
              }}
              onKeyDown={handleTextareaKeyDown}
              value={props.input}
              onChange={handleTextareaChange}
              onPaste={props.handlePaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={{
                minHeight: props.TEXTAREA_MIN_HEIGHT,
                maxHeight: props.TEXTAREA_MAX_HEIGHT,
              }}
              placeholder=""
              translate="no"
            />
            {props.input.length === 0 && !isFocused && (
              <div className="absolute top-4 left-4 pointer-events-none text-sm text-bolt-elements-textSecondary flex items-center gap-0.5">
                <span className="opacity-90">{typedPlaceholder}</span>
                <span className="w-[2px] h-4 bg-accent-500/70 animate-pulse" />
              </div>
            )}
            {/* File mention autocomplete */}
            <FileMentionDropdown
              isOpen={mentionOpen}
              filteredFiles={filteredFiles}
              selectedIndex={mentionSelectedIndex}
              mentionQuery={mentionQuery}
              onSelect={selectMentionFile}
              onClose={() => undefined}
              textareaRef={props.textareaRef as React.RefObject<HTMLTextAreaElement | null>}
            />
          </div>
          <ClientOnly>
            {() => (
              <SendButton
                show={props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0}
                isStreaming={props.isStreaming}
                disabled={!props.providerList || props.providerList.length === 0}
                onClick={(event) => {
                  if (props.isStreaming) {
                    props.handleStop?.();
                    return;
                  }

                  if (props.input.length > 0 || props.uploadedFiles.length > 0) {
                    // Strip slash commands from actual send
                    if (props.input.startsWith('/clear') || props.input.startsWith('/create ')) {
                      return;
                    }

                    props.handleSendMessage?.(event);
                  }
                }}
              />
            )}
          </ClientOnly>
          <div className="flex items-center text-sm p-3 pt-1 gap-0.5">
            {/* Agent Selector */}
            <div className="relative">
              <button
                onClick={() => setShowAgentMenu(!showAgentMenu)}
                className={classNames(
                  'flex items-center gap-1 px-1.5 py-1 text-[10px] font-medium rounded-md transition-all border',
                  currentAgent === 'max'
                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                    : 'bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 border-bolt-elements-borderColor text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary',
                )}
                title={`Agent: ${currentAgent === 'standard' ? 'Standard' : 'Max'}`}
              >
                <div
                  className={currentAgent === 'max' ? 'i-ph:lightning-fill text-[10px]' : 'i-ph:lightning text-[10px]'}
                />
                <span>{currentAgent === 'standard' ? 'Standard' : 'Max'}</span>
              </button>
              {showAgentMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAgentMenu(false)} />
                  <div className="absolute bottom-full mb-1 left-0 z-50 w-44 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg shadow-xl overflow-hidden">
                    <button
                      onClick={() => {
                        agentMode.set('standard');
                        setShowAgentMenu(false);
                      }}
                      className={classNames(
                        'w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 rounded-lg',
                        currentAgent === 'standard'
                          ? 'bg-accent-500/10 text-accent-500'
                          : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3',
                      )}
                    >
                      <div className="i-ph:zap text-sm" />
                      <div>
                        <p className="font-medium">Standard</p>
                        <p className="text-xs text-bolt-elements-textTertiary">Fast, everyday building</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        agentMode.set('max');
                        setShowAgentMenu(false);
                      }}
                      className={classNames(
                        'w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 rounded-lg',
                        currentAgent === 'max'
                          ? 'bg-purple-500/10 text-purple-500'
                          : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3',
                      )}
                    >
                      <div className="i-ph:lightning-fill text-sm text-purple-500" />
                      <div>
                        <p className="font-medium">Max</p>
                        <p className="text-xs text-bolt-elements-textTertiary">Deeper reasoning for complex tasks</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <DesignSystemSelector
              enhancePrompt={props.enhancePrompt}
              enhancingPrompt={props.enhancingPrompt}
              input={props.input}
              handleFileUpload={props.handleFileUpload}
              onWebSearchResult={props.onWebSearchResult}
              isStreaming={props.isStreaming}
              designScheme={props.designScheme}
              setDesignScheme={props.setDesignScheme}
              ttsEnabled={props.ttsEnabled}
              ttsSpeaking={props.ttsSpeaking}
              toggleTts={props.toggleTts}
            />
            <SpeechRecognitionButton
              isListening={props.isListening}
              onStart={props.startListening}
              onStop={props.stopListening}
              disabled={props.isStreaming}
            />
            <IconButton
              title="Model Settings"
              className={classNames(
                '!bg-bolt-elements-background-depth-2 !border !rounded-lg !p-1.5 text-bolt-elements-textTertiary gap-1',
                props.isModelSettingsCollapsed
                  ? '!border-bolt-elements-borderColor hover:!bg-bolt-elements-background-depth-3 hover:!text-bolt-elements-textPrimary'
                  : '!border-blue-500/20 !bg-blue-500/10 !text-blue-400',
              )}
              onClick={() => props.setIsModelSettingsCollapsed(!props.isModelSettingsCollapsed)}
              disabled={!props.providerList || props.providerList.length === 0}
            >
              <div className={`i-ph:caret-${props.isModelSettingsCollapsed ? 'right' : 'down'} text-sm`} />
              {props.isModelSettingsCollapsed ? <span className="text-[10px]">{props.model}</span> : <span />}
            </IconButton>
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="flex items-center">
                <button
                  type="button"
                  className={classNames(
                    'rounded-full flex items-center gap-1 text-xs h-9 px-3 transition-theme rounded-r-none',
                    props.chatMode === 'build'
                      ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
                      : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3',
                  )}
                  onClick={() => props.setChatMode?.('build')}
                  aria-pressed={props.chatMode === 'build'}
                >
                  <span className="i-ph:lightning w-4 h-4" />
                  <span className="hidden sm:inline">Build</span>
                </button>
                <button
                  type="button"
                  className={classNames(
                    'rounded-full flex items-center gap-1 text-xs h-9 px-3 transition-theme rounded-l-none',
                    props.chatMode === 'discuss'
                      ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
                      : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3',
                  )}
                  onClick={() => props.setChatMode?.('discuss')}
                  aria-pressed={props.chatMode === 'discuss'}
                >
                  <span className="i-ph:lightbulb w-4 h-4" />
                  <span className="hidden sm:inline">Plan</span>
                </button>
              </div>
              <SupabaseConnection />
            </div>
            <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
          </div>
        </div>
      </div>
      <PromptLibrary onSelectPrompt={handleSelectPromptFromLibrary} />
      <FigmaImport />
    </div>
  );
};
