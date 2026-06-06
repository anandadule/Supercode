import type { JSONValue, Message } from 'ai';
import React, { type RefCallback, useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Workbench } from '~/components/workbench/Workbench.client';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { Messages } from './Messages.client';
import { getApiKeysFromCookies } from './APIKeyManager';
import Cookies from 'js-cookie';
import * as Tooltip from '@radix-ui/react-tooltip';
import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/types/model';
import type { ActionAlert, SupabaseAlert, DeployAlert, LlmErrorAlertType } from '~/types/actions';
import DeployChatAlert from '~/components/deploy/DeployAlert';
import ChatAlert from './ChatAlert';
import type { ModelInfo } from '~/lib/modules/llm/types';
import ProgressCompilation from './ProgressCompilation';
import type { ProgressAnnotation } from '~/types/context';
import { SupabaseChatAlert } from '~/components/chat/SupabaseAlert';
import { expoUrlAtom } from '~/lib/stores/qrCodeStore';
import { useStore } from '@nanostores/react';
import { StickToBottom, useStickToBottomContext } from '~/lib/hooks';
import { ChatBox } from './ChatBox';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import LlmErrorAlert from './LLMApiAlert';
import { AutoFixIndicator } from './AutoFixIndicator';
import { useAutoFix } from '~/lib/hooks/useAutoFix';
import { useSpeechSynthesis } from '~/lib/hooks/useSpeechSynthesis';
import { ImageGenerator } from '~/components/chat/ImageGenerator';
import { ImageEditor } from '~/components/chat/ImageEditor';
import LandingSidebar from '~/components/landing/LandingSidebar';
import LandingHero from '~/components/landing/LandingHero';
import LandingBottom from '~/components/landing/LandingBottom';
import { TeamTemplateDialog } from '~/components/chat/TeamTemplateDialog';
import { Header } from '~/components/header/Header';
import { toast } from 'react-toastify';

