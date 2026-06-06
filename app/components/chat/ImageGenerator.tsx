import React, { useState, useRef, useEffect } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Dialog, DialogTitle } from '~/components/ui/Dialog';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { imageGenDialogOpen } from '~/lib/stores/imageGeneration';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';

const IMAGE_SIZES = ['256x256', '512x512', '1024x1024'] as const;
const API_KEY_STORAGE_KEY = 'bolt_openai_api_key';

export function ImageGenerator() {
  const isOpen = useStore(imageGenDialogOpen);

  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<string>('1024x1024');
  const [style, setStyle] = useState<string>('vivid');
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Focus the prompt textarea when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => promptRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load saved API key on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(API_KEY_STORAGE_KEY);

      if (saved) {
        setApiKey(saved);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const handleClose = () => {
    imageGenDialogOpen.set(false);
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);

    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch {
      // localStorage not available
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    setIsGenerating(true);
    setError(undefined);
    setGeneratedUrl(undefined);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          size,
          style,
          apiKey: apiKey || undefined,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedUrl(data.url || '');
      toast.success('Image generated!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate image';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleAddToProject = async () => {
    if (!generatedUrl) {
      return;
    }

    try {
      const timestamp = Date.now();
      const fileName = `/public/generated/image-${timestamp}.png`;

      // Fetch the image and convert to Uint8Array for WebContainer
      const response = await fetch(generatedUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      await workbenchStore.createFile(fileName, uint8Array);
      toast.success('Image added to project at ' + fileName);
    } catch (err) {
      console.error('Failed to add image to project:', err);
      toast.error('Failed to add image to project. Try downloading instead.');
    }
  };

  const handleDownload = async () => {
    if (!generatedUrl) {
      return;
    }

    try {
      const response = await fetch(generatedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (err) {
      console.error('Failed to download image:', err);
      toast.error('Failed to download image');
    }
  };

  return (
    <RadixDialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <Dialog onClose={handleClose} onBackdrop={handleClose}>
        <div className="p-6">
          <DialogTitle>Generate Image</DialogTitle>

          <div className="mt-4 space-y-4">
            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">Prompt</label>
              <textarea
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the image you want to generate..."
                rows={3}
                className={classNames(
                  'w-full px-3 py-2 text-sm rounded-lg resize-none',
                  'border border-bolt-elements-borderColor',
                  'bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary',
                  'placeholder-bolt-elements-textTertiary',
                  'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                )}
              />
              <p className="mt-1 text-xs text-bolt-elements-textTertiary">Press Cmd+Enter to generate</p>
            </div>

            {/* Options row */}
            <div className="flex gap-3">
              {/* Size */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">Size</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className={classNames(
                    'w-full px-3 py-2 text-sm rounded-lg',
                    'border border-bolt-elements-borderColor',
                    'bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary',
                    'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                  )}
                >
                  {IMAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className={classNames(
                    'w-full px-3 py-2 text-sm rounded-lg',
                    'border border-bolt-elements-borderColor',
                    'bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary',
                    'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                  )}
                >
                  <option value="vivid">Vivid</option>
                  <option value="natural">Natural</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>

            {/* API Key (optional) */}
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">
                OpenAI API Key <span className="text-bolt-elements-textTertiary">(optional, for DALL-E 3)</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => saveApiKey(e.target.value)}
                placeholder="sk-..."
                className={classNames(
                  'w-full px-3 py-2 text-sm rounded-lg',
                  'border border-bolt-elements-borderColor',
                  'bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary',
                  'placeholder-bolt-elements-textTertiary',
                  'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                )}
              />
              <p className="mt-1 text-xs text-bolt-elements-textTertiary">
                Without a key, a placeholder image will be generated
              </p>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={classNames(
                'w-full',
                'bg-accent-500 text-white hover:bg-accent-600',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="i-svg-spinners:90-ring-with-bg text-xl animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <div className="i-ph:magic-wand text-lg" />
                  Generate
                </span>
              )}
            </Button>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                <div className="flex items-start gap-2">
                  <div className="i-ph:warning-circle text-lg flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Preview */}
            {generatedUrl && (
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Preview</label>
                <div className="relative rounded-lg overflow-hidden border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
                  <img
                    src={generatedUrl}
                    alt={prompt}
                    className="w-full h-auto max-h-80 object-contain"
                    onError={() => {
                      toast.error('Failed to load image preview');
                    }}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleAddToProject}
                    className={classNames(
                      'flex-1',
                      'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent',
                      'hover:bg-bolt-elements-button-primary-backgroundHover',
                    )}
                  >
                    <div className="i-ph:package text-base" />
                    <span className="ml-1.5">Add to Project</span>
                  </Button>
                  <Button onClick={handleDownload} variant="outline" className="flex-1">
                    <div className="i-ph:download-simple text-base" />
                    <span className="ml-1.5">Download</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </RadixDialog.Root>
  );
}
