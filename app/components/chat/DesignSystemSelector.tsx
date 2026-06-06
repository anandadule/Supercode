import { useStore } from '@nanostores/react';
import { designSystems } from '~/lib/common/prompts/design-systems';
import {
  activeDesignSystems,
  designSystemSelectorOpen,
  toggleDesignSystem,
  isDesignSystemActive,
} from '~/lib/stores/designSystems';
import { promptLibraryOpen } from '~/lib/stores/promptLibrary';
import { imageGenDialogOpen } from '~/lib/stores/imageGeneration';
import { figmaDialogOpen } from '~/lib/stores/figma';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { WebSearch } from './WebSearch.client';
import { McpTools } from './MCPTools';
import { ColorSchemeDialog } from '~/components/ui/ColorSchemeDialog';
import type { DesignScheme } from '~/types/design-scheme';

interface DesignSystemSelectorProps {
  enhancePrompt?: () => void;
  enhancingPrompt?: boolean;
  input?: string;
  handleFileUpload?: () => void;
  onWebSearchResult?: (result: string) => void;
  isStreaming?: boolean;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  ttsEnabled?: boolean;
  ttsSpeaking?: boolean;
  toggleTts?: () => void;
}

export function DesignSystemSelector({
  enhancePrompt,
  enhancingPrompt,
  input,
  handleFileUpload,
  onWebSearchResult,
  isStreaming,
  designScheme,
  setDesignScheme,
  ttsEnabled,
  ttsSpeaking,
  toggleTts,
}: DesignSystemSelectorProps) {
  const isOpen = useStore(designSystemSelectorOpen);
  const activeIds = useStore(activeDesignSystems);
  const hasActive = activeIds.length > 0;

  const iconBtnClass =
    '!bg-bolt-elements-background-depth-2 hover:!bg-bolt-elements-background-depth-3 !border !border-bolt-elements-borderColor !rounded-lg !p-1.5 text-bolt-elements-textTertiary hover:!text-bolt-elements-textPrimary';

  return (
    <div className="relative">
      <IconButton
        title="Design Systems"
        className={classNames(
          '!bg-bolt-elements-background-depth-2 hover:!bg-bolt-elements-background-depth-3 !border !border-bolt-elements-borderColor !rounded-lg !p-1.5 text-bolt-elements-textTertiary hover:!text-bolt-elements-textPrimary transition-all',
          hasActive ? 'text-bolt-elements-item-contentAccent' : '',
        )}
        onClick={() => designSystemSelectorOpen.set(!isOpen)}
      >
        <div className="relative">
          <div className="i-ph:swatches text-xl" />
          {hasActive && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent-500 rounded-full border-2 border-bolt-elements-background-depth-1" />
          )}
        </div>
      </IconButton>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => designSystemSelectorOpen.set(false)} />
          <div className="absolute bottom-full mb-1 left-0 z-50 w-72 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg shadow-xl overflow-visible">
            <div className="px-3 py-2 border-b border-bolt-elements-borderColor">
              <p className="text-sm font-medium text-bolt-elements-textPrimary">Design Systems</p>
              <p className="text-xs text-bolt-elements-textTertiary mt-0.5">
                Inject component knowledge into AI prompts
              </p>
            </div>
            <div className="p-2 flex flex-col gap-1">
              {designSystems.map((ds) => {
                const active = isDesignSystemActive(ds.id);

                return (
                  <button
                    key={ds.id}
                    onClick={() => toggleDesignSystem(ds.id)}
                    className={classNames(
                      'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      active
                        ? 'bg-accent-500/10 text-accent-500'
                        : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3',
                    )}
                  >
                    <div
                      className={classNames(
                        'mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                        active ? 'bg-accent-500 border-accent-500' : 'border-bolt-elements-borderColor',
                      )}
                    >
                      {active && <div className="i-ph:check text-xs text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ds.name}</p>
                      <p className="text-xs text-bolt-elements-textTertiary mt-0.5 line-clamp-2">{ds.description}</p>
                      {active && ds.components.length > 0 && (
                        <p className="text-xs text-accent-500 mt-1">{ds.components.length} components available</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {hasActive && (
              <div className="px-3 py-2 border-t border-bolt-elements-borderColor">
                <p className="text-xs text-bolt-elements-textTertiary">
                  {activeIds.length} design system{activeIds.length !== 1 ? 's' : ''} active
                </p>
              </div>
            )}
            <div className="border-t border-bolt-elements-borderColor" />
            <div className="p-2">
              <p className="text-[10px] font-medium text-bolt-elements-textTertiary uppercase tracking-wider mb-2">
                Tools
              </p>
              <div className="flex flex-wrap gap-1 items-center">
                <IconButton
                  title="Prompt Library"
                  className={iconBtnClass}
                  onClick={() => {
                    promptLibraryOpen.set(true);
                    designSystemSelectorOpen.set(false);
                  }}
                >
                  <div className="i-ph:book-open-text text-sm" />
                </IconButton>
                <IconButton
                  title="Enhance prompt"
                  disabled={!input || input.length === 0 || enhancingPrompt}
                  className={iconBtnClass}
                  onClick={() => {
                    if (input && input.length > 0) {
                      enhancePrompt?.();
                      toast.success('Prompt enhanced!');
                    }

                    designSystemSelectorOpen.set(false);
                  }}
                >
                  {enhancingPrompt ? (
                    <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-sm" />
                  ) : (
                    <div className="i-bolt:stars text-sm" />
                  )}
                </IconButton>
                <IconButton
                  title="Upload file"
                  className={iconBtnClass}
                  onClick={() => {
                    handleFileUpload?.();
                    designSystemSelectorOpen.set(false);
                  }}
                >
                  <div className="i-ph:paperclip text-sm" />
                </IconButton>
                <WebSearch onSearchResult={(result) => onWebSearchResult?.(result)} disabled={isStreaming} />
                <IconButton
                  title="Import from Figma"
                  className={iconBtnClass}
                  onClick={() => {
                    figmaDialogOpen.set(true);
                    designSystemSelectorOpen.set(false);
                  }}
                >
                  <div className="i-ph:figma-logo text-sm" />
                </IconButton>
                <IconButton
                  title="Generate Image"
                  className={iconBtnClass}
                  onClick={() => {
                    imageGenDialogOpen.set(true);
                    designSystemSelectorOpen.set(false);
                  }}
                >
                  <div className="i-ph:image-square text-sm" />
                </IconButton>
                <ColorSchemeDialog designScheme={designScheme} setDesignScheme={setDesignScheme} />
                {ttsEnabled !== undefined && (
                  <IconButton
                    title={
                      ttsSpeaking
                        ? 'Stop reading aloud'
                        : ttsEnabled
                          ? 'Disable text-to-speech for replies'
                          : 'Enable text-to-speech for replies'
                    }
                    className={classNames(iconBtnClass, {
                      'text-accent-500 !border-accent-500/30': Boolean(ttsEnabled) || Boolean(ttsSpeaking),
                    })}
                    onClick={() => {
                      toggleTts?.();
                      designSystemSelectorOpen.set(false);
                    }}
                    disabled={Boolean(isStreaming) && !ttsSpeaking}
                  >
                    <div
                      className={classNames('text-sm', {
                        'i-ph:stop-circle-fill animate-pulse': Boolean(ttsSpeaking),
                        'i-ph:speaker-high-fill': Boolean(ttsEnabled) && !ttsSpeaking,
                        'i-ph:speaker-high': !ttsEnabled,
                      })}
                    />
                  </IconButton>
                )}
                <McpTools />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