const TEXTAREA_MIN_HEIGHT = 76;

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  onStreamingChange?: (streaming: boolean) => void;
  messages?: Message[];
  description?: string;
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  providerList?: ProviderInfo[];
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  exportChat?: () => void;
  uploadedFiles?: File[];
  setUploadedFiles?: (files: File[]) => void;
  imageDataList?: string[];
  setImageDataList?: (dataList: string[]) => void;
  actionAlert?: ActionAlert;
  clearAlert?: () => void;
  supabaseAlert?: SupabaseAlert;
  clearSupabaseAlert?: () => void;
  deployAlert?: DeployAlert;
  clearDeployAlert?: () => void;
  llmErrorAlert?: LlmErrorAlertType;
  clearLlmErrorAlert?: () => void;
  data?: JSONValue[] | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  append?: (message: Message) => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: (element: ElementInfo | null) => void;
  addToolResult?: ({ toolCallId, result }: { toolCallId: string; result: any }) => void;
  onWebSearchResult?: (result: string) => void;
  clearMessages?: () => void;
  setInput?: (value: string) => void;
}

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      onStreamingChange,
      model,
      setModel,
      provider,
      setProvider,
      providerList,
      input = '',
      enhancingPrompt,
      handleInputChange,

      // promptEnhanced,
      enhancePrompt,
      sendMessage,
      handleStop,
      importChat: _importChat,
      exportChat,
      uploadedFiles = [],
      setUploadedFiles,
      imageDataList = [],
      setImageDataList,
      messages,
      actionAlert,
      clearAlert,
      deployAlert,
      clearDeployAlert,
      supabaseAlert,
      clearSupabaseAlert,
      llmErrorAlert,
      clearLlmErrorAlert,
      data,
      chatMode,
      setChatMode,
      append,
      designScheme,
      setDesignScheme,
      selectedElement,
      setSelectedElement,
      addToolResult = () => {
        throw new Error('addToolResult not implemented');
      },
      onWebSearchResult,
      clearMessages,
      setInput,
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const showWorkbench = useStore(workbenchStore.showWorkbench);
    useAutoFix();

    const [apiKeys, setApiKeys] = useState<Record<string, string>>(getApiKeysFromCookies());
    const [modelList, setModelList] = useState<ModelInfo[]>([]);
    const [isModelSettingsCollapsed, setIsModelSettingsCollapsed] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [transcript, setTranscript] = useState('');
    const [isModelLoading, setIsModelLoading] = useState<string | undefined>('all');
    const [progressAnnotations, setProgressAnnotations] = useState<ProgressAnnotation[]>([]);
    const expoUrl = useStore(expoUrlAtom);
    const [qrModalOpen, setQrModalOpen] = useState(false);

    useEffect(() => {
      if (expoUrl) {
        setQrModalOpen(true);
      }
    }, [expoUrl]);

    useEffect(() => {
      if (data) {
        const progressList = data.filter(
          (x) => typeof x === 'object' && (x as any).type === 'progress',
        ) as ProgressAnnotation[];
        setProgressAnnotations(progressList);
      }
    }, [data]);
    useEffect(() => {
      console.log(transcript);
    }, [transcript]);

    useEffect(() => {
      onStreamingChange?.(isStreaming);
    }, [isStreaming, onStreamingChange]);

    const speech = useSpeechSynthesis();

    useEffect(() => {
      if (isStreaming || !speech.isEnabled) {
        return;
      }

      const lastAssistant = [...(messages ?? [])].reverse().find((m) => m.role === 'assistant' && m.content);
      let timer: ReturnType<typeof setTimeout> | undefined;

      if (lastAssistant?.content) {
        timer = setTimeout(() => {
          speech.speak(lastAssistant.content);
        }, 250);
      }

      // eslint-disable-next-line consistent-return
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }, [isStreaming, messages, speech]);

    useEffect(() => {
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');

          setTranscript(transcript);

          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: transcript },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }, []);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        let parsedApiKeys: Record<string, string> | undefined = {};

        try {
          parsedApiKeys = getApiKeysFromCookies();
          setApiKeys(parsedApiKeys);
        } catch (error) {
          console.error('Error loading API keys from cookies:', error);
          Cookies.remove('apiKeys');
        }

        setIsModelLoading('all');
        fetch('/api/models')
          .then((response) => response.json())
          .then((data) => {
            const typedData = data as { modelList: ModelInfo[] };
            setModelList(typedData.modelList);
          })
          .catch((error) => {
            console.error('Error fetching model list:', error);
          })
          .finally(() => {
            setIsModelLoading(undefined);
          });
      }
    }, [providerList, provider]);

    const onApiKeysChange = async (providerName: string, apiKey: string) => {
      const newApiKeys = { ...apiKeys, [providerName]: apiKey };
      setApiKeys(newApiKeys);
      Cookies.set('apiKeys', JSON.stringify(newApiKeys));

      setIsModelLoading(providerName);

      let providerModels: ModelInfo[] = [];

      try {
        const response = await fetch(`/api/models/${encodeURIComponent(providerName)}`);
        const data = await response.json();
        providerModels = (data as { modelList: ModelInfo[] }).modelList;
      } catch (error) {
        console.error('Error loading dynamic models for:', providerName, error);
      }

      // Only update models for the specific provider
      setModelList((prevModels) => {
        const otherModels = prevModels.filter((model) => model.provider !== providerName);
        return [...otherModels, ...providerModels];
      });
      setIsModelLoading(undefined);
    };

    const startListening = () => {
      if (recognition) {
        recognition.start();
        setIsListening(true);
      }
    };

    const stopListening = () => {
      if (recognition) {
        recognition.stop();
        setIsListening(false);
      }
    };

    const handleSendMessage = (event: React.UIEvent, messageInput?: string) => {
      if (sendMessage) {
        sendMessage(event, messageInput);
        setSelectedElement?.(null);

        if (recognition) {
          recognition.abort(); // Stop current recognition
          setTranscript(''); // Clear transcript
          setIsListening(false);

          // Clear the input by triggering handleInputChange with empty value
          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: '' },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        }
      }
    };

    const handleFileUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];

        if (file) {
          const reader = new FileReader();

          reader.onload = (e) => {
            const base64Image = e.target?.result as string;
            setUploadedFiles?.([...uploadedFiles, file]);
            setImageDataList?.([...imageDataList, base64Image]);
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;

      if (!items) {
        return;
      }

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();

          const file = item.getAsFile();

          if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
              const base64Image = e.target?.result as string;
              setUploadedFiles?.([...uploadedFiles, file]);
              setImageDataList?.([...imageDataList, base64Image]);
            };
            reader.readAsDataURL(file);
          }

          break;
        }
      }
    };

    const baseChat = (
      <div
        ref={ref}
        className={classNames(styles.BaseChat, 'relative flex h-full w-full overflow-hidden')}
        data-chat-visible={showChat}
      >
        <LandingSidebar />
        {!chatStarted ? (
          <div className="flex-1 flex flex-col bg-bolt-elements-background-depth-1 relative overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-end overflow-x-hidden overflow-y-auto modern-scrollbar h-full relative">
              {/* Top Navigation Links */}
              <div className="absolute top-0 right-0 p-6 z-20 hidden md:flex items-center gap-6">
                {['Community', 'Enterprise', 'Resources', 'Careers', 'Pricing'].map((link) => (
                  <button
                    key={link}
                    type="button"
                    onClick={() => toast.info(`${link} page coming soon`)}
                    className="bg-transparent border-none p-0 text-xs font-medium text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                  >
                    {link === 'Resources' ? (
                      <span className="flex items-center gap-1">
                        {link} <span className="i-ph:caret-down text-[8px]" />
                      </span>
                    ) : (
                      link
                    )}
                  </button>
                ))}
              </div>

              {/* Earth horizon arc — expanding ripple */}
              <div
                className="absolute bottom-0 left-1/2 w-[600px] sm:w-[900px] h-[350px] sm:h-[500px] rounded-full blur-md pointer-events-none z-0 animate-arc-ripple"
                style={
                  {
                    '--arc-opacity-base': '0.25',
                    '--arc-opacity-peak': '0.5',
                    background: 'radial-gradient(ellipse at center bottom, #3b82f6 0%, rgba(59, 130, 246, 0) 80%)',
                  } as React.CSSProperties
                }
              />
              <div
                className="absolute bottom-0 left-1/2 w-[250px] sm:w-[450px] h-[150px] sm:h-[250px] rounded-full pointer-events-none z-0 animate-arc-ripple-inner"
                style={{
                  background: 'radial-gradient(ellipse at center bottom, #60a5fa 0%, rgba(96, 165, 250, 0) 70%)',
                }}
              />

              <div className="relative z-10 w-full flex flex-col items-center justify-center gap-4 max-w-3xl mx-auto px-4 pt-8">
                <LandingHero />
                <div className="w-full">
                  <ChatBox
                    isModelSettingsCollapsed={isModelSettingsCollapsed}
                    setIsModelSettingsCollapsed={setIsModelSettingsCollapsed}
                    provider={provider}
                    setProvider={setProvider}
                    providerList={providerList || (PROVIDER_LIST as ProviderInfo[])}
                    model={model}
                    setModel={setModel}
                    modelList={modelList}
                    apiKeys={apiKeys}
                    isModelLoading={isModelLoading}
                    onApiKeysChange={onApiKeysChange}
                    uploadedFiles={uploadedFiles || []}
                    setUploadedFiles={setUploadedFiles}
                    imageDataList={imageDataList || []}
                    setImageDataList={setImageDataList}
                    textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement | undefined>}
                    input={input}
                    handleInputChange={handleInputChange}
                    handlePaste={handlePaste}
                    TEXTAREA_MIN_HEIGHT={TEXTAREA_MIN_HEIGHT}
                    TEXTAREA_MAX_HEIGHT={chatStarted ? 400 : 200}
                    isStreaming={isStreaming}
                    handleStop={handleStop}
                    handleSendMessage={handleSendMessage}
                    isListening={isListening}
                    startListening={startListening}
                    stopListening={stopListening}
                    ttsEnabled={speech.isEnabled}
                    ttsSpeaking={speech.isSpeaking}
                    toggleTts={() => {
                      if (speech.isSpeaking) {
                        speech.cancel();
                      } else {
                        speech.setEnabled(!speech.isEnabled);
                      }
                    }}
                    chatStarted={chatStarted}
                    exportChat={exportChat}
                    qrModalOpen={qrModalOpen}
                    setQrModalOpen={setQrModalOpen}
                    handleFileUpload={handleFileUpload}
                    enhancingPrompt={enhancingPrompt}
                    enhancePrompt={enhancePrompt}
                    onWebSearchResult={onWebSearchResult}
                    chatMode={chatMode}
                    setChatMode={setChatMode}
                    designScheme={designScheme}
                    setDesignScheme={setDesignScheme}
                    selectedElement={selectedElement}
                    setSelectedElement={setSelectedElement}
                    clearMessages={clearMessages || (() => undefined)}
                    setInput={setInput || ((_v: string) => undefined)}
                  />
                </div>
                <LandingBottom />
                <TeamTemplateDialog />
                {(deployAlert || supabaseAlert || actionAlert || llmErrorAlert) && (
                  <div className="w-full max-w-3xl mx-auto px-4 pb-8">
                    <div className="flex flex-col gap-2">
                      {deployAlert && (
                        <DeployChatAlert
                          alert={deployAlert}
                          clearAlert={() => clearDeployAlert?.()}
                          postMessage={(message: string | undefined) => {
                            sendMessage?.({} as any, message);
                            clearSupabaseAlert?.();
                          }}
                        />
                      )}
                      {supabaseAlert && (
                        <SupabaseChatAlert
                          alert={supabaseAlert}
                          clearAlert={() => clearSupabaseAlert?.()}
                          postMessage={(message) => {
                            sendMessage?.({} as any, message);
                            clearSupabaseAlert?.();
                          }}
                        />
                      )}
                      {actionAlert && (
                        <ChatAlert
                          alert={actionAlert}
                          clearAlert={() => clearAlert?.()}
                          postMessage={(message) => {
                            sendMessage?.({} as any, message);
                            clearAlert?.();
                          }}
                        />
                      )}
                      {llmErrorAlert && (
                        <LlmErrorAlert alert={llmErrorAlert} clearAlert={() => clearLlmErrorAlert?.()} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row overflow-hidden flex-1 h-full bg-bolt-elements-background-depth-1">
            <div
              className={classNames(
                styles.Chat,
                'flex flex-col flex-1 lg:min-w-[var(--chat-min-width)] h-full overflow-hidden border-r',
                { 'border-bolt-elements-borderColor': showWorkbench },
              )}
            >
              <Header />
              <StickToBottom
                className="flex-1 flex flex-col modern-scrollbar pt-2 pr-3 pb-0 pl-3"
                resize="smooth"
                initial="smooth"
              >
                <div className="flex-1 min-h-0 scroll-area-wrapper">
                  <StickToBottom.Content className="flex flex-col gap-4 relative">
                    <ClientOnly>
                      {() => (
                        <Messages
                          className="flex flex-col w-full flex-1 max-w-chat pb-4 mx-auto z-1"
                          messages={messages}
                          isStreaming={isStreaming}
                          append={append}
                          chatMode={chatMode}
                          setChatMode={setChatMode}
                          provider={provider}
                          model={model}
                          addToolResult={addToolResult}
                        />
                      )}
                    </ClientOnly>
                    <ScrollToBottom />
                  </StickToBottom.Content>
                </div>
                <div className="mt-auto flex flex-col gap-2 w-full max-w-chat mx-auto z-prompt pb-2">
                  <div className="flex flex-col gap-2">
                    {deployAlert && (
                      <DeployChatAlert
                        alert={deployAlert}
                        clearAlert={() => clearDeployAlert?.()}
                        postMessage={(message: string | undefined) => {
                          sendMessage?.({} as any, message);
                          clearSupabaseAlert?.();
                        }}
                      />
                    )}
                    {supabaseAlert && (
                      <SupabaseChatAlert
                        alert={supabaseAlert}
                        clearAlert={() => clearSupabaseAlert?.()}
                        postMessage={(message) => {
                          sendMessage?.({} as any, message);
                          clearSupabaseAlert?.();
                        }}
                      />
                    )}
                    {actionAlert && (
                      <ChatAlert
                        alert={actionAlert}
                        clearAlert={() => clearAlert?.()}
                        postMessage={(message) => {
                          sendMessage?.({} as any, message);
                          clearAlert?.();
                        }}
                      />
                    )}
                    {llmErrorAlert && <LlmErrorAlert alert={llmErrorAlert} clearAlert={() => clearLlmErrorAlert?.()} />}
                  </div>
                  <AutoFixIndicator />
                  {progressAnnotations && <ProgressCompilation data={progressAnnotations} />}
                  <ChatBox
                    isModelSettingsCollapsed={isModelSettingsCollapsed}
                    setIsModelSettingsCollapsed={setIsModelSettingsCollapsed}
                    provider={provider}
                    setProvider={setProvider}
                    providerList={providerList || (PROVIDER_LIST as ProviderInfo[])}
                    model={model}
                    setModel={setModel}
                    modelList={modelList}
                    apiKeys={apiKeys}
                    isModelLoading={isModelLoading}
                    onApiKeysChange={onApiKeysChange}
                    uploadedFiles={uploadedFiles}
                    setUploadedFiles={setUploadedFiles}
                    imageDataList={imageDataList}
                    setImageDataList={setImageDataList}
                    textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement | undefined>}
                    input={input}
                    handleInputChange={handleInputChange}
                    handlePaste={handlePaste}
                    TEXTAREA_MIN_HEIGHT={TEXTAREA_MIN_HEIGHT}
                    TEXTAREA_MAX_HEIGHT={TEXTAREA_MAX_HEIGHT}
                    isStreaming={isStreaming}
                    handleStop={handleStop}
                    handleSendMessage={handleSendMessage}
                    enhancingPrompt={enhancingPrompt}
                    enhancePrompt={enhancePrompt}
                    isListening={isListening}
                    startListening={startListening}
                    stopListening={stopListening}
                    ttsEnabled={speech.isEnabled}
                    ttsSpeaking={speech.isSpeaking}
                    toggleTts={() => {
                      if (speech.isSpeaking) {
                        speech.cancel();
                      } else {
                        speech.setEnabled(!speech.isEnabled);
                      }
                    }}
                    chatStarted={chatStarted}
                    exportChat={exportChat}
                    qrModalOpen={qrModalOpen}
                    setQrModalOpen={setQrModalOpen}
                    handleFileUpload={handleFileUpload}
                    chatMode={chatMode}
                    setChatMode={setChatMode}
                    designScheme={designScheme}
                    setDesignScheme={setDesignScheme}
                    selectedElement={selectedElement}
                    setSelectedElement={setSelectedElement}
                    onWebSearchResult={onWebSearchResult}
                    clearMessages={clearMessages || (() => undefined)}
                    setInput={setInput || ((_v: string) => undefined)}
                  />
                </div>
              </StickToBottom>
            </div>
            <ClientOnly>
              {() => (
                <Workbench
                  chatStarted={chatStarted}
                  isStreaming={isStreaming}
                  setSelectedElement={setSelectedElement}
                />
              )}
            </ClientOnly>
          </div>
        )}
        <ImageGenerator />
        <ImageEditor />
      </div>
    );

    return <Tooltip.Provider delayDuration={200}>{baseChat}</Tooltip.Provider>;
  },
);

function ScrollToBottom() {
  const { isAtBottom, scrollToBottom, state } = useStickToBottomContext();
  const hasOverflow = state.targetScrollTop > 0;

  return (
    hasOverflow &&
    !isAtBottom && (
      <>
        <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-bolt-elements-background-depth-1 to-transparent h-20 z-10" />
        <button
          className="sticky z-50 bottom-0 left-0 right-0 text-4xl rounded-lg px-1.5 py-0.5 flex items-center justify-center mx-auto gap-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary text-sm"
          onClick={() => scrollToBottom()}
        >
          Go to last message
          <span className="i-ph:arrow-down animate-bounce" />
        </button>
      </>
    )
  );
}
